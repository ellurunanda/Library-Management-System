const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Borrow = require("../models/Borrow");

const getMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: "member" }).select("-password").sort({ createdAt: -1 });
  
  // Get borrowed books for each member
  const membersWithBorrows = await Promise.all(
    members.map(async (member) => {
      const borrows = await Borrow.find({ memberId: member._id, status: "borrowed" })
        .populate("bookId", "title author isbn")
        .sort({ borrowDate: -1 });
      
      return {
        ...member.toObject(),
        borrowedBooks: borrows,
      };
    })
  );

  res.json({ success: true, data: membersWithBorrows });
});

const deleteMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({ _id: req.params.id, role: "member" });

  if (!member) {
    return res.status(404).json({ success: false, message: "Member not found" });
  }

  const activeBorrows = await Borrow.countDocuments({ memberId: member._id, status: "borrowed" });
  if (activeBorrows > 0) {
    return res.status(400).json({ success: false, message: "Member has active borrowed books" });
  }

  await member.deleteOne();
  res.json({ success: true, message: "Member deleted successfully" });
});

const getMyBorrowedBooks = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find({ memberId: req.user.id, status: "borrowed" })
    .populate("bookId")
    .sort({ borrowDate: -1 });

  res.json({ success: true, data: borrows });
});

module.exports = {
  getMembers,
  deleteMember,
  getMyBorrowedBooks,
};
