// src/components/PrivateRoute.jsx
//
// v1.1 — Protège une route côté frontend : redirige vers /login si aucun
// token n'est trouvé. Le vrai contrôle de sécurité reste côté backend
// (authMiddleware), ceci n'est qu'un confort d'UX pour éviter d'afficher
// une page qui échouera de toute façon à charger ses données.
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}