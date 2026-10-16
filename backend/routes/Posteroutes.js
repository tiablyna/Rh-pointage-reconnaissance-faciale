const express = require("express");
const router  = express.Router();
const { getAllPostes, getPosteById, creerPoste, modifierPoste, supprimerPoste } = require("../controllers/Postecontroller");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/",      verifyToken, getAllPostes);
router.get("/:id",   verifyToken, getPosteById);
router.post("/",     verifyToken, creerPoste);
router.put("/:id",   verifyToken, modifierPoste);
router.delete("/:id",verifyToken, supprimerPoste);

module.exports = router;