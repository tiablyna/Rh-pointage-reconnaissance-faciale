const mongoose = require("mongoose");

const PointageSchema = new mongoose.Schema({

  // L'employé concerné
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employe",
    required: true
  },

  // "entree" ou "sortie"
  type: {
    type: String,
    enum: ["entree", "sortie"],
    required: true
  },

  // Date et heure exacte du passage
  date_heure: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Quelle caméra a détecté le passage
  // "entree" = caméra de la porte d'entrée
  // "sortie" = caméra de la porte de sortie
  camera: {
    type: String,
    enum: ["entree", "sortie"],
    required: true
  },

  // Niveau de confiance de la reconnaissance (distance)
  // Plus c'est bas, plus on est sûr que c'est la bonne personne
  confiance: {
    type: Number  // ex: 0.24 = très confiant
  },

  // Photo capturée au moment du pointage (optionnel)
  photo_capture: String,

  // Correction manuelle par un admin si besoin
  corrige_par_admin: {
    type: Boolean,
    default: false
  },
  commentaire_correction: String

}, { timestamps: true });

module.exports = mongoose.model("Pointage", PointageSchema);
