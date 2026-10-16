// src/App.js
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import ListeEmployes from "./pages/Listeemployes";
import EmployeDetail from "./pages/Employedetail";
import CreerEmploye from "./pages/Creeremploye";
import ModifierEmploye from "./pages/ModifierEmploye";
import ImporterEmployes from "./pages/ImporterEmployes";

// v1.0 — socle RH de base : gestion des employés.
// L'authentification, le pointage par reconnaissance faciale et les autres
// modules (congés, absences, heures sup...) arrivent dans les versions
// suivantes — voir CHANGELOG.md à la racine du dépôt.
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/employes" replace />} />
          <Route path="/employes" element={<ListeEmployes />} />
          <Route path="/employes/creer" element={<CreerEmploye />} />
          <Route path="/employes/import" element={<ImporterEmployes />} />
          <Route path="/employes/:id" element={<EmployeDetail />} />
          <Route path="/employes/:id/modifier" element={<ModifierEmploye />} />
          <Route path="*" element={<div>Page non trouvée</div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;