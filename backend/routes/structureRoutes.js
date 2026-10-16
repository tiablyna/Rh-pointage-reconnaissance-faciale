const express = require("express");
const router  = express.Router();
const { getAllStructures, getStructureById, creerStructure, modifierStructure, supprimerStructure } = require("../controllers/structureController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/",      verifyToken, getAllStructures);
router.get("/:id",   verifyToken, getStructureById);
router.post("/",     verifyToken, creerStructure);
router.put("/:id",   verifyToken, modifierStructure);
router.delete("/:id",verifyToken, supprimerStructure);

module.exports = router;