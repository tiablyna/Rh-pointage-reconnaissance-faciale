// pages/EmployeDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  serviceEmployes,
  serviceStructures,
  servicePostes,
} from "../services/api";
import {
  FaArrowLeft, FaUserTie, FaBuilding, FaCalendarAlt,
  FaTrophy, FaExchangeAlt, FaCheck, FaEdit, FaTrash
} from "react-icons/fa";
import { BsPersonFillUp, BsPersonFillDown, BsPersonFillCheck, BsPersonFillAdd } from "react-icons/bs";
import { FaArrowsRotate } from "react-icons/fa6";

import PlanningCalendrier from "../components/PlanningCalendrier";
import { useTheme } from "../context/ThemeContext";
// ─────────────────────────────────────────────────────────────────────────────
function construireUrl(chemin) {
  if (!chemin) return null;
  if (chemin.startsWith("http")) return chemin;
  const propre = chemin.replace(/^\/+/, "");
  if (!propre.startsWith("uploads/")) return `${process.env.REACT_APP_API_URL}/uploads/${propre}`;
  return `${process.env.REACT_APP_API_URL}/${propre}`;
}

// ─────────────────────────────────────────────────────────────────────────────
const COULEURS_EV = {
  recrutement: { bg: "#e8f4fd", color: "#1971c2", label: "Recrutement", icon: <BsPersonFillAdd /> },
  promotion: { bg: "#e6fcf5", color: "#0ca678", label: "Promotion", icon: <BsPersonFillUp /> },
  mutation: { bg: "#fff3ee", color: "#ff5c00", label: "Mutation", icon: <FaArrowsRotate /> },
  affectation: { bg: "#f3f0ff", color: "#7048e8", label: "Affectation", icon: <BsPersonFillCheck /> },
  retrogradation: { bg: "#fff5f5", color: "#e03131", label: "Rétrogradation", icon: <BsPersonFillDown /> },
};

// ═════════════════════════════════════════════════════════════════════════════
// MODAL CARRIERE
// ═════════════════════════════════════════════════════════════════════════════
function ModalCarriere({ visible, employe, onFermer, onConfirmer }) {
  const [type, setType] = useState("promotion");
  const [nouveauPoste, setNouveauPoste] = useState("");
  const [nouvelleStructure, setNouvelleStructure] = useState("");
  const [dateEvenement, setDateEvenement] = useState(new Date().toISOString().split("T")[0]);
  const [commentaire, setCommentaire] = useState("");
  const [postes, setPostes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [chargementPostes, setChargementPostes] = useState(false);
  const [chargement, setChargement] = useState(false);
  const { couleur: couleurPrincipale } = useTheme();
  useEffect(() => {
    if (!visible) return;
    setType("promotion");
    setNouveauPoste("");
    setNouvelleStructure("");
    setPostes([]);
    setDateEvenement(new Date().toISOString().split("T")[0]);
    setCommentaire("");
    serviceStructures.obtenirTous()
      .then(r => setDepartements(r.data))
      .catch(console.error);
  }, [visible]);

  useEffect(() => {
    if (!nouvelleStructure) { setPostes([]); setNouveauPoste(""); return; }
    setChargementPostes(true);
    setNouveauPoste("");
    servicePostes.obtenirTous({ structure: nouvelleStructure })
      .then(r => setPostes(r.data))
      .catch(console.error)
      .finally(() => setChargementPostes(false));
  }, [nouvelleStructure]);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!nouveauPoste && !nouvelleStructure) {
      alert("Sélectionnez au moins un nouveau département.");
      return;
    }
    setChargement(true);
    try {
      await onConfirmer({
        type_evenement: type,
        nouveau_poste: nouveauPoste || undefined,
        nouvelle_structure: nouvelleStructure || undefined,
        date_evenement: dateEvenement,
        commentaire,
      });
    } finally { setChargement(false); }
  };

  const c = COULEURS_EV[type];

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 520, alignItems: "stretch", gap: 0 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 className="modal-titre" style={{ marginBottom: 0 }}>Événement de carrière</h3>
          <button onClick={onFermer} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#aaa" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {Object.entries(COULEURS_EV)
            .filter(([k]) => k !== "recrutement")
            .map(([id, v]) => (
              <button
                key={id}
                onClick={() => setType(id)}
                style={{
                  padding: "10px 14px",
                  border: `2px solid ${type === id ? v.color : "#e4e6ea"}`,
                  borderRadius: 10,
                  background: type === id ? v.bg : "#f5f6fa",
                  color: type === id ? v.color : "#555",
                  fontWeight: type === id ? 700 : 500,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: "0.88rem", transition: "0.15s",
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
        </div>

        <div style={{ background: "#f5f6fa", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: "0.88rem" }}>
          <strong>Situation actuelle :</strong>{" "}
          <span style={{ color: c.color, fontWeight: 700 }}>
            {employe?.poste_actuel?.intitule || "—"}
          </span>
          {" — "}
          <span style={{ color: "#555" }}>
            {employe?.poste_actuel?.structure?.nom_departement || "—"}
          </span>
        </div>

        <div className="creer-champ" style={{ marginBottom: 12 }}>
          <label>
            Nouveau département
            <span style={{ color: "#aaa", fontWeight: 400, marginLeft: 6, fontSize: "0.8rem" }}>
              (obligatoire pour filtrer les postes)
            </span>
          </label>
          <select value={nouvelleStructure} onChange={e => setNouvelleStructure(e.target.value)}>
            <option value="">— Sélectionner un département —</option>
            {departements.map(d => (
              <option key={d._id} value={d._id}>{d.nom_departement}</option>
            ))}
          </select>
        </div>

        <div className="creer-champ" style={{ marginBottom: 12 }}>
          <label>
            Nouveau poste
            {nouvelleStructure && postes.length === 0 && !chargementPostes && (
              <span style={{ color: "#e03131", fontWeight: 400, marginLeft: 6, fontSize: "0.8rem" }}>
                — Aucun poste dans ce département
              </span>
            )}
          </label>
          <select
            value={nouveauPoste}
            onChange={e => setNouveauPoste(e.target.value)}
            disabled={!nouvelleStructure || chargementPostes}
            style={{ opacity: !nouvelleStructure ? 0.5 : 1, cursor: !nouvelleStructure ? "not-allowed" : "pointer" }}
          >
            <option value="">
              {chargementPostes ? "Chargement des postes..."
                : !nouvelleStructure ? "— Choisissez d'abord un département —"
                  : "— Sélectionner un poste —"}
            </option>
            {postes.map(p => (
              <option key={p._id} value={p._id}>
                {p.intitule}{p.niveau ? ` (${p.niveau})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="creer-champ" style={{ marginBottom: 12 }}>
          <label>Date de l'événement</label>
          <input type="date" value={dateEvenement} onChange={e => setDateEvenement(e.target.value)} />
        </div>

        <div className="creer-champ" style={{ marginBottom: 16 }}>
          <label>Commentaire</label>
          <textarea
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            rows={2}
            placeholder="Motif, décision..."
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="modal-actions">
          <button className="modal-btn-annuler" onClick={onFermer}>Annuler</button>
          <button
            className="modal-btn-confirmer"
            style={{ background: c.color }}
            onClick={handleSubmit}
            disabled={chargement}
          >
            {chargement ? (
              "Enregistrement..."
            ) : (
              <>
                {c.icon} Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE : EmployeDetail
// ═════════════════════════════════════════════════════════════════════════════
export default function EmployeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employe, setEmploye] = useState(null);
  const [carriere, setCarriere] = useState([]);
  const [onglet, setOnglet] = useState("infos");
  const [modalCarriere, setModalCarriere] = useState(false);
  const [photoErr, setPhotoErr] = useState(false);
  const [toast, setToast] = useState("");
  const [photoActive, setPhotoActive] = useState(0);
  const [modalSuppression, setModalSuppression] = useState(false);
  const [suppressionErreur, setSuppressionErreur] = useState("");
  const [suppressionChargement, setSuppressionChargement] = useState(false);
  const { couleur: couleurPrincipale } = useTheme();
  const charger = async () => {
    try {
      const [rEmp, rCar] = await Promise.all([
        serviceEmployes.obtenirParId(id),
        serviceEmployes.obtenirCarriere(id),
      ]);
      setEmploye(rEmp.data);
      setCarriere(rCar.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { charger(); }, [id]);

  const handleSupprimer = async () => {
    setSuppressionChargement(true);
    setSuppressionErreur("");
    try {
      await serviceEmployes.supprimer(id);
      navigate("/employes", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        setSuppressionErreur(
          `${data.message}\n` +
          `Absences : ${data.details.absences} | ` +
          `Congés : ${data.details.conges} | ` +
          `Heures sup : ${data.details.heuresSup} | ` +
          `Événements carrière : ${data.details.evenementsCarriere}`
        );
      } else {
        setSuppressionErreur(data?.message || "Erreur lors de la suppression.");
      }
    } finally {
      setSuppressionChargement(false);
    }
  };

  const handleCarriere = async (data) => {
    try {
      await serviceEmployes.gererCarriere(id, data);
      await charger();
      setModalCarriere(false);
      setToast("✅ Carrière mise à jour avec succès !");
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.message || e.message));
    }
  };

  if (!employe) return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main"><p className="chargement">Chargement...</p></main>
    </div>
  );

  const photoUrl = employe.photo?.[photoActive] && !photoErr
    ? construireUrl(employe.photo[photoActive])
    : null;

  const fmt = d => d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const couleurRole = {
    admin: "#7048e8", chefdeservice: "#1971c2",
    chefdedepartement: "#0ca678", employe: couleurPrincipale,
  };
  const couleur = couleurRole[employe.role] || couleurPrincipale;

  const onglets = [
    { id: "infos", label: "Informations", icon: <FaUserTie /> },
    { id: "planning", label: "Planning", icon: <FaCalendarAlt /> },
    { id: "carriere", label: "Carrière", icon: <FaTrophy /> },
  ];

  return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main">

        {/* Toast */}
        {toast && (
          <div className="toast" style={{ borderLeft: "4px solid #0ca678" }}>
            <FaCheck color="#0ca678" /> <span>{toast}</span>
          </div>
        )}

        {/* Modal carrière */}
        <ModalCarriere
          visible={modalCarriere}
          employe={employe}
          onFermer={() => setModalCarriere(false)}
          onConfirmer={handleCarriere}
        />

        {/* Modal suppression */}
        {modalSuppression && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: 480 }}>
              <h3 className="modal-titre" style={{ color: "#e03131" }}>
                ⚠️ Supprimer l'employé
              </h3>
              <p style={{ color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
                Vous êtes sur le point de supprimer définitivement{" "}
                <strong>{employe.prenom} {employe.nom}</strong> (#{employe.matricule}).
                <br />Cette action est <strong>irréversible</strong>.
              </p>

              {suppressionErreur && (
                <div style={{
                  background: "#fff5f5", border: "1px solid #ffc9c9",
                  borderLeft: "4px solid #e03131", borderRadius: 8,
                  padding: "10px 14px", color: "#c92a2a",
                  fontSize: "0.82rem", marginBottom: 14,
                  whiteSpace: "pre-line",
                }}>
                  {suppressionErreur}
                </div>
              )}

              <div className="modal-actions">
                <button className="modal-btn-annuler" onClick={() => { setModalSuppression(false); setSuppressionErreur(""); }}>
                  Annuler
                </button>
                <button
                  className="modal-btn-confirmer"
                  style={{ background: "#e03131" }}
                  onClick={handleSupprimer}
                  disabled={suppressionChargement}
                >
                  {suppressionChargement ? "Suppression..." : "🗑 Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="detail-nav">
          <button className="btn-retour" onClick={() => navigate("/employes")}>
            <FaArrowLeft /> Retour aux employés
          </button>
          <div className="breadcrumb">
            <span>Employés</span>
            <span className="bc-sep">›</span>
            <span style={{ color: couleur }}>{employe.nom} {employe.prenom}</span>
          </div>
        </div>

        {/* Carte identité */}
        <div className="emp-detail-carte" style={{ borderTop: `5px solid ${couleur}` }}>
          <div className="emp-detail-gauche">
            {photoUrl
              ? <img src={photoUrl} alt="photo" className="emp-detail-photo" style={{ borderColor: couleur }} onError={() => setPhotoErr(true)} />
              : <div className="emp-detail-avatar" style={{ background: couleur }}>
                {employe.nom?.[0]}{employe.prenom?.[0]}
              </div>
            }

            {employe.photo?.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {employe.photo.map((p, i) => (
                  <img
                    key={i}
                    src={construireUrl(p)}
                    alt=""
                    onClick={() => { setPhotoActive(i); setPhotoErr(false); }}
                    style={{
                      width: 32, height: 32, borderRadius: 6, objectFit: "cover", cursor: "pointer",
                      opacity: photoActive === i ? 1 : 0.5,
                      border: photoActive === i ? `2px solid ${couleur}` : "2px solid transparent",
                    }}
                  />
                ))}
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <h2 className="detail-nom">{employe.nom} {employe.prenom}</h2>
                <span
                  className="emp-badge-role"
                  style={{
                    background: `${couleur}15`,
                    color: couleur,
                    borderColor: `${couleur}33`
                  }}
                >
                  {employe.role}
                </span>
              </div>
              <div className="detail-meta">
                <FaUserTie color="#aaa" size={13} />
                <span className="detail-poste">{employe.poste_actuel?.intitule || "—"}</span>
                <span className="detail-sep">·</span>
                <FaBuilding color="#aaa" size={13} />
                <span className="tag-dept">{employe.poste_actuel?.structure?.nom_departement || "—"}</span>
                <span className="detail-sep">·</span>
                <span className="detail-matricule">#{employe.matricule}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="emp-btn-carriere" style={{ background: couleur }} onClick={() => setModalCarriere(true)}>
              <FaExchangeAlt /> Gérer la carrière
            </button>
            <button
              className="emp-btn-modifier"
              style={{ background: "#1971c2" }}
              onClick={() => navigate(`/employes/${id}/modifier`)}
            >
              <FaEdit /> Modifier
            </button>
            <button
              className="emp-btn-supprimer"
              style={{ background: "#e03131" }}
              onClick={() => setModalSuppression(true)}
            >
              <FaTrash /> Supprimer
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="onglets" style={{ marginBottom: 20 }}>
          {onglets.map(o => (
            <button
              key={o.id}
              className={`onglet-btn ${onglet === o.id ? "actif" : ""}`}
              style={onglet === o.id ? { color: couleur, borderBottomColor: couleur } : {}}
              onClick={() => setOnglet(o.id)}
            >
              {o.icon} {o.label}
            </button>
          ))}
        </div>

        {/* ── ONGLET INFORMATIONS ── */}
        {onglet === "infos" && (
          <>
            <div className="detail-section">
              <h4 className="detail-section-titre">INFORMATIONS PERSONNELLES</h4>
              <div className="detail-blocs">
                {[
                  { label: "DATE DE NAISSANCE", val: fmt(employe.date_naissance) },
                  { label: "LIEU DE NAISSANCE", val: employe.lieu_naissance || "—" },
                  { label: "TÉLÉPHONE", val: employe.telephone || "—" },
                  { label: "EMAIL", val: employe.email },
                ].map(b => (
                  <div key={b.label} className="detail-bloc">
                    <span className="detail-bloc-label">{b.label}</span>
                    <span className="detail-bloc-valeur" style={{ fontSize: b.label === "EMAIL" ? "0.82rem" : undefined }}>
                      {b.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4 className="detail-section-titre">INFORMATIONS PROFESSIONNELLES</h4>
              <div className="detail-blocs">
                <div className="detail-bloc">
                  <span className="detail-bloc-label">DATE D'EMBAUCHE</span>
                  <span className="detail-bloc-valeur">{fmt(employe.date_embauche)}</span>
                </div>
                <div className="detail-bloc">
                  <span className="detail-bloc-label">FIN DE CONTRAT</span>
                  <span className="detail-bloc-valeur">{fmt(employe.date_fin_contrat)}</span>
                </div>
                <div className="detail-bloc" style={{ background: `${couleur}10`, borderColor: `${couleur}33` }}>
                  <span className="detail-bloc-label">POSTE ACTUEL</span>
                  <span className="detail-bloc-valeur" style={{ color: couleur }}>
                    {employe.poste_actuel?.intitule || "—"}
                  </span>
                  {employe.poste_actuel?.niveau && (
                    <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Niveau {employe.poste_actuel.niveau}</span>
                  )}
                </div>
                <div className="detail-bloc">
                  <span className="detail-bloc-label">DÉPARTEMENT</span>
                  <span className="detail-bloc-valeur">{employe.poste_actuel?.structure?.nom_departement || "—"}</span>
                  {employe.poste_actuel?.structure?.STRacro && (
                    <span style={{ fontSize: "0.75rem", color: "#aaa" }}>{employe.poste_actuel.structure.STRacro}</span>
                  )}
                </div>
              </div>
            </div>

            {employe.horaire && (
              <div className="detail-section">
                <h4 className="detail-section-titre">HORAIRE DE TRAVAIL</h4>
                <div className="detail-blocs">
                  {[
                    { label: "NOM HORAIRE", val: employe.horaire.nom_horaire || "—" },
                    { label: "HEURE DÉBUT", val: employe.horaire.heure_debut || "—" },
                    { label: "HEURE FIN", val: employe.horaire.heure_fin || "—" },
                    { label: "HEURES / JOUR", val: employe.horaire.nbr_heures_jour ? `${employe.horaire.nbr_heures_jour}h` : "—" },
                    { label: "JOURS / SEM.", val: employe.horaire.nbr_jour_semaine ? `${employe.horaire.nbr_jour_semaine}j` : "—" },
                    { label: "PAUSE", val: employe.horaire.duree_pause ? `${employe.horaire.duree_pause}min` : "—" },
                  ].map(b => (
                    <div key={b.label} className="detail-bloc">
                      <span className="detail-bloc-label">{b.label}</span>
                      <span className="detail-bloc-valeur">{b.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ONGLET PLANNING ── */}
        {onglet === "planning" && (
          <div className="detail-section">
            <h4 className="detail-section-titre">PLANNING MENSUEL</h4>
            <PlanningCalendrier
              employeId={id}
              dateEmbauche={employe.date_embauche}
            />
          </div>
        )}

        {/* ── ONGLET CARRIÈRE ── */}
        {onglet === "carriere" && (
          <div className="detail-section">
            <div className="detail-section-header">
              <h4 className="detail-section-titre">
                HISTORIQUE DE CARRIÈRE ({carriere.length} événement{carriere.length > 1 ? "s" : ""})
              </h4>
              <button className="emp-btn-carriere" style={{ background: couleur }} onClick={() => setModalCarriere(true)}>
                <FaExchangeAlt /> Nouvel événement
              </button>
            </div>

            {carriere.length === 0 ? (
              <div className="liste-vide"><p>Aucun événement de carrière enregistré.</p></div>
            ) : (
              <div className="carriere-timeline">
                {carriere.map((ev, i) => {
                  const c = COULEURS_EV[ev.type_evenement] || COULEURS_EV.affectation;
                  return (
                    <div key={ev._id} className="carriere-item">
                      <div className="carriere-point" style={{ background: c.color, boxShadow: `0 0 0 3px ${c.bg}` }} />
                      {i < carriere.length - 1 && <div className="carriere-ligne" />}

                      <div className="carriere-contenu">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                          <span style={{
                            background: c.bg, color: c.color, border: `1px solid ${c.color}44`,
                            padding: "4px 14px", borderRadius: 20, fontWeight: 700, fontSize: "0.82rem",
                          }}>
                            {c.icon} {c.label}
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "#888" }}>
                            {new Date(ev.date_evenement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: ev.commentaire ? 8 : 0 }}>
                          {ev.poste_avant && (
                            <div style={{ background: "#f5f6fa", borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem" }}>
                              <div style={{ fontWeight: 600, color: "#555" }}>{ev.poste_avant.intitule}</div>
                              {ev.structure_avant && (
                                <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{ev.structure_avant.nom_departement}</div>
                              )}
                            </div>
                          )}
                          {ev.poste_avant && ev.poste_apres && (
                            <span style={{ color: c.color, fontSize: "1.2rem", fontWeight: 800 }}>→</span>
                          )}
                          {ev.poste_apres && (
                            <div style={{ background: c.bg, border: `1px solid ${c.color}44`, borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem" }}>
                              <div style={{ fontWeight: 700, color: c.color }}>{ev.poste_apres.intitule}</div>
                              {ev.structure_apres && (
                                <div style={{ fontSize: "0.75rem", color: c.color + "99" }}>{ev.structure_apres.nom_departement}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {ev.commentaire && (
                          <p style={{ fontSize: "0.82rem", color: "#888", fontStyle: "italic", marginTop: 4 }}>
                            💬 {ev.commentaire}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}