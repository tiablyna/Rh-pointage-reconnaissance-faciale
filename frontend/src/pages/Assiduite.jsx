// pages/Assiduite.jsx
//
// v1.4 — Assiduité mensuelle. Mise en page et styles repris de l'onglet
// « Assiduité » de la page Pointage d'origine (en-tête, filtres, bandeau de
// taux moyen, tableau triable avec avatars et barres de taux).
// Colonnes Congés / Abs. justifiées / Heures travaillées : à venir avec les
// modules Congés, Absences et le calcul des heures.
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import AvatarEmploye from "../components/AvatarEmploye";
import { servicePointage } from "../services/api";
import "./PointagePage.css";
import "../components/Pointage.css";

const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const couleurTaux = (taux) =>
  taux >= 90 ? "#2e7d32" : taux >= 75 ? "#f57f17" : "#c62828";

// ─── Barre de taux ────────────────────────────────────────────────────────────
function TauxBar({ taux }) {
  return (
    <div className="pt-taux-bar-bg">
      <div
        className="pt-taux-bar-fill"
        style={{ width: `${taux}%`, backgroundColor: couleurTaux(taux) }}
      />
      <span className="pt-taux-label">{taux}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Assiduite() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [tri, setTri] = useState({ col: "taux_assiduite", asc: false });

  const anneeActuelle = now.getFullYear();
  const annees = [];
  for (let a = 2025; a <= anneeActuelle; a++) annees.push(a);

  const today = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(false);
    try {
      const res = await servicePointage.obtenirAssiduite({ mois, annee });
      setData(res.data);
    } catch (err) {
      console.error("Erreur assiduité", err);
      setData(null);
      setErreur(true);
    } finally {
      setChargement(false);
    }
  }, [mois, annee]);

  useEffect(() => {
    charger();
  }, [charger]);

  const trierPar = (col) => {
    setTri((t) => ({ col, asc: t.col === col ? !t.asc : false }));
  };
  const fleche = (col) => (tri.col === col ? (tri.asc ? "▲" : "▼") : "");

  const employes = (data?.employes || []).slice().sort((a, b) => {
    const va = a[tri.col] ?? 0;
    const vb = b[tri.col] ?? 0;
    return tri.asc ? va - vb : vb - va;
  });

  // Taux moyen d'assiduité de l'ensemble des employés affichés
  const tauxMoyen = employes.length
    ? Math.round(employes.reduce((s, e) => s + e.taux_assiduite, 0) / employes.length)
    : null;

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-main">
        {/* ── En-tête ── */}
        <div className="page-header">
          <div>
            <h1 className="page-titre">
              <span className="page-titre-bar" /> Assiduité
            </h1>
            <p className="page-sous-titre">Suivi mensuel des présences et des retards</p>
          </div>
          <div className="page-date">{todayStr}</div>
        </div>

        <div className="pt-section">
          {/* ─── FILTRES ─── */}
          <div className="pt-filtres">
            <select
              value={mois}
              onChange={(e) => setMois(parseInt(e.target.value))}
              className="pt-select"
            >
              {MOIS_NOMS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="pt-select"
            >
              {annees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* ─── LIMITE CONNUE ─── */}
          <div className="pt-note">
            Les jours ouvrés sont estimés (jours de semaine du mois). Les jours fériés et les
            congés ou absences validés ne sont pas encore pris en compte : un employé en
            congé apparaît donc comme absent.
          </div>

          {/* ─── TAUX MOYEN ─── */}
          {data && (
            <div className="pt-assiduite-header">
              <div className="pt-assiduite-mois-titre">
                {MOIS_NOMS[mois - 1]} {annee} — {data.jours_ouvres} jours ouvrés
              </div>
              {tauxMoyen !== null && (
                <div className="pt-taux-moyen">
                  Taux moyen d'assiduité :
                  <span className="pt-taux-moyen-val" style={{ color: couleurTaux(tauxMoyen) }}>
                    {tauxMoyen}%
                  </span>
                </div>
              )}
            </div>
          )}

          {chargement ? (
            <div className="pt-loading">
              <div className="pt-spinner" />
            </div>
          ) : (
            <div className="pt-table-wrapper">
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th className="pt-th-sortable" onClick={() => trierPar("jours_presents")}>
                      Présences {fleche("jours_presents")}
                    </th>
                    <th className="pt-th-sortable" onClick={() => trierPar("jours_absents")}>
                      Absences {fleche("jours_absents")}
                    </th>
                    <th className="pt-th-sortable" onClick={() => trierPar("retards")}>
                      Retards {fleche("retards")}
                    </th>
                    <th className="pt-th-sortable" onClick={() => trierPar("taux_assiduite")}>
                      Taux % {fleche("taux_assiduite")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="pt-vide">
                        {erreur ? "Impossible de charger l'assiduité" : "Aucune donnée disponible"}
                      </td>
                    </tr>
                  ) : (
                    employes.map((e) => (
                      <tr key={e.employe_id} className="pt-row">
                        <td>
                          <div className="pt-employe-cell">
                            <AvatarEmploye photo={e.photo} nom={e.nom} prenom={e.prenom} />
                            <div>
                              <div className="pt-nom">
                                {e.prenom} {e.nom}
                              </div>
                              <div className="pt-matricule">{e.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td className="pt-cell-center">
                          <span className="pt-badge-chiffre pt-badge-present">{e.jours_presents}</span>
                        </td>
                        <td className="pt-cell-center">
                          <span className="pt-badge-chiffre pt-badge-absent">{e.jours_absents}</span>
                        </td>
                        <td className="pt-cell-center">
                          {e.retards > 0 ? (
                            <span className="pt-badge-chiffre pt-badge-retard">{e.retards}</span>
                          ) : (
                            <span className="pt-badge-chiffre">0</span>
                          )}
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <TauxBar taux={e.taux_assiduite} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}