const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
} = require("../controllers/bookController");
const { bookValidation } = require("../validators/validationRules");

const router = express.Router();

router.get("/", protect, getBooks);
router.get("/:id", protect, getBookById);
router.post("/", protect, requireRole("librarian"), bookValidation, createBook);
router.put("/:id", protect, requireRole("librarian"), bookValidation, updateBook);
router.delete("/:id", protect, requireRole("librarian"), deleteBook);
router.post("/:id/borrow", protect, requireRole("member"), borrowBook);
router.post("/:id/return", protect, requireRole("member"), returnBook);

module.exports = router;
