const mongoose = require("mongoose");

const AbsenceSchema = new mongoose.Schema({
  date_debut:  Date,
  date_fin:    Date,

  motif_absence: {
    type: String,
    enum: ["Maladie", "Accident du travail", "Rendez-vous médical", "Décès", "Mariage", "Autre"]
  },

  // ─── Champs conditionnels selon motif ────────────────────────────────────
  // Affiché uniquement si motif === "Décès"
  lien_parente_deces: {
    type: String,
    enum: ["Père", "Mère", "Frère", "Sœur", "Mari(e)", "Autre", null],
    default: null
  },

  // Affiché uniquement si motif === "Mariage"
  type_mariage: {
    type: String,
    enum: ["Lui-même", "Familiale", null],
    default: null
  },
  commentaire: { type: String, default: null },

  justifiee:                    Boolean,
  fichier_justificatif:         String,
  date_soumission_justificatif: Date,

  statut_validation: {
    type: String,
    enum: ["En attente", "Validée", "Rejetée"],
    default: "En attente"
  },

  // Nombre de jours de récupération attribués à la validation (décès/mariage)
  jours_recuperation_attribues: { type: Number, default: 0 },

  notification_lue: { type: Boolean, default: false }
});

module.exports = mongoose.model("Absence", AbsenceSchema);