// controllers/pointageController.js

// Limite connue (v1.4) : les "jours ouvrés" sont estimés (jours de
// semaine du mois), sans jours fériés ni congés/absences validés — ces
// modules n'existent pas encore. Un employé en congé apparaît donc, à
// tort, comme absent. À corriger quand ces modules seront ajoutés.

const Pointage = require("../models/Pointage");
const Employe = require("../models/Employe");

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

// true si `date` (un pointage d'entrée) dépasse l'heure de début de
// l'horaire + la tolérance. Sans horaire assigné, on ne peut rien
// comparer : jamais en retard. Partagée avec dashboardController.
function estEnRetard(date, horaire) {
  if (!horaire?.heure_debut) return false;
  const [h, m] = horaire.heure_debut.split(":").map(Number);
  const limite = new Date(date);
  limite.setHours(h, m + (horaire.tolerance_retard_min || 0), 0, 0);
  return date > limite;
}

// Nombre de jours de semaine (lun-ven) dans un mois (mois : 1-12).
function compterJoursOuvres(annee, mois) {
  const nbJours = new Date(annee, mois, 0).getDate();
  let total = 0;
  for (let j = 1; j <= nbJours; j++) {
    const jourSemaine = new Date(annee, mois - 1, j).getDay();
    if (jourSemaine !== 0 && jourSemaine !== 6) total++;
  }
  return total;
}

const cleJour = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const getAssiduite = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    const mois = parseInt(req.query.mois) || new Date().getMonth() + 1;

    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0, 23, 59, 59, 999);
    const joursOuvres = compterJoursOuvres(annee, mois);

    const employes = await Employe.find({ est_test: { $ne: true } })
      .select("nom prenom matricule horaire")
      .populate("horaire", "heure_debut tolerance_retard_min");

    const pointages = await Pointage.find({
      date_heure: { $gte: debutMois, $lte: finMois },
      type: "entree",
    }).select("employe date_heure");

    const parEmploye = {};
    for (const p of pointages) {
      if (!p.employe) continue;
      const id = p.employe.toString();
      if (!parEmploye[id]) parEmploye[id] = [];
      parEmploye[id].push(p.date_heure);
    }

    const resultat = employes.map((emp) => {
      // Un employé peut "entrer" plusieurs fois par jour (retour de pause) :
      // seule la PREMIÈRE entrée du jour compte pour présence et retard.
      const premiereParJour = new Map();
      for (const d of parEmploye[emp._id.toString()] || []) {
        const cle = cleJour(d);
        const actuelle = premiereParJour.get(cle);
        if (!actuelle || d < actuelle) premiereParJour.set(cle, d);
      }

      let retards = 0;
      for (const d of premiereParJour.values()) {
        if (estEnRetard(d, emp.horaire)) retards++;
      }

      const joursPresents = premiereParJour.size;
      return {
        employe_id: emp._id,
        nom: emp.nom,
        prenom: emp.prenom,
        matricule: emp.matricule,
        jours_presents: joursPresents,
        jours_absents: Math.max(joursOuvres - joursPresents, 0),
        retards,
        taux_assiduite:
          joursOuvres > 0 ? Math.min(100, Math.round((joursPresents / joursOuvres) * 100)) : 0,
      };
    });

    res.json({ annee, mois, jours_ouvres: joursOuvres, employes: resultat });
  } catch (err) {
    console.error("Erreur getAssiduite:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPointagesRecents, getAssiduite, estEnRetard };