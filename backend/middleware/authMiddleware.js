// middleware/authMiddleware.js
//
// v1.1 — Vrai contrôle JWT (remplace le passthrough temporaire de la v1.0).
// Toutes les routes qui utilisaient déjà verifyToken (employés, postes,
// structures, horaires) deviennent protégées sans qu'on ait à les modifier.

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès refusé, token manquant" });
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

module.exports = { verifyToken };