// pages/CreerEmploye.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { serviceEmployes, serviceStructures, servicePostes, serviceHoraires } from "../services/api";
import { FaArrowLeft, FaCamera, FaTimes, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
// ─── Valider email ────────────────────────────────────────────────────────────
const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── Valider téléphone (optionnel mais si rempli = format correct) ────────────
const telValide = (t) => !t || /^[0-9\s\+\-\(\)]{7,15}$/.test(t);

// ─── Valider date : doit être une vraie date passée ou acceptable ─────────────
const dateValide = (d) => {
  if (!d) return true; // optionnel
  const parsed = new Date(d);
  return !isNaN(parsed.getTime());
};

export default function CreerEmploye() {
  const navigate = useNavigate();
  const [postes, setPostes] = useState([]);   // postes du département sélectionné
  const [tousPostes, setTousPostes] = useState([]);   // tous les postes (pour filtrage local)
  const [departements, setDepartements] = useState([]);
  const [horaires, setHoraires] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreurs, setErreurs] = useState({});    // { champ: "message d'erreur" }
  const [succes, setSucces] = useState(false);
  const [voirMdp, setVoirMdp] = useState(false);
  const [etape, setEtape] = useState(1);
  const { couleur } = useTheme();
  const [form, setForm] = useState({
    matricule: "", nom: "", prenom: "", email: "",
    mot_de_passe: "", telephone: "",
    date_naissance: "", lieu_naissance: "",
    date_embauche: "", date_fin_contrat: "",
    role: "employe", structure: "", poste_actuel: "", horaire: "",
  });

  // ── Chargement initial ───────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      serviceStructures.obtenirTous(),
      servicePostes.obtenirTous(),
      serviceHoraires.obtenirTous(),
    ]).then(([rD, rP, rH]) => {
      setDepartements(rD.data);
      setTousPostes(rP.data);
      setHoraires(rH.data);
    }).catch(console.error);
  }, []);

  // ── Filtrer les postes quand le département change ───────────────────────
  useEffect(() => {
    if (!form.structure) {
      setPostes([]);
      setForm(f => ({ ...f, poste_actuel: "" }));
      return;
    }
    // Filtrage côté frontend sur les postes déjà chargés
    const filtered = tousPostes.filter(p => {
      const structId = p.structure?._id || p.structure;
      return String(structId) === String(form.structure);
    });
    setPostes(filtered);
    setForm(f => ({ ...f, poste_actuel: "" }));
  }, [form.structure, tousPostes]);

  // ── Gestion changement de champ ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Effacer l'erreur du champ modifié
    setErreurs(err => { const n = { ...err }; delete n[name]; return n; });
  };

  // ── Gestion photos ───────────────────────────────────────────────────────
  const handlePhotos = (e) => {
    const fichiers = Array.from(e.target.files);
    if (photos.length + fichiers.length > 10) {
      setErreurs(err => ({ ...err, photos: "Maximum 10 photos autorisées." }));
      return;
    }
    const nouveaux = fichiers.slice(0, 10 - photos.length);
    setPhotos(p => [...p, ...nouveaux]);
    setPreviews(p => [...p, ...nouveaux.map(f => URL.createObjectURL(f))]);
    setErreurs(err => { const n = { ...err }; delete n.photos; return n; });
  };

  const supprimerPhoto = (index) => {
    setPhotos(p => p.filter((_, i) => i !== index));
    setPreviews(p => p.filter((_, i) => i !== index));
  };

  // ── Validation par étape ─────────────────────────────────────────────────
  const validerEtape = (num) => {
    const nvErreurs = {};

    if (num === 1) {
      if (!form.matricule.trim())
        nvErreurs.matricule = "Le matricule est obligatoire.";
      else if (!/^[A-Za-z0-9\-_]+$/.test(form.matricule))
        nvErreurs.matricule = "Le matricule ne doit contenir que des lettres, chiffres, tirets et underscores.";

      if (!form.nom.trim())
        nvErreurs.nom = "Le nom est obligatoire.";
      else if (form.nom.trim().length < 2)
        nvErreurs.nom = "Le nom doit contenir au moins 2 caractères.";

      if (!form.prenom.trim())
        nvErreurs.prenom = "Le prénom est obligatoire.";
      else if (form.prenom.trim().length < 2)
        nvErreurs.prenom = "Le prénom doit contenir au moins 2 caractères.";

      if (form.telephone && !telValide(form.telephone))
        nvErreurs.telephone = "Numéro de téléphone invalide (7-15 chiffres).";

      if (form.date_naissance && !dateValide(form.date_naissance))
        nvErreurs.date_naissance = "Date de naissance invalide.";
      else if (form.date_naissance) {
        const dn = new Date(form.date_naissance);
        const aujourd = new Date();
        if (dn >= aujourd)
          nvErreurs.date_naissance = "La date de naissance doit être dans le passé.";
        const age = (aujourd - dn) / (365.25 * 24 * 3600 * 1000);
        if (age < 16 || age > 100)
          nvErreurs.date_naissance = "L'âge doit être entre 16 et 100 ans.";
      }
    }

    if (num === 2) {
      if (!form.email.trim())
        nvErreurs.email = "L'email est obligatoire.";
      else if (!emailValide(form.email))
        nvErreurs.email = "Adresse email invalide.";

      if (!form.mot_de_passe)
        nvErreurs.mot_de_passe = "Le mot de passe est obligatoire.";
      else if (form.mot_de_passe.length < 6)
        nvErreurs.mot_de_passe = "Le mot de passe doit contenir au moins 6 caractères.";
      else if (!/[A-Za-z]/.test(form.mot_de_passe) || !/[0-9]/.test(form.mot_de_passe))
        nvErreurs.mot_de_passe = "Le mot de passe doit contenir au moins une lettre et un chiffre.";
    }

    if (num === 3) {
      if (!form.structure)
        nvErreurs.structure = "Le département est obligatoire.";

      if (!form.poste_actuel)
        nvErreurs.poste_actuel = !form.structure
          ? "Sélectionnez d'abord un département."
          : postes.length === 0
            ? "Ce département n'a aucun poste disponible."
            : "Le poste est obligatoire.";

      if (form.date_embauche && !dateValide(form.date_embauche))
        nvErreurs.date_embauche = "Date d'embauche invalide.";

      if (form.date_fin_contrat) {
        if (!dateValide(form.date_fin_contrat))
          nvErreurs.date_fin_contrat = "Date de fin de contrat invalide.";
        else if (form.date_embauche && new Date(form.date_fin_contrat) <= new Date(form.date_embauche))
          nvErreurs.date_fin_contrat = "La fin de contrat doit être après la date d'embauche.";
      }
    }

    setErreurs(nvErreurs);
    return Object.keys(nvErreurs).length === 0;
  };

  const handleSuivant = () => {
    if (!validerEtape(etape)) return;
    setEtape(e => e + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validerEtape(3)) return;
    setChargement(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      photos.forEach(p => formData.append("photos", p));
      await serviceEmployes.creer(formData);
      setSucces(true);
      setTimeout(() => navigate("/employes"), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de la création.";
      // Déterminer à quelle étape appartient l'erreur
      if (msg.toLowerCase().includes("matricule")) {
        setEtape(1);
        setErreurs({ matricule: msg });
      } else if (msg.toLowerCase().includes("email")) {
        setEtape(2);
        setErreurs({ email: msg });
      } else {
        setErreurs({ global: msg });
      }
    } finally {
      setChargement(false);
    }
  };

  // ── Écran succès ─────────────────────────────────────────────────────────
  if (succes) return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#e6fcf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <FaCheck color="#0ca678" size={40} />
          </div>
          <h2 style={{ color: "#0ca678", marginBottom: 8 }}>Employé créé avec succès !</h2>
          <p style={{ color: "#888" }}>Redirection vers la liste des employés...</p>
        </div>
      </main>
    </div>
  );

  // ── Composant champ avec erreur ──────────────────────────────────────────
  const ChampErreur = ({ champ }) =>
    erreurs[champ] ? (
      <span style={{ fontSize: "0.75rem", color: "#e03131", marginTop: 3, display: "block" }}>
        ⚠ {erreurs[champ]}
      </span>
    ) : null;

  const stylChamp = (champ) => ({
    borderColor: erreurs[champ] ? "#e03131" : undefined,
    boxShadow: erreurs[champ] ? "0 0 0 2px #ffc9c944" : undefined,
  });

  const etapes = [
    { num: 1, label: "Identité" },
    { num: 2, label: "Compte" },
    { num: 3, label: "Poste" },
  ];

  return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main">

        {/* NAV */}
        <div className="detail-nav">
          <button className="btn-retour" onClick={() => navigate("/employes")}>
            <FaArrowLeft /> Retour aux employés
          </button>
          <div className="breadcrumb">
            <span>Employés</span><span className="bc-sep">›</span>
            <span style={{ color: "#ff5c00" }}>Nouvel employé</span>
          </div>
        </div>

        <div className="entete">
          <div>
            <h1 className="entete-titre"><span className="barre-orange" />Créer un employé</h1>
            <p className="entete-sous">Remplissez les informations en 3 étapes</p>
          </div>
        </div>

        {/* BARRE D'ÉTAPES */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e4e6ea",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          {etapes.map((e, i) => (
            <div
              key={e.num}
              style={{
                flex: 1, padding: "14px 20px",
                background: etape === e.num ? couleur : etape > e.num ? "#e6fcf5" : "#fff",
                display: "flex", alignItems: "center", gap: 10,
                borderRight: i < 2 ? "1px solid #e4e6ea" : "none",
                cursor: etape > e.num ? "pointer" : "default",
              }}
              onClick={() => { if (etape > e.num) setEtape(e.num); }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: etape === e.num ? "rgba(255,255,255,0.3)" : etape > e.num ? "#0ca678" : "#f0f0f0",
                color: etape === e.num ? "#fff" : etape > e.num ? "#fff" : "#aaa",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.82rem", flexShrink: 0,
              }}>
                {etape > e.num ? "✓" : e.num}
              </div>
              <span style={{
                fontWeight: 700, fontSize: "0.9rem",
                color: etape === e.num ? "#fff" : etape > e.num ? "#0ca678" : "#aaa",
              }}>
                {e.label}
              </span>
            </div>
          ))}
        </div>

        {/* Erreur globale */}
        {erreurs.global && (
          <div style={{ background: "#fff5f5", border: "1px solid #ffc9c9", borderLeft: "4px solid #e03131", borderRadius: 8, padding: "10px 16px", color: "#c92a2a", fontWeight: 600, fontSize: "0.88rem", marginBottom: 16 }}>
            ⚠️ {erreurs.global}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ─── ÉTAPE 1 : IDENTITÉ ─── */}
          {etape === 1 && (
            <>
              <div className="detail-section">
                <h4 className="detail-section-titre">PHOTOS ({photos.length}/10)</h4>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={src} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "2px solid #e4e6ea" }} />
                      <button type="button" onClick={() => supprimerPhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#e03131", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed #e4e6ea", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", gap: 4, background: "#f5f6fa", transition: "0.15s" }}>
                      <FaCamera size={20} color="#ff5c00" />
                      <span style={{ fontSize: "0.7rem" }}>Ajouter</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
                {erreurs.photos && <span style={{ fontSize: "0.75rem", color: "#e03131", marginTop: 6, display: "block" }}>⚠ {erreurs.photos}</span>}
              </div>

              <div className="detail-section">
                <h4 className="detail-section-titre">INFORMATIONS PERSONNELLES</h4>
                <div className="creer-grille">
                  <div className="creer-champ">
                    <label>Matricule *</label>
                    <input name="matricule" value={form.matricule} onChange={handleChange} placeholder="2026001" style={stylChamp("matricule")} />
                    <ChampErreur champ="matricule" />
                  </div>
                  <div className="creer-champ">
                    <label>Nom *</label>
                    <input name="nom" value={form.nom} onChange={handleChange} style={stylChamp("nom")} />
                    <ChampErreur champ="nom" />
                  </div>
                  <div className="creer-champ">
                    <label>Prénom *</label>
                    <input name="prenom" value={form.prenom} onChange={handleChange} style={stylChamp("prenom")} />
                    <ChampErreur champ="prenom" />
                  </div>
                  <div className="creer-champ">
                    <label>Téléphone</label>
                    <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="0555..." style={stylChamp("telephone")} />
                    <ChampErreur champ="telephone" />
                  </div>
                  <div className="creer-champ">
                    <label>Date de naissance</label>
                    <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} style={stylChamp("date_naissance")} />
                    <ChampErreur champ="date_naissance" />
                  </div>
                  <div className="creer-champ">
                    <label>Lieu de naissance</label>
                    <input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── ÉTAPE 2 : COMPTE ─── */}
          {etape === 2 && (
            <div className="detail-section">
              <h4 className="detail-section-titre">COMPTE & ACCÈS</h4>
              <div className="creer-grille">
                <div className="creer-champ" style={{ gridColumn: "1 / -1" }}>
                  <label>Email professionnel *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="prenom.nom@entreprise.dz" style={stylChamp("email")} />
                  <ChampErreur champ="email" />
                </div>
                <div className="creer-champ">
                  <label>Mot de passe *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={voirMdp ? "text" : "password"}
                      name="mot_de_passe"
                      value={form.mot_de_passe}
                      onChange={handleChange}
                      placeholder="••••••••"
                      style={{ paddingRight: 40, ...stylChamp("mot_de_passe") }}
                    />
                    <span onClick={() => setVoirMdp(!voirMdp)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>
                      {voirMdp ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <ChampErreur champ="mot_de_passe" />
                  {!erreurs.mot_de_passe && (
                    <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Minimum 6 caractères avec au moins une lettre et un chiffre</span>
                  )}

                  {/* Indicateur de force du mot de passe */}
                  {form.mot_de_passe && (
                    <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                      {["Faible", "Moyen", "Fort"].map((niveau, i) => {
                        const force =
                          form.mot_de_passe.length >= 6 &&
                            /[A-Za-z]/.test(form.mot_de_passe) &&
                            /[0-9]/.test(form.mot_de_passe)
                            ? form.mot_de_passe.length >= 10 && /[^A-Za-z0-9]/.test(form.mot_de_passe)
                              ? 2
                              : 1
                            : 0;
                        return (
                          <div
                            key={niveau}
                            style={{
                              height: 4, flex: 1, borderRadius: 2,
                              background: i <= force
                                ? ["#e03131", "#ff9800", "#0ca678"][force]
                                : "#e4e6ea",
                              transition: "0.3s",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="creer-champ">
                  <label>Rôle</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="employe">Employé</option>
                    <option value="chefdeservice">Chef de service</option>
                    <option value="chefdedepartement">Chef de département</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── ÉTAPE 3 : POSTE ─── */}
          {etape === 3 && (
            <div className="detail-section">
              <h4 className="detail-section-titre">POSTE & AFFECTATION</h4>
              <div className="creer-grille">
                {/* Département — obligatoire, filtre les postes */}
                <div className="creer-champ">
                  <label>Département *</label>
                  <select name="structure" value={form.structure} onChange={handleChange} style={stylChamp("structure")}>
                    <option value="">— Sélectionner —</option>
                    {departements.map(d => (
                      <option key={d._id} value={d._id}>{d.nom_departement}</option>
                    ))}
                  </select>
                  <ChampErreur champ="structure" />
                </div>

                {/* Poste — filtré selon département sélectionné */}
                <div className="creer-champ">
                  <label>Poste actuel *</label>
                  <select
                    name="poste_actuel"
                    value={form.poste_actuel}
                    onChange={handleChange}
                    disabled={!form.structure}
                    style={{
                      ...stylChamp("poste_actuel"),
                      opacity: !form.structure ? 0.5 : 1,
                      cursor: !form.structure ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">
                      {!form.structure
                        ? "— Choisissez d'abord un département —"
                        : postes.length === 0
                          ? "— Aucun poste dans ce département —"
                          : "— Sélectionner un poste —"}
                    </option>
                    {postes.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.intitule}{p.niveau ? ` (${p.niveau})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChampErreur champ="poste_actuel" />
                  {form.structure && postes.length === 0 && (
                    <span style={{ fontSize: "0.75rem", color: "#e03131", marginTop: 3, display: "block" }}>
                      ⚠ Ce département n'a aucun poste disponible. Créez d'abord un poste.
                    </span>
                  )}
                </div>

                <div className="creer-champ">
                  <label>Horaire de travail</label>
                  <select name="horaire" value={form.horaire} onChange={handleChange}>
                    <option value="">— Aucun —</option>
                    {horaires.map(h => (
                      <option key={h._id} value={h._id}>{h.nom_horaire || h.type}</option>
                    ))}
                  </select>
                </div>

                <div className="creer-champ">
                  <label>Date d'embauche</label>
                  <input type="date" name="date_embauche" value={form.date_embauche} onChange={handleChange} style={stylChamp("date_embauche")} />
                  <ChampErreur champ="date_embauche" />
                </div>

                <div className="creer-champ">
                  <label>Date fin de contrat</label>
                  <input type="date" name="date_fin_contrat" value={form.date_fin_contrat} onChange={handleChange}
                    min={form.date_embauche || undefined}
                    style={stylChamp("date_fin_contrat")} />
                  <ChampErreur champ="date_fin_contrat" />
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION ÉTAPES */}
          {/* NAVIGATION ÉTAPES */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 40 }}>
            {etape > 1 && (
              <button
                type="button"
                className="modal-btn-annuler"
                onClick={() => { setEtape(e => e - 1); setErreurs({}); }}
                style={{ minWidth: 120 }}
              >
                ← Précédent
              </button>
            )}

            {etape < 3 ? (
              <button
                type="button"
                className="detail-btn-approuver"
                style={{ background: couleur, minWidth: 160, flex: "none" }}
                onClick={handleSuivant}
              >
                Suivant →
              </button>
            ) : (
              <button
                type="submit"
                className="detail-btn-approuver"
                style={{ background: couleur, minWidth: 200, flex: "none" }}
                disabled={chargement}
              >
                {chargement ? "Création en cours..." : "✓ Créer l'employé"}
              </button>
            )}
          </div>

        </form>
      </main>
    </div>
  );
}