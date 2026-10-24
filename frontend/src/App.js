// src/App.js
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import ListeEmployes from "./pages/Listeemployes";
import EmployeDetail from "./pages/Employedetail";
import CreerEmploye from "./pages/Creeremploye";
import ModifierEmploye from "./pages/ModifierEmploye";
import ImporterEmployes from "./pages/ImporterEmployes";
import PointageDemo from "./pages/PointageDemo";
// v1.1 — authentification JWT : toutes les routes employés sont désormais
// protégées (redirection vers /login si pas de token). Le pointage par
// reconnaissance faciale et les autres modules RH arrivent dans les
// versions suivantes — voir CHANGELOG.md à la racine du dépôt.
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/demo-pointage" element={<PointageDemo />} />
          <Route path="/" element={<Navigate to="/employes" replace />} />
          <Route path="/employes" element={<PrivateRoute><ListeEmployes /></PrivateRoute>} />
          <Route path="/employes/creer" element={<PrivateRoute><CreerEmploye /></PrivateRoute>} />
          <Route path="/employes/import" element={<PrivateRoute><ImporterEmployes /></PrivateRoute>} />
          <Route path="/employes/:id" element={<PrivateRoute><EmployeDetail /></PrivateRoute>} />
          <Route path="/employes/:id/modifier" element={<PrivateRoute><ModifierEmploye /></PrivateRoute>} />

          <Route path="*" element={<div>Page non trouvée</div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;