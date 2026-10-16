// pages/ImporterEmployes.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { serviceEmployes } from "../services/api";
import { FaArrowLeft, FaFileExcel, FaFileArchive, FaCheck, FaTimes, FaUpload } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

// ═════════════════════════════════════════════════════════════════════════════
// Import en masse : un fichier Excel (.xlsx) décrivant les employés
// + un ZIP contenant leurs photos (au moins 3 par employé, requis pour la
// reconnaissance faciale). Le backend fait le rapprochement par nom de fichier
// via la colonne "nom_fichier_photo" (noms séparés par ";").
//
// Colonnes attendues dans l'Excel :
//   matricule, nom, prenom, email, mot_de_passe, poste_actuel,
//   departement, horaire (optionnel), nom_fichier_photo
// ═════════════════════════════════════════════════════════════════════════════
export default function ImporterEmployes() {
  const navigate = useNavigate();
  const { couleur } = useTheme();
  const [excel, setExcel] = useState(null);
  const [zip, setZip] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultats, setResultats] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!excel || !zip) {
      setErreur("Le fichier Excel et le fichier ZIP sont tous les deux requis.");
      return;
    }
    setChargement(true);
    setResultats(null);
    try {
      const formData = new FormData();
      formData.append("excel", excel);
      formData.append("zip", zip);
      const { data } = await serviceEmployes.importerMasse(formData);
      setResultats(data.resultats || data);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'import.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main" style={{ padding: 32, maxWidth: 720 }}>
        <button
          onClick={() => navigate("/employes")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#666", marginBottom: 20 }}
        >
          <FaArrowLeft /> Retour à la liste des employés
        </button>

        <h2 style={{ marginBottom: 4 }}>Import en masse d'employés</h2>
        <p style={{ color: "#888", marginBottom: 28 }}>
          Charge un fichier Excel décrivant les employés et un ZIP contenant leurs photos
          (au moins 3 photos par employé, nécessaires pour la reconnaissance faciale).
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 12, padding: 18,
            border: "2px dashed #ddd", borderRadius: 12, cursor: "pointer",
          }}>
            <FaFileExcel size={28} color="#0ca678" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Fichier Excel (.xlsx)</div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {excel ? excel.name : "Aucun fichier sélectionné"}
              </div>
            </div>
            <input
              type="file" accept=".xlsx,.xls" hidden
              onChange={(e) => setExcel(e.target.files[0] || null)}
            />
          </label>

          <label style={{
            display: "flex", alignItems: "center", gap: 12, padding: 18,
            border: "2px dashed #ddd", borderRadius: 12, cursor: "pointer",
          }}>
            <FaFileArchive size={28} color="#4263eb" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Archive photos (.zip)</div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {zip ? zip.name : "Aucun fichier sélectionné"}
              </div>
            </div>
            <input
              type="file" accept=".zip" hidden
              onChange={(e) => setZip(e.target.files[0] || null)}
            />
          </label>

          {erreur && (
            <div style={{ color: "#e03131", background: "#fff5f5", padding: 12, borderRadius: 8 }}>
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 20px", borderRadius: 8, border: "none",
              background: couleur || "#4263eb", color: "#fff", fontWeight: 600,
              cursor: chargement ? "not-allowed" : "pointer", opacity: chargement ? 0.7 : 1,
            }}
          >
            <FaUpload /> {chargement ? "Import en cours..." : "Lancer l'import"}
          </button>
        </form>

        {resultats && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Résultat de l'import</h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <StatCard label="Créés" value={resultats.resume?.crees ?? resultats.crees?.length ?? 0} color="#0ca678" />
              <StatCard label="Ignorés" value={resultats.resume?.ignores ?? resultats.ignores?.length ?? 0} color="#f59f00" />
              <StatCard label="Erreurs" value={resultats.resume?.erreurs ?? resultats.erreurs?.length ?? 0} color="#e03131" />
            </div>

            {resultats.erreurs?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: "#e03131", marginBottom: 8 }}>Erreurs</h4>
                {resultats.erreurs.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, padding: "6px 0", borderBottom: "1px solid #f1f1f1" }}>
                    <FaTimes color="#e03131" style={{ marginTop: 3 }} />
                    <span>Ligne {e.ligne} (matricule {e.matricule}) — {e.erreur}</span>
                  </div>
                ))}
              </div>
            )}

            {resultats.ignores?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: "#f59f00", marginBottom: 8 }}>Ignorés</h4>
                {resultats.ignores.map((e, i) => (
                  <div key={i} style={{ fontSize: 14, padding: "6px 0", borderBottom: "1px solid #f1f1f1" }}>
                    Ligne {e.ligne} (matricule {e.matricule}) — {e.raison}
                  </div>
                ))}
              </div>
            )}

            {resultats.crees?.length > 0 && (
              <div>
                <h4 style={{ color: "#0ca678", marginBottom: 8 }}>Créés avec succès</h4>
                {resultats.crees.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, padding: "6px 0", borderBottom: "1px solid #f1f1f1" }}>
                    <FaCheck color="#0ca678" style={{ marginTop: 3 }} />
                    <span>{e.matricule ? `Matricule ${e.matricule}` : JSON.stringify(e)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate("/employes")}
              style={{ marginTop: 20, padding: "10px 18px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            >
              Voir la liste des employés
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, padding: 16, borderRadius: 10, background: "#fafafa", textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "#888" }}>{label}</div>
    </div>
  );
}