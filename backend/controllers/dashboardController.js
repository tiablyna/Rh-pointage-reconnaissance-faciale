// controllers/dashboardController.js
//
// v1.4 — Statistiques générales pour le dashboard admin.

const Employe = require("../models/Employe");
const Pointage = require("../models/Pointage");
const { estEnRetard } = require("./pointageController");

const getStats = async (req, res) => {
  try {
    const maintenant = new Date();
    const debutJour = new Date(maintenant);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(maintenant);
    finJour.setHours(23, 59, 59, 999);
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    const [totalEmployes, totalTest, nouveauxCeMois, entrees] = await Promise.all([
      Employe.countDocuments({ est_test: { $ne: true } }),
      Employe.countDocuments({ est_test: true }),
      Employe.countDocuments({ est_test: { $ne: true }, createdAt: { $gte: debutMois } }),
      Pointage.find({ date_heure: { $gte: debutJour, $lte: finJour }, type: "entree" })
        .sort({ date_heure: 1 })
        .populate({
          path: "employe",
          select: "est_test horaire",
          populate: { path: "horaire", select: "heure_debut tolerance_retard_min" },
        }),
    ]);

    // Première entrée du jour par employé (liste triée par heure croissante).
    const premiereEntree = new Map();
    for (const p of entrees) {
      if (!p.employe || p.employe.est_test) continue;
      const id = p.employe._id.toString();
      if (!premiereEntree.has(id)) premiereEntree.set(id, p);
    }

    let enRetard = 0;
    for (const p of premiereEntree.values()) {
      if (estEnRetard(p.date_heure, p.employe.horaire)) enRetard++;
    }

    res.json({
      total_employes: totalEmployes,
      total_employes_test: totalTest,
      presents_aujourdhui: premiereEntree.size,
      en_retard_aujourdhui: enRetard,
      nouveaux_ce_mois: nouveauxCeMois,
    });
  } catch (err) {
    console.error("Erreur getStats dashboard:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats };