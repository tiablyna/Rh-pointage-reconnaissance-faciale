// pages/Listeemployes.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { serviceEmployes, serviceStructures } from "../services/api";
import GrilleEmployes from "../components/Grilleemployes";
import { FaPlus, FaSearch, FaChevronDown, FaBuilding ,FaFileExcel} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
// ═════════════════════════════════════════════════════════════════════════════
// PAGE : ListeEmployes
//
// RESPONSABILITÉ UNIQUE :
//   Cette page gère UNIQUEMENT les données et les filtres.
//   Elle ne sait pas comment afficher une carte — c'est GrilleEmployes qui s'en charge.
//
// FLUX DE DONNÉES :
//   1. Au montage → charger départements (pour le filtre)
//   2. Quand filtreDept change → recharger les employés depuis l'API
//   3. Quand recherche change → filtrer côté frontend (sans requête API)
//   4. Passer la liste filtrée à <GrilleEmployes> pour l'affichage
//
// POURQUOI SÉPARER ?
//   - ListeEmployes → logique métier (API, filtres, état)
//   - GrilleEmployes → logique d'affichage (layout des cartes)
//   - CarteEmploye   → logique d'une seule carte
//   Chaque fichier est indépendant, facile à modifier sans casser les autres
// ═════════════════════════════════════════════════════════════════════════════
export default function ListeEmployes() {
  const navigate = useNavigate();

  // ── États ────────────────────────────────────────────────────────────────
  const [employes, setEmployes] = useState([]);    // liste brute depuis l'API
  const [departements, setDepartements] = useState([]);    // pour le dropdown filtre
  const [filtreDept, setFiltreDept] = useState("");    // "" = tous, sinon ID MongoDB
  const [recherche, setRecherche] = useState("");    // texte de recherche
  const [chargement, setChargement] = useState(false); // true pendant l'appel API
  const [dropdownOuvert, setDropdownOuvert] = useState(false); // état ouvert/fermé du dropdown
  const dropdownRef = useRef(null);                            // référence DOM pour détecter le clic extérieur
  const { couleur : couleurPrincipale  } = useTheme();
  // ── Fermer le dropdown si clic en dehors ─────────────────────────────────
  // LOGIQUE :
  //   On attache un écouteur sur "document" entier
  //   Si l'élément cliqué n'est PAS dans la ref dropdownRef → on ferme
  //   Le return () => ... est le "cleanup" : retire l'écouteur quand le composant se démonte
  //   (sinon l'écouteur reste en mémoire même si le composant disparaît → fuite mémoire)
  useEffect(() => {
    const fermer = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer); // cleanup
  }, []); // [] = une seule fois au montage

  // ── Charger les départements au démarrage ─────────────────────────────────
  // LOGIQUE : on les charge une seule fois ([] en dépendance)
  // Ils ne changent pas souvent, pas besoin de recharger à chaque filtre
  useEffect(() => {
    serviceStructures.obtenirTous()
      .then(r => setDepartements(r.data))
      .catch(console.error);
  }, []);

  // ── Recharger les employés quand le filtre département change ─────────────
  // LOGIQUE :
  //   On envoie le filtre au BACKEND (pas côté frontend)
  //   → Le backend retourne seulement les employés du département choisi
  //   → Meilleure performance si beaucoup d'employés
  //   La recherche par texte, elle, est côté frontend (pas de requête API)
  //   → Car c'est sur les données déjà chargées, plus rapide pour l'utilisateur
  useEffect(() => { charger(); }, [filtreDept]);

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (filtreDept) params.departement = filtreDept; // filtre envoyé au backend
      const r = await serviceEmployes.obtenirTous(params);
      setEmployes(r.data);
    } catch (e) { console.error(e); }
    finally { setChargement(false); }
  };

  // ── Filtrage côté frontend ────────────────────────────────────────────────
  // LOGIQUE :
  //   On ne refait pas de requête API pour la recherche
  //   On filtre simplement le tableau "employes" déjà en mémoire
  //   toLowerCase() des deux côtés pour rendre la recherche insensible à la casse
  const employesFiltres = recherche
    ? employes.filter(e =>
      `${e.nom} ${e.prenom} ${e.matricule}`
        .toLowerCase()
        .includes(recherche.toLowerCase())
    )
    : employes;

  // ── Nom du département sélectionné pour le bouton ─────────────────────────
  const nomDept = filtreDept
    ? departements.find(d => d._id === filtreDept)?.nom_departement || "Département"
    : "Tous les départements";

  // ── Stats rapides (comptage par rôle sur la liste filtrée) ────────────────
  const stats = {
    total: employesFiltres.length,
    admins: employesFiltres.filter(e => e.role === "admin").length,
    chefs: employesFiltres.filter(e => ["chefdeservice", "chefdedepartement"].includes(e.role)).length,
    employes: employesFiltres.filter(e => e.role === "employe").length,
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDU
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main">

        {/* ── ENTÊTE ── */}
        <div className="entete">
          <div>
            <h1 className="entete-titre">
              <span className="barre-orange" />
              Gestion des Employés
            </h1>
            <p className="entete-sous">{stats.total} employé{stats.total !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="modal-btn-annuler"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              onClick={() => navigate("/employes/import")}
            >
              <FaFileExcel /> Import Excel
            </button>
            <button className="emp-btn-creer" onClick={() => navigate("/employes/creer")}>
              <FaPlus /> Nouvel employé
            </button>
          </div>
        </div>

        {/* ── STATS RAPIDES ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total", val: stats.total, color: couleurPrincipale, bg: `${couleurPrincipale}15` },
            { label: "Admins", val: stats.admins, color: "#7048e8", bg: "#f3f0ff" },
            { label: "Chefs", val: stats.chefs, color: "#1971c2", bg: "#e8f4fd" },
            { label: "Employés", val: stats.employes, color: "#0ca678", bg: "#e6fcf5" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.color}22`,
              borderRadius: 12, padding: "12px 20px",
              display: "flex", flexDirection: "column", gap: 2, minWidth: 90,
            }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── FILTRES ── */}
        <div className="filtres-zone">

          {/* Dropdown département — filtre côté backend */}
          <div className="dept-dropdown-wrapper" ref={dropdownRef}>
            <button className="dept-dropdown-btn" onClick={() => setDropdownOuvert(!dropdownOuvert)}>
              <FaBuilding size={13} color="#aaa" />
              {nomDept}
              <FaChevronDown className={`chevron ${dropdownOuvert ? "ouvert" : ""}`} />
            </button>
            {dropdownOuvert && (
              <div className="dept-dropdown-menu">
                <div
                  className={`dept-option-tous ${filtreDept === "" ? "actif" : ""}`}
                  onClick={() => { setFiltreDept(""); setDropdownOuvert(false); }}
                >
                  <span className="dept-radio">{filtreDept === "" ? "●" : "○"}</span>
                  Tous les départements
                </div>
                <div className="dept-grille">
                  {departements.map(d => (
                    <div
                      key={d._id}
                      className={`dept-option ${filtreDept === d._id ? "actif" : ""}`}
                      onClick={() => { setFiltreDept(d._id); setDropdownOuvert(false); }}
                    >
                      {d.STRacro && <span className="dept-acro">{d.STRacro}</span>}
                      <span className="dept-nom">{d.nom_departement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Barre de recherche — filtre côté frontend */}
          <div className="emp-recherche-wrapper">
            <FaSearch color="#aaa" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, matricule..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="emp-recherche-input"
            />
            {recherche && (
              <span onClick={() => setRecherche("")} style={{ cursor: "pointer", color: "#aaa" }}>✕</span>
            )}
          </div>
        </div>

        {/* ── GRILLE DES EMPLOYÉS ── */}
        {/*
          ListeEmployes délègue TOUT l'affichage à GrilleEmployes
          Elle passe seulement :
            - employes : la liste filtrée (calculée ci-dessus)
            - chargement : pour que GrilleEmployes affiche le skeleton
        */}
        <GrilleEmployes
          employes={employesFiltres}
          chargement={chargement}
        />

      </main>
    </div>
  );
}