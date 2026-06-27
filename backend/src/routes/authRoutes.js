const express = require("express");
const { register, login, getProfile } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/validationRules");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getProfile);

module.exports = router;
