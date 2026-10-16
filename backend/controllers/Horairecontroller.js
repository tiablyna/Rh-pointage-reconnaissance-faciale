const Horaire = require("../models/Horaire");

// ─── GET ALL HORAIRES ─────────────────────────────────────────────────────────
const getAllHoraires = async (req, res) => {
  try {
    const horaires = await Horaire.find().sort({ nom_horaire: 1 });
    res.json(horaires);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── GET HORAIRE BY ID ────────────────────────────────────────────────────────
const getHoraireById = async (req, res) => {
  try {
    const horaire = await Horaire.findById(req.params.id);
    if (!horaire) return res.status(404).json({ message: "Horaire non trouvé" });
    res.json(horaire);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── CRÉER HORAIRE ────────────────────────────────────────────────────────────
const creerHoraire = async (req, res) => {
  try {
    const {
      nom_horaire, type, heure_debut, heure_fin,
      nbr_heures_jour, nbr_jour_semaine, duree_pause,
      cycle_rotation, ordre_rotation
    } = req.body;
    if (!nom_horaire) return res.status(400).json({ message: "Le nom de l'horaire est obligatoire" });
    const horaire = await Horaire.create({
      nom_horaire, type, heure_debut, heure_fin,
      nbr_heures_jour, nbr_jour_semaine, duree_pause,
      cycle_rotation, ordre_rotation
    });
    res.status(201).json({ message: "Horaire créé avec succès", horaire });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── MODIFIER HORAIRE ─────────────────────────────────────────────────────────
const modifierHoraire = async (req, res) => {
  try {
    const horaire = await Horaire.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!horaire) return res.status(404).json({ message: "Horaire non trouvé" });
    res.json({ message: "Horaire modifié avec succès", horaire });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── SUPPRIMER HORAIRE ────────────────────────────────────────────────────────
const supprimerHoraire = async (req, res) => {
  try {
    const horaire = await Horaire.findByIdAndDelete(req.params.id);
    if (!horaire) return res.status(404).json({ message: "Horaire non trouvé" });
    res.json({ message: "Horaire supprimé avec succès" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllHoraires, getHoraireById, creerHoraire, modifierHoraire, supprimerHoraire };