const mongoose = require("mongoose");

const EmployeCongeSchema = new mongoose.Schema({
  employe: { type: mongoose.Schema.Types.ObjectId, ref: "Employe" },
  conge: { type: mongoose.Schema.Types.ObjectId, ref: "Conge" }
});

module.exports = mongoose.model("EmployeConge", EmployeCongeSchema);
