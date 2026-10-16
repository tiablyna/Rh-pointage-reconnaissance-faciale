// =============================================================================
// PlanningCalendrier.jsx
// Calendrier mensuel interactif avec navigation mois/année.
// Affiche les absences, congés, heures sup de l'employé sous forme de badges,
// les jours fériés (badge 🎉 avec nom), et les week-ends algériens
// (vendredi + samedi) en grisé.
// Bloque l'affichage des mois antérieurs à la date d'embauche.
// Utilisé dans : EmployeeProfil.jsx, EmployeDetail.jsx.
// Props :
//   - employeId    : string — _id MongoDB de l'employé
//   - dateEmbauche : string — date ISO de la date d'embauche (pour le blocage)
// =============================================================================

import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { serviceEmployes, serviceJoursFeries } from "../services/api";

// Couleurs des événements RH et jours spéciaux
const COULEURS_PLANNING = {
  absence:   { bg: "#fff3ee", color: "#ff5c00", label: "Absence"  },
  conge:     { bg: "#e8f4fd", color: "#1971c2", label: "Congé"    },
  heure_sup: { bg: "#f3f0ff", color: "#7048e8", label: "H. Sup."  },
  ferie:     { bg: "#fff9db", color: "#e6a817", label: "Férié"    },
  weekend:   { bg: "#f5f5f5", color: "#adb5bd", label: "Week-end" },
};

const NOMS_MOIS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

export default function PlanningCalendrier({ employeId, dateEmbauche }) {
  const today = new Date();

  const [mois,        setMois]        = useState(today.getMonth() + 1);
  const [annee,       setAnnee]       = useState(today.getFullYear());
  const [planning,    setPlanning]    = useState(null);
  const [joursFeries, setJoursFeries] = useState([]);
  const [chargement,  setChargement]  = useState(false);

  // Vérification si on est avant la date d'embauche
  const dernierJourDuMois = new Date(annee, mois, 0);
  const embauche          = dateEmbauche ? new Date(dateEmbauche) : null;
  if (embauche) embauche.setHours(0, 0, 0, 0);
  const estAvantEmbauche  = embauche && dernierJourDuMois < embauche;

  // Chargement du planning et des jours fériés en parallèle
  useEffect(() => {
    if (estAvantEmbauche) return;
    setChargement(true);
    Promise.all([
      serviceEmployes.obtenirPlanning(employeId, { mois, annee, format: "liste" }),
      serviceJoursFeries.obtenirParAnnee(annee),
    ])
      .then(([rPlanning, rFeries]) => {
        setPlanning(rPlanning.data);
        setJoursFeries(rFeries.data || []);
      })
      .catch(console.error)
      .finally(() => setChargement(false));
  }, [employeId, mois, annee]);

  // Navigation mois précédent / suivant
  const prev = () => { if (mois === 1) { setMois(12); setAnnee(a => a - 1); } else setMois(m => m - 1); };
  const next = () => { if (mois === 12) { setMois(1); setAnnee(a => a + 1); } else setMois(m => m + 1); };

  // Construction de la grille calendrier
  const joursParMois = new Date(annee, mois, 0).getDate();
  const premierJour  = new Date(annee, mois - 1, 1).getDay();

  // Map jour → nom du jour férié (filtré sur le mois/année affiché)
  const feriesParJour = {};
  joursFeries.forEach(jf => {
    const d = new Date(jf.date);
    if (d.getMonth() + 1 === mois && d.getFullYear() === annee) {
      feriesParJour[d.getDate()] = jf.nom;
    }
  });

  // Map jour → événements RH (absences + congés + heures sup)
  const jourEvenements = {};
  if (planning) {
    const absences  = planning.absences  || [];
    const conges    = planning.conges    || [];
    const heuresSup = planning.heuresSup || [];

    [...absences, ...conges, ...heuresSup].forEach(ev => {
      const debut = new Date(ev.date_debut || ev.date);
      const fin   = new Date(ev.date_fin   || ev.date);
      for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === mois && d.getFullYear() === annee) {
          const j = d.getDate();
          if (!jourEvenements[j]) jourEvenements[j] = [];
          jourEvenements[j].push(ev);
        }
      }
    });
  }

  // Week-end algérien : vendredi (5) et samedi (6)
  const estWeekend = (numJour) => {
    const js = new Date(annee, mois - 1, numJour).getDay();
    return js === 5 || js === 6;
  };

  // Cellules de la grille (null = cases vides avant le premier jour)
  const cellules = [];
  const decalage = premierJour === 0 ? 6 : premierJour - 1;
  for (let i = 0; i < decalage; i++) cellules.push(null);
  for (let j = 1; j <= joursParMois; j++) cellules.push(j);

  return (
    <div>
      {/* Navigation mois */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <button onClick={prev} className="btn-retour" style={{ padding: "6px 12px" }}>
          <FaChevronLeft />
        </button>
        <span style={{ fontWeight: 800, fontSize: "1.05rem", minWidth: 180, textAlign: "center" }}>
          {NOMS_MOIS[mois - 1]} {annee}
        </span>
        <button onClick={next} className="btn-retour" style={{ padding: "6px 12px" }}>
          <FaChevronRight />
        </button>
      </div>

      {/* CAS 1 : mois avant embauche */}
      {estAvantEmbauche ? (
        <div style={{
          background: "#f5f6fa",
          border: "1px dashed #ddd",
          borderRadius: 14,
          padding: "40px 20px",
          textAlign: "center",
          color: "#aaa",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📅</div>
          <p style={{ fontWeight: 700, color: "#555", marginBottom: 6 }}>
            Employé non encore en poste ce mois-ci
          </p>
          <p style={{ fontSize: "0.88rem" }}>
            Date d'embauche :{" "}
            <strong style={{ color: "#ff5c00" }}>
              {embauche.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
          </p>
        </div>

      ) : chargement ? (
        <div className="chargement" style={{ padding: 30 }}>Chargement...</div>

      ) : (
        <>
          {/* Légende */}
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {Object.entries(COULEURS_PLANNING).map(([k, v]) => (
              <span key={k} style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: "0.78rem", color: v.color, fontWeight: 600,
              }}>
                <span style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: v.color, display: "inline-block", flexShrink: 0,
                }} />
                {v.label}
              </span>
            ))}
          </div>

          {/* Grille calendrier */}
          <div className="planning-grille">

            {/* En-têtes des jours (Ven + Sam grisés = week-end algérien) */}
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j, idx) => {
              const isWE = idx === 4 || idx === 5;
              return (
                <div key={j} className="planning-entete-jour" style={{
                  color:      isWE ? "#adb5bd" : undefined,
                  background: isWE ? "#f9f9f9" : undefined,
                }}>
                  {j}
                </div>
              );
            })}

            {/* Cellules */}
            {cellules.map((jour, i) => {
              if (!jour) return <div key={i} className="planning-cellule vide" />;

              const evs           = jourEvenements[jour] || [];
              const nomFerie      = feriesParJour[jour];
              const isWE          = estWeekend(jour);
              const estAujourdhui =
                jour  === today.getDate() &&
                mois  === today.getMonth() + 1 &&
                annee === today.getFullYear();

              const bgCellule = nomFerie
                ? COULEURS_PLANNING.ferie.bg
                : isWE
                  ? COULEURS_PLANNING.weekend.bg
                  : undefined;

              return (
                <div
                  key={i}
                  className={`planning-cellule ${estAujourdhui ? "aujourdhui" : ""}`}
                  style={{ background: bgCellule }}
                  title={nomFerie ? `🎉 ${nomFerie}` : undefined}
                >
                  {/* Numéro du jour */}
                  <span className="planning-num-jour" style={{
                    color:      nomFerie ? COULEURS_PLANNING.ferie.color :
                                isWE     ? COULEURS_PLANNING.weekend.color : undefined,
                    fontWeight: nomFerie || isWE ? 700 : undefined,
                  }}>
                    {jour}
                  </span>

                  {/* Badge jour férié */}
                  {nomFerie && (
                    <span style={{
                      display: "block",
                      background: COULEURS_PLANNING.ferie.bg,
                      color:      COULEURS_PLANNING.ferie.color,
                      border:     `1px solid ${COULEURS_PLANNING.ferie.color}55`,
                      borderRadius: 4,
                      padding: "1px 4px",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }} title={nomFerie}>
                      🎉 {nomFerie}
                    </span>
                  )}

                  {/* Badge week-end */}
                  {isWE && !nomFerie && (
                    <span style={{
                      display: "block",
                      color: COULEURS_PLANNING.weekend.color,
                      fontSize: "0.58rem",
                      fontWeight: 600,
                      marginTop: 2,
                    }}>
                      WE
                    </span>
                  )}

                  {/* Badges événements RH (max 2, ou 1 si jour férié) */}
                  {evs.slice(0, nomFerie ? 1 : 2).map((ev, idx) => {
                    const c = COULEURS_PLANNING[ev._type];
                    if (!c) return null;
                    return (
                      <span key={idx} style={{
                        display: "block",
                        background: c.bg, color: c.color,
                        borderRadius: 4, padding: "1px 4px",
                        fontSize: "0.62rem", fontWeight: 700, marginTop: 2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {c.label}
                      </span>
                    );
                  })}
                  {evs.length > (nomFerie ? 1 : 2) && (
                    <span style={{ fontSize: "0.6rem", color: "#aaa" }}>
                      +{evs.length - (nomFerie ? 1 : 2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Résumé bas calendrier */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "ABSENCES",      val: (planning?.absences  || []).length, color: "#ff5c00", bg: "#fff3ee", border: "#ffd0b0" },
              { label: "CONGÉS",        val: (planning?.conges    || []).length, color: "#1971c2", bg: "#e8f4fd", border: "#a5cef7" },
              { label: "HEURES SUP",    val: (planning?.heuresSup || []).length, color: "#7048e8", bg: "#f3f0ff", border: "#c5b8f8" },
              { label: "JOURS FÉRIÉS", val: Object.keys(feriesParJour).length,   color: "#e6a817", bg: "#fff9db", border: "#ffe066" },
            ].map(s => (
              <div key={s.label} className="detail-bloc" style={{ background: s.bg, borderColor: s.border, minWidth: 110 }}>
                <span className="detail-bloc-label">{s.label}</span>
                <span className="detail-bloc-valeur" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Liste des jours fériés du mois */}
          {Object.keys(feriesParJour).length > 0 && (
            <div style={{
              marginTop: 12,
              background: "#fff9db",
              border: "1px solid #ffe066",
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <div style={{
                fontSize: "0.75rem", fontWeight: 700, color: "#e6a817",
                marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                🎉 Jours fériés ce mois
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(feriesParJour)
                  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                  .map(([jour, nom]) => (
                    <span key={jour} style={{
                      background: "#fff", border: "1px solid #ffe066",
                      borderRadius: 20, padding: "3px 12px",
                      fontSize: "0.82rem", color: "#b77f00", fontWeight: 600,
                    }}>
                      {jour} — {nom}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}