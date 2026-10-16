const mongoose = require("mongoose");

const EvenementCarriereSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employe",
    required: true
  },
  type_evenement: {
    type: String,
    enum: ["recrutement", "promotion", "mutation", "affectation", "retrogradation"],
    required: true
  },
  date_evenement: { type: Date, required: true },
  poste_avant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poste"
  },
  structure_avant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Structure"
  },
  poste_apres: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poste"
  },
  structure_apres: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Structure"
  },
  commentaire: String,
}, { timestamps: true });

module.exports = mongoose.model("EvenementCarriere", EvenementCarriereSchema);