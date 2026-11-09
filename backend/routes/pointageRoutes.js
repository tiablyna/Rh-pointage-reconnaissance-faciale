const express = require("express");
const router = express.Router();
const { getPointagesRecents, getAssiduite } = require("../controllers/pointageController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getPointagesRecents);

router.get("/assiduite", verifyToken, getAssiduite);

module.exports = router;