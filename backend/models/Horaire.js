const mongoose = require("mongoose");

const HoraireSchema = new mongoose.Schema({
  nom_horaire: String,
  type: String,
  heure_debut: String,
  heure_fin: String,
  nbr_heures_jour: Number,
  nbr_jour_semaine: Number,
  duree_pause: Number,
  cycle_rotation: String,
  ordre_rotation: Number,
  tolerance_retard_min: { type: Number, default: 20 }, 
});

module.exports = mongoose.model("Horaire", HoraireSchema);
