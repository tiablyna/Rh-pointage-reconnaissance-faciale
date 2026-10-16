const Poste = require("../models/Poste");
const Employe = require("../models/Employe");

// ─── GET ALL POSTES ───────────────────────────────────────────────────────────
const getAllPostes = async (req, res) => {
  try {
    const { recherche, structure } = req.query;
    let filtre = {};
    if (structure) filtre.structure = structure;
    if (recherche) {
      filtre.$or = [
        { intitule: { $regex: recherche, $options: "i" } },
        { niveau:   { $regex: recherche, $options: "i" } },
      ];
    }
    const postes = await Poste.find(filtre)
      .populate("structure", "nom_departement STRacro")
      .sort({ intitule: 1 });
    res.json(postes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── GET POSTE BY ID ──────────────────────────────────────────────────────────
const getPosteById = async (req, res) => {
  try {
    const poste = await Poste.findById(req.params.id)
      .populate("structure", "nom_departement STRacro description");
    if (!poste) return res.status(404).json({ message: "Poste non trouvé" });
    res.json(poste);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── CRÉER POSTE ──────────────────────────────────────────────────────────────
const creerPoste = async (req, res) => {
  try {
    const { intitule, niveau, description, structure } = req.body;
    if (!intitule)  return res.status(400).json({ message: "L'intitulé est obligatoire" });
    if (!structure) return res.status(400).json({ message: "La structure (département) est obligatoire" });

    // Unicité : même intitulé dans la même structure
    const existe = await Poste.findOne({
      intitule:  { $regex: `^${intitule}$`, $options: "i" },
      structure
    });
    if (existe) return res.status(400).json({ message: "Ce poste existe déjà dans ce département" });

    const poste = await Poste.create({ intitule, niveau, description, structure });
    const postePopule = await Poste.findById(poste._id).populate("structure", "nom_departement STRacro");
    res.status(201).json({ message: "Poste créé avec succès", poste: postePopule });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── MODIFIER POSTE ───────────────────────────────────────────────────────────
const modifierPoste = async (req, res) => {
  try {
    const poste = await Poste.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("structure", "nom_departement STRacro");
    if (!poste) return res.status(404).json({ message: "Poste non trouvé" });
    res.json({ message: "Poste modifié avec succès", poste });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── SUPPRIMER POSTE ──────────────────────────────────────────────────────────
// Vérifie qu'aucun employé n'est affecté à ce poste
const supprimerPoste = async (req, res) => {
  try {
    const employes = await Employe.find({ poste_actuel: req.params.id });
    if (employes.length > 0)
      return res.status(400).json({ message: "Impossible de supprimer : des employés sont affectés à ce poste" });

    const poste = await Poste.findByIdAndDelete(req.params.id);
    if (!poste) return res.status(404).json({ message: "Poste non trouvé" });
    res.json({ message: "Poste supprimé avec succès" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllPostes, getPosteById, creerPoste, modifierPoste, supprimerPoste };