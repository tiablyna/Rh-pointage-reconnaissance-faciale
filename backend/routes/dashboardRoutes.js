const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/stats", verifyToken, getStats);

module.exports = router;