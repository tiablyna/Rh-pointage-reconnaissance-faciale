const express = require("express");
const router = express.Router();
const { getPointagesRecents } = require("../controllers/pointageController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET http://localhost:5000/api/pointages?limit=20
router.get("/", verifyToken, getPointagesRecents);

module.exports = router;