const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const {
  getAllEmployes,
  getEmployeById,
  getCarriereEmploye,
  getPlanningEmploye,
  creerEmploye,
  gererCarriere,
  modifierEmploye,
  supprimerEmploye,
  importerEmployes,
} = require("../controllers/Employecontroller");
const { verifyToken } = require("../middleware/authMiddleware");

// ─── MULTER CONFIG — photos classiques (création / modification) ──────────────
const storagePhoots = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const uploadPhotos = multer({
  storage: storagePhoots,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/;
    if (types.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Seules les images sont acceptées"));
  },
});

// ─── MULTER CONFIG — import Excel + ZIP ──────────────────────────────────────
// On accepte deux champs distincts : "excel" (fichier .xlsx) et "zip" (fichier .zip)
const storageImport = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs   = require("fs");
    const dir  = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "import_" + unique + path.extname(file.originalname));
  },
});
const uploadImport = multer({
  storage: storageImport,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB pour le ZIP
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".xlsx", ".xls", ".zip"].includes(ext)) cb(null, true);
    else cb(new Error("Seuls les fichiers .xlsx, .xls et .zip sont acceptés"));
  },
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
router.get("/",                    verifyToken, getAllEmployes);
router.get("/:id",                 verifyToken, getEmployeById);
router.get("/:id/carriere",        verifyToken, getCarriereEmploye);
router.get("/:id/planning",        verifyToken, getPlanningEmploye);

router.post("/",                   verifyToken, uploadPhotos.array("photos", 10), creerEmploye);
router.put("/:id",                 verifyToken, uploadPhotos.array("photos", 10), modifierEmploye);
router.delete("/:id",              verifyToken, supprimerEmploye);
router.post("/:id/carriere",       verifyToken, gererCarriere);

// Import en masse : POST /api/employes/import
// Body multipart : champ "excel" (.xlsx) + champ "zip" (.zip)
router.post("/import/masse",       verifyToken,
  uploadImport.fields([
    { name: "excel", maxCount: 1 },
    { name: "zip",   maxCount: 1 },
  ]),
  importerEmployes
);

router.get("/calendrier/:employeId", verifyToken, (req, res) => {
  req.params.id = req.params.employeId;
  req.query.format = "calendrier";
  return getPlanningEmploye(req, res);
});

module.exports = router;