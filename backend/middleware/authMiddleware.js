// middleware/authMiddleware.js
//
// ⚠️ v1.0 — Version temporaire SANS authentification réelle.
// L'authentification JWT complète sera introduite en v1.1 (voir CHANGELOG.md).
// Elle laisse passer toutes les requêtes, le temps de mettre en place
// le socle API (employés, postes, structures, horaires).

const verifyToken = (req, res, next) => {
  next();
};

module.exports = { verifyToken };
