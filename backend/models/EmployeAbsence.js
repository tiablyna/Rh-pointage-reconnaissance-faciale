const mongoose = require("mongoose");

const EmployeAbsenceSchema = new mongoose.Schema({
  employe: { type: mongoose.Schema.Types.ObjectId, ref: "Employe" },
  absence: { type: mongoose.Schema.Types.ObjectId, ref: "Absence" }
});

module.exports = mongoose.model("EmployeAbsence", EmployeAbsenceSchema);
