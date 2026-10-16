const mongoose = require("mongoose");

const StructureSchema = new mongoose.Schema({
  nom_departement: { type: String, required: true },
  description: String,
  STRacro: String
});

module.exports = mongoose.model("Structure", StructureSchema);
