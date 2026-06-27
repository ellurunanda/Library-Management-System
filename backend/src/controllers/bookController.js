const { validationResult } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");

const getBooks = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 1000 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { isbn: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = { $regex: `^${category}$`, $options: "i" };
  }

  const currentPage = Number(page);
  const pageSize = Number(limit);

  const [books, total] = await Promise.all([
    Book.find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Book.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: books,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  });
});

const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  res.json({ success: true, data: book });
});

const createBook = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { title, author, isbn, category, quantity } = req.body;
  const book = await Book.create({
    title,
    author,
    isbn,
    category,
    quantity: Number(quantity),
    availableQuantity: Number(quantity),
  });

  res.status(201).json({ success: true, message: "Book created successfully", data: book });
});

const updateBook = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  const { title, author, isbn, category, quantity } = req.body;
  const previousQuantity = book.quantity;
  const previousAvailable = book.availableQuantity;
  const borrowedCount = previousQuantity - previousAvailable;
  const newQuantity = Number(quantity);

  if (newQuantity < borrowedCount) {
    return res.status(400).json({ success: false, message: "Quantity cannot be lower than borrowed copies" });
  }

  book.title = title;
  book.author = author;
  book.isbn = isbn;
  book.category = category;
  book.quantity = newQuantity;
  book.availableQuantity = newQuantity - borrowedCount;

  await book.save();
  res.json({ success: true, message: "Book updated successfully", data: book });
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  const activeBorrows = await Borrow.countDocuments({ bookId: book._id, status: "borrowed" });
  if (activeBorrows > 0) {
    return res.status(400).json({ success: false, message: "Cannot delete a book that is currently borrowed" });
  }

  await book.deleteOne();
  res.json({ success: true, message: "Book deleted successfully" });
});

const borrowBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  if (book.availableQuantity <= 0) {
    return res.status(400).json({ success: false, message: "Book is currently unavailable" });
  }

  const alreadyBorrowed = await Borrow.findOne({
    memberId: req.user.id,
    bookId: book._id,
    status: "borrowed",
  });

  if (alreadyBorrowed) {
    return res.status(400).json({ success: false, message: "You already borrowed this book" });
  }

  const borrowRecord = await Borrow.create({
    memberId: req.user.id,
    bookId: book._id,
    borrowDate: new Date(),
    status: "borrowed",
  });

  book.availableQuantity -= 1;
  await book.save();

  res.status(201).json({ success: true, message: "Book borrowed successfully", data: borrowRecord });
});

const returnBook = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  
  // Find the borrow record first
  const borrowRecord = await Borrow.findById(borrowId);
  if (!borrowRecord) {
    return res.status(404).json({ success: false, message: "Borrow record not found" });
  }

  if (borrowRecord.memberId.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: "Not authorized to return this book" });
  }

  if (borrowRecord.status === "returned") {
    return res.status(400).json({ success: false, message: "This book has already been returned" });
  }

  // Update borrow record
  borrowRecord.status = "returned";
  borrowRecord.returnDate = new Date();
  await borrowRecord.save();

  // Try to update book availability if book still exists
  const book = await Book.findById(borrowRecord.bookId);
  if (book) {
    book.availableQuantity += 1;
    await book.save();
  }

  res.json({ success: true, message: "Book returned successfully", data: borrowRecord });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
};
