// models/JourFerie.js
const mongoose = require("mongoose");

const JourFerieSchema = new mongoose.Schema({

  // Nom du jour férié  ex: "Aïd el-Fitr", "Mawlid Ennabaoui"
  nom: {
    type    : String,
    required: true
  },

  // La date exacte  ex: 2026-06-17
  date: {
    type    : Date,
    required: true,
    unique  : true
  },

  // "fixe"    = même date chaque année (1er jan, 1er mai...)
  // "variable"= date change chaque année (Aïd, Mawlid...)
  type: {
    type   : String,
    enum   : ["fixe", "variable"],
    default: "variable"
  },

  // L'admin qui a ajouté ce jour férié
  cree_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Employe"
  }

}, { timestamps: true });

module.exports = mongoose.model("JourFerie", JourFerieSchema);