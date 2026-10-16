const express = require("express");
const router  = express.Router();
const { getAllHoraires, getHoraireById, creerHoraire, modifierHoraire, supprimerHoraire } = require("../controllers/Horairecontroller");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/",      verifyToken, getAllHoraires);
router.get("/:id",   verifyToken, getHoraireById);
router.post("/",     verifyToken, creerHoraire);
router.put("/:id",   verifyToken, modifierHoraire);
router.delete("/:id",verifyToken, supprimerHoraire);

module.exports = router;