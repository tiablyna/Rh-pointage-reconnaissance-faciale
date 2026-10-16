const Structure = require("../models/Structure");
const Poste = require("../models/Poste");
const Employe = require("../models/Employe");

// ─── GET ALL STRUCTURES ───────────────────────────────────────────────────────
const getAllStructures = async (req, res) => {
  try {
    const structures = await Structure.find().sort({ nom_departement: 1 });
    res.json(structures);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── GET STRUCTURE BY ID ──────────────────────────────────────────────────────
const getStructureById = async (req, res) => {
  try {
    const structure = await Structure.findById(req.params.id);
    if (!structure) return res.status(404).json({ message: "Département non trouvé" });
    res.json(structure);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── CRÉER STRUCTURE ──────────────────────────────────────────────────────────
const creerStructure = async (req, res) => {
  try {
    const { nom_departement, STRacro, description } = req.body;
    if (!nom_departement) return res.status(400).json({ message: "Le nom du département est obligatoire" });
    const existe = await Structure.findOne({ nom_departement: { $regex: `^${nom_departement}$`, $options: "i" } });
    if (existe) return res.status(400).json({ message: "Ce département existe déjà" });
    const structure = await Structure.create({ nom_departement, STRacro, description });
    res.status(201).json({ message: "Département créé avec succès", structure });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── MODIFIER STRUCTURE ───────────────────────────────────────────────────────
const modifierStructure = async (req, res) => {
  try {
    const structure = await Structure.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!structure) return res.status(404).json({ message: "Département non trouvé" });
    res.json({ message: "Département modifié avec succès", structure });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── SUPPRIMER STRUCTURE ──────────────────────────────────────────────────────
// Vérifie qu'aucun poste n'est rattaché avant de supprimer
const supprimerStructure = async (req, res) => {
  try {
    const postes = await Poste.find({ structure: req.params.id });
    if (postes.length > 0)
      return res.status(400).json({ message: "Impossible de supprimer : des postes sont rattachés à ce département" });

    const structure = await Structure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ message: "Département non trouvé" });
    res.json({ message: "Département supprimé avec succès" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllStructures, getStructureById, creerStructure, modifierStructure, supprimerStructure };