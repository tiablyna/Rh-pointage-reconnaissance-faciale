const mongoose = require("mongoose");

const EmployeNotificationSchema = new mongoose.Schema({
  employe: { type: mongoose.Schema.Types.ObjectId, ref: "Employe" },
  notification: { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  lu: { type: Boolean, default: false }
});

module.exports = mongoose.model("EmployeNotification", EmployeNotificationSchema);
