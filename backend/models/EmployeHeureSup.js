const mongoose = require("mongoose");

const EmployeHeureSupSchema = new mongoose.Schema({
  employe: { type: mongoose.Schema.Types.ObjectId, ref: "Employe" },
  heure_sup: { type: mongoose.Schema.Types.ObjectId, ref: "HeureSupplementaire" }
});

module.exports = mongoose.model("EmployeHeureSup", EmployeHeureSupSchema);
