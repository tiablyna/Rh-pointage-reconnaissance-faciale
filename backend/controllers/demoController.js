// controllers/demoController.js
//
// v1.3 — Flux PUBLIC (sans authentification) permettant à un visiteur du
// portfolio (un recruteur, par exemple) de s'inscrire comme "employé de
// test" avec sa propre webcam, puis de tester le pointage par
// reconnaissance faciale en direct.
//
// Toute donnée créée ici porte est_test: true, pour la distinguer des
// vrais employés et pour qu'un visiteur ne puisse jamais modifier les
// données biométriques de quelqu'un d'autre via ce flux public.

const fs = require("fs");
const path = require("path");
const Employe = require("../models/Employe");
const Poste = require("../models/Poste");
const Structure = require("../models/Structure");
const bcrypt = require("bcryptjs");

// Trouve (ou crée au tout premier appel) le poste générique utilisé pour
// tous les employés de démo, afin de satisfaire la contrainte "poste_actuel
// requis" du modèle Employe sans demander ce choix au visiteur.
const getOuCreerPosteDemo = async () => {
  let structure = await Structure.findOne({ nom_departement: "Démo portfolio" });
  if (!structure) {
    structure = await Structure.create({
      nom_departement: "Démo portfolio",
      description: "Structure utilisée pour les comptes de test créés depuis la démo publique.",
      STRacro: "DEMO",
    });
  }

  let poste = await Poste.findOne({ intitule: "Visiteur (démo)", structure: structure._id });
  if (!poste) {
    poste = await Poste.create({
      intitule: "Visiteur (démo)",
      niveau: "Démo",
      description: "Poste générique attribué aux employés de test créés via la démo publique.",
      structure: structure._id,
    });
  }
  return poste._id;
};

// POST /api/demo/employe-test  (PUBLIC)
const creerEmployeTest = async (req, res) => {
  try {
    const photos = (req.files || []).map((f) => f.filename);
    if (photos.length < 3) {
      photos.forEach((p) => {
        const chemin = path.join(__dirname, "../uploads", p);
        if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      });
      return res.status(400).json({ message: "3 photos sont requises pour s'inscrire à la démo." });
    }

    const prenom = (req.body.prenom || "Visiteur").trim().slice(0, 40);
    const nom = (req.body.nom || "Démo").trim().slice(0, 40);

    const suffixe = Date.now();
    const motDePasseAleatoire = Math.random().toString(36).slice(2, 12);
    const hashedPassword = await bcrypt.hash(motDePasseAleatoire, 10);

    const poste_actuel = await getOuCreerPosteDemo();

    const employe = await Employe.create({
      matricule: `TEST-${suffixe}`,
      nom,
      prenom,
      email: `demo-${suffixe}@entreprise-test.dz`,
      mot_de_passe: hashedPassword,
      role: "employe",
      poste_actuel,
      photo: photos,
      est_test: true,
    });

    res.status(201).json({
      message: "Inscription à la démo réussie.",
      employe_id: employe._id,
      photos,
    });
  } catch (err) {
    console.error("Erreur creerEmployeTest:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/demo/employe-test/:id/embeddings  (PUBLIC, mais limité aux employés est_test)
const enregistrerEmbeddingsTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { encodages } = req.body;

    if (!Array.isArray(encodages) || encodages.length === 0) {
      return res.status(400).json({ message: "Le champ 'encodages' est requis (tableau non vide)." });
    }

    const employe = await Employe.findById(id);
    if (!employe) return res.status(404).json({ message: "Employé non trouvé." });

    // Garde-fou : cette route publique ne peut modifier QUE des comptes de
    // démo, jamais un vrai employé créé par l'admin.
    if (!employe.est_test) {
      return res.status(403).json({ message: "Cette action n'est autorisée que pour les comptes de démo." });
    }

    employe.encodages_faciaux = encodages;
    await employe.save();

    res.json({ message: "Empreintes faciales enregistrées.", employe_id: employe._id });
  } catch (err) {
    console.error("Erreur enregistrerEmbeddingsTest:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { creerEmployeTest, enregistrerEmbeddingsTest };