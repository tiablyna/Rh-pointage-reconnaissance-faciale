const mongoose = require("mongoose");

const EmployeSchema = new mongoose.Schema({
  matricule: { type: String, unique: true, required: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, unique: true },
  mot_de_passe: { type: String, required: true },
  telephone: String,
  date_naissance: Date,
  lieu_naissance: String,
  date_embauche: Date,
  date_fin_contrat: Date,
  
  role: {
    type: String,
    enum: ["admin","employe", "chefdeservice", "chefdedepartement"],
    default: "employe"
  },

  photo: [String],
  encodages_faciaux: [
  {
    encodage: [Number],  // tableau de 512 nombres vc deepface
    photo_source: String // nom de la photo utilisée pour cet encodage
  }
],

  poste_actuel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poste",
    required: true
  },

  horaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Horaire"
  }
}, { timestamps: true });

module.exports = mongoose.model("Employe", EmployeSchema);
