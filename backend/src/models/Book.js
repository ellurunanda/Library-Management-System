const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.pre("validate", function syncAvailability(next) {
  if (this.availableQuantity === undefined) {
    this.availableQuantity = this.quantity;
  }

  if (this.availableQuantity > this.quantity) {
    this.availableQuantity = this.quantity;
  }

  next();
});

module.exports = mongoose.model("Book", bookSchema);
