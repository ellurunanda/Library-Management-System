const { body } = require("express-validator");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const bookValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("author").trim().notEmpty().withMessage("Author is required"),
  body("isbn").trim().notEmpty().withMessage("ISBN is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity cannot be negative"),
];

module.exports = {
  registerValidation,
  loginValidation,
  bookValidation,
};
