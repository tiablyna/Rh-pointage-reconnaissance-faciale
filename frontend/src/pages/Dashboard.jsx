// pages/Dashboard.jsx
//
// v1.4 — Tableau de bord admin. Mise en page et styles repris du dashboard
// d'origine (en-tête à barre orange, cartes d'indicateurs, cartes blanches).
// Les graphiques (évolution sur 30 jours, répartition des absences) arriveront
// avec les modules Congés / Absences.
import { useState, useEffect, useCallback } from "react";
import { FaUsers, FaCheckCircle, FaUserPlus } from "react-icons/fa";
import { MdAccessTime } from "react-icons/md";
import Sidebar from "../components/Sidebar";
import AvatarEmploye from "../components/AvatarEmploye";
import { serviceDashboard, servicePointage } from "../services/api";
import "./Dashboard.css";
import "../components/Pointage.css";

const C = {
  present: "#0ca678",
  retard: "#f97316",
  absent: "#ef4444",
  conge: "#3b82f6",
  purple: "#8b5cf6",
};

// ─── Carte d'indicateur ───────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ "--c": color }}>
      <div className="kpi-top">
        <div className="kpi-icon-wrap">{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    setErreur(false);
    try {
      const [resStats, resRecents] = await Promise.all([
        serviceDashboard.obtenirStats(),
        servicePointage.obtenirRecents(10),
      ]);
      setStats(resStats.data);
      setRecents(resRecents.data || []);
    } catch (err) {
      console.error("Erreur dashboard", err);
      setErreur(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const effectif = stats?.total_employes ?? 0;
  const presents = stats?.presents_aujourdhui ?? 0;
  const retards = stats?.en_retard_aujourdhui ?? 0;
  const nouveaux = stats?.nouveaux_ce_mois ?? 0;
  const demo = stats?.total_employes_test ?? 0;

  // Ponctualité du jour : part des présents arrivés à l'heure (— s'il n'y a personne)
  const txPonct =
    presents > 0 ? Math.round(((presents - retards) / presents) * 100) : null;
  const couleurPonct =
    txPonct === null
      ? "#94a3b8"
      : txPonct >= 90
        ? C.present
        : txPonct >= 75
          ? C.retard
          : C.absent;

  if (loading)
    return (
      <div className="dash-shell">
        <Sidebar />
        <div className="dash-loading">
          <div className="dash-spinner" />
          <span>Chargement...</span>
        </div>
      </div>
    );

  return (
    <div className="dash-shell">
      <Sidebar />

      <main className="dash-main">
        {/* ── En-tête ── */}
        <div className="dash-head">
          <div>
            <h1 className="dash-title">
              <span className="barre-orange" />
              Tableau de bord
            </h1>
            <p className="dash-subtitle">{today}</p>
          </div>
          <button className="dash-refresh" onClick={chargerDonnees}>
            ↻ Actualiser
          </button>
        </div>

        {erreur && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-empty" style={{ color: C.absent, height: 60 }}>
              Impossible de charger les statistiques.
            </div>
          </div>
        )}

        {/* ── Indicateurs ── */}
        <div className="kpi-grid">
          <KpiCard icon={<FaUsers />} label="Effectif" value={effectif} sub="employés suivis" color={C.conge} />
          <KpiCard icon={<FaCheckCircle />} label="Présents" value={presents} sub="aujourd'hui" color={C.present} />
          <KpiCard icon={<MdAccessTime />} label="Retards" value={retards} sub="ce jour" color={C.retard} />
          <KpiCard icon={<FaUserPlus />} label="Nouveaux" value={nouveaux} sub="ce mois" color={C.purple} />
        </div>

        {/* ── Derniers pointages + résumé du jour ── */}
        <div className="row-2col big-small">
          <div className="card card-table">
            <div className="card-head">
              <span className="card-title">Derniers pointages</span>
              <span className="card-period">10 derniers</span>
            </div>

            {recents.length === 0 ? (
              <div className="card-empty">Aucun pointage pour l'instant</div>
            ) : (
              <div className="pt-table-scroll">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <th>Employé</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Heure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recents.map((p) => {
                      const date = new Date(p.date_heure);
                      return (
                        <tr key={p._id} className="pt-row">
                          <td>
                            <div className="pt-employe-cell">
                              <AvatarEmploye
                                photo={p.employe?.photo}
                                nom={p.employe?.nom}
                                prenom={p.employe?.prenom}
                              />
                              <div>
                                <div className="pt-nom">
                                  {p.employe ? `${p.employe.prenom} ${p.employe.nom}` : "—"}
                                  {p.employe?.est_test && (
                                    <span className="pt-badge-mini pt-badge-test">TEST</span>
                                  )}
                                </div>
                                <div className="pt-matricule">{p.employe?.matricule}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`pt-heure-badge ${
                                p.type === "sortie" ? "pt-heure-sortie" : "pt-heure-entree"
                              }`}
                            >
                              {p.type === "sortie" ? "Sortie" : "Entrée"}
                            </span>
                          </td>
                          <td className="pt-cell-date pt-cell-sm">
                            {date.toLocaleDateString("fr-FR")}
                          </td>
                          <td className="pt-cell-heure pt-cell-sm">
                            {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Résumé du jour</span>
              <span className="card-period">aujourd'hui</span>
            </div>

            <div className="resume-legend">
              {[
                { l: "Présents", v: presents, c: C.present },
                { l: "À l'heure", v: presents - retards, c: C.conge },
                { l: "En retard", v: retards, c: C.retard },
                { l: "Comptes de démo", v: demo, c: C.purple },
              ].map(({ l, v, c }) => (
                <div key={l} className="resume-row">
                  <span className="resume-dot" style={{ background: c }} />
                  <span className="resume-lbl">{l}</span>
                  <span className="resume-val" style={{ color: c }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Barre de ponctualité */}
            <div className="ponct-wrap">
              <div className="ponct-head">
                <span>Ponctualité</span>
                <span style={{ color: couleurPonct, fontWeight: 700 }}>
                  {txPonct === null ? "—" : `${txPonct}%`}
                </span>
              </div>
              <div className="ponct-bar">
                <div
                  className="ponct-fill"
                  style={{ width: `${txPonct ?? 0}%`, background: couleurPonct }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}