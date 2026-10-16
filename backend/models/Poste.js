const mongoose = require("mongoose");

const PosteSchema = new mongoose.Schema({
  intitule: { type: String, required: true },
  niveau: String,
  description: String,
  structure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Structure",
    required: true
  }
});

module.exports = mongoose.model("Poste", PosteSchema);