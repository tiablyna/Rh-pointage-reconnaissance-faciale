const mongoose = require("mongoose");

const EmployeEvenementSchema = new mongoose.Schema({
  employe: { type: mongoose.Schema.Types.ObjectId, ref: "Employe" },
  evenement: { type: mongoose.Schema.Types.ObjectId, ref: "EvenementCarriere" }
});

module.exports = mongoose.model("EmployeEvenement", EmployeEvenementSchema);
