require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const connectDatabase = require("../config/db");
const Book = require("../models/Book");

const seed = async () => {
  await connectDatabase();

  const csvPath = path.join(__dirname, "books_dataset_500.csv");
  const books = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        books.push({
          title: row.title,
          author: row.author,
          isbn: row.isbn,
          category: row.category,
          quantity: parseInt(row.quantity) || 1,
          availableQuantity: parseInt(row.availableQuantity) || 1,
        });
      })
      .on("end", async () => {
        try {
          console.log(`📖 Processing ${books.length} books from CSV...`);

          let addedCount = 0;
          let skippedCount = 0;

          // Check each book and add only if not exists
          for (const book of books) {
            const exists = await Book.findOne({ isbn: book.isbn });
            if (!exists) {
              await Book.create(book);
              addedCount++;
            } else {
              skippedCount++;
            }
          }

          console.log(`✅ Seed completed successfully!`);
          console.log(`✓ Added ${addedCount} new books`);
          if (skippedCount > 0) {
            console.log(`✓ Skipped ${skippedCount} books (already exist)`);
          }
          console.log(`📚 Total books in database: ${await Book.countDocuments()}`);
          console.log(`\n💡 Create your own accounts from the application!`);
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during seeding:", error.message);
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("❌ CSV read error:", error.message);
        reject(error);
      });
  });
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error.message);
  process.exit(1);
});
