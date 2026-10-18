const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST http://localhost:5000/api/auth/login
router.post("/login", authController.login);

module.exports = router;