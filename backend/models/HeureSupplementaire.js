const mongoose = require("mongoose");

const HeureSupplementaireSchema = new mongoose.Schema({
  date: Date,
  heure_debut: String,
  heure_fin: String,
  motif: String,
  statut: {
    type: String,
    enum: ["En attente", "Validée", "Rejetée","Effectuée", "Non effectuée", "Annulée"],
    default: "En attente",
  },
  notification_lue: { type: Boolean, default: false }, // ← ajouter

  verification: {
    verifiee: { type: Boolean, default: false },
    heure_sortie_reelle: String, // ex: "17:45"
    duree_reelle: Number, // ex: 1.75 heures réellement effectuées
    ecart_minutes: Number, // ex: -15  (15min de moins que déclaré)
    date_verification: Date,
  },
});

module.exports = mongoose.model(
  "HeureSupplementaire",
  HeureSupplementaireSchema,
);
