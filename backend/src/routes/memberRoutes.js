const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { getMembers, deleteMember, getMyBorrowedBooks } = require("../controllers/memberController");

const router = express.Router();

router.get("/", protect, requireRole("librarian"), getMembers);
router.delete("/:id", protect, requireRole("librarian"), deleteMember);
router.get("/me/books", protect, requireRole("member"), getMyBorrowedBooks);

module.exports = router;
