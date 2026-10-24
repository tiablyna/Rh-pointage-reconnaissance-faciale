// controllers/pointageController.js
//
// v1.3 — Version volontairement simple : liste les derniers pointages.
// Le calcul de retard/assiduité/rapports mensuels (qui dépend des modules
// Horaire par équipes, Congés, Absences, Jours fériés) est réservé aux
// versions v1.4+, quand ces modules seront introduits.

const Pointage = require("../models/Pointage");

const getPointagesRecents = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const pointages = await Pointage.find()
      .sort({ date_heure: -1 })
      .limit(limit)
      .populate("employe", "nom prenom photo matricule est_test");

    res.json(pointages);
  } catch (err) {
    console.error("Erreur getPointagesRecents:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPointagesRecents };