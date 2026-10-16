const mongoose = require("mongoose");

const CongeSchema = new mongoose.Schema({
  date_debut:      Date,
  date_fin:        Date,

  // ─── 3 types de congés ───────────────────────────────────────────────────
  type_conge: {
    type: String,
    enum: ["Congé annuel", "Congé exceptionnel", "Congé de récupération"],
    default: "Congé annuel"
  },

  date_demande:    Date,
  date_validation: Date,
  motif_rejet:     String,
  commentaire_emp: String,

  statut: {
    type: String,
    enum: ["En attente", "Validée", "Rejetée", "Annulée"],
    default: "En attente"
  },

  notification_lue: { type: Boolean, default: false }
});

module.exports = mongoose.model("Conge", CongeSchema);