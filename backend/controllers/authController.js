const Employe = require("../models/Employe");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employe = await Employe.findOne({ email })
      .populate({
        path: "poste_actuel",
        select: "intitule niveau structure",
        populate: { path: "structure", select: "nom_departement STRacro _id" }
      });

    if (!employe)
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });

    const isMatch = await bcrypt.compare(password, employe.mot_de_passe);
    if (!isMatch)
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });

    const token = jwt.sign(
      { id: employe._id, role: employe.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id:           employe._id,
        nom:          employe.nom,
        prenom:       employe.prenom,
        email:        employe.email,
        role:         employe.role,
        photo:        employe.photo?.[0] || null,
        departement:  employe.poste_actuel?.structure?.nom_departement || null,
        structure_id: employe.poste_actuel?.structure?._id?.toString() || null,
        poste:        employe.poste_actuel?.intitule || null,
      }
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};