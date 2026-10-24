const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { creerEmployeTest, enregistrerEmbeddingsTest } = require("../controllers/demoController");

// Même config multer que pour les employés classiques.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/;
    if (types.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Seules les images sont acceptées"));
  },
});

// Volontairement SANS verifyToken : un visiteur du portfolio n'est pas connecté.
router.post("/employe-test", upload.array("photos", 5), creerEmployeTest);
router.patch("/employe-test/:id/embeddings", enregistrerEmbeddingsTest);

module.exports = router;