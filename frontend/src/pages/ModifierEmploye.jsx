// pages/ModifierEmploye.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { serviceEmployes, serviceStructures, servicePostes, serviceHoraires } from "../services/api";
import { FaArrowLeft, FaCamera, FaTimes, FaCheck, FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import ToastNotif from "../components/ToastNotif";

function construireUrl(chemin) {
  if (!chemin) return null;
  if (chemin.startsWith("http")) return chemin;
  const propre = chemin.replace(/^\/+/, "");
  if (!propre.startsWith("uploads/")) return `${process.env.REACT_APP_API_URL}/uploads/${propre}`;
  return `${process.env.REACT_APP_API_URL}/${propre}`;
}

const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const telValide   = (t) => !t || /^[0-9\s\+\-\(\)]{7,15}$/.test(t);

export default function ModifierEmploye() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departements, setDepartements] = useState([]);
  const [tousPostes,   setTousPostes]   = useState([]);
  const [postes,       setPostes]       = useState([]);
  const [horaires,     setHoraires]     = useState([]);

  // Photos
  const [photosExistantes, setPhotosExistantes] = useState([]);
  const [photosASupprime,  setPhotosASupprime]  = useState([]);
  const [nouvellesPhotos,  setNouvellesPhotos]  = useState([]);
  const [previews,         setPreviews]         = useState([]);

  const [form,       setForm]       = useState(null);
  const [erreurs,    setErreurs]    = useState({});
  const [chargement, setChargement] = useState(false);
  const [succes,     setSucces]     = useState(false);
  const [voirMdp,    setVoirMdp]    = useState(false);
  const [mdpChange,  setMdpChange]  = useState(false);
  const [nouveauMdp, setNouveauMdp] = useState("");

  // Toast notifications
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "succes",
    couleur: "#0ca678"
  });

  const afficherToast = (message, type = "succes", couleur = null) => {
    const couleurs = {
      succes: "#0ca678",
      erreur: "#e03131",
      alerte: "#ff5c00"
    };
    setToast({
      visible: true,
      message: message,
      type: type,
      couleur: couleur || couleurs[type] || "#0ca678"
    });
  };

  const fermerToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // ── Charger l'employé et les données de référence ────────────────────────
  useEffect(() => {
    Promise.all([
      serviceEmployes.obtenirParId(id),
      serviceStructures.obtenirTous(),
      servicePostes.obtenirTous(),
      serviceHoraires.obtenirTous(),
    ]).then(([rEmp, rD, rP, rH]) => {
      const emp = rEmp.data;
      setDepartements(rD.data);
      setTousPostes(rP.data);
      setHoraires(rH.data);
      setPhotosExistantes(emp.photo || []);

      const structureId =
        emp.poste_actuel?.structure?._id ||
        emp.poste_actuel?.structure ||
        "";

      setForm({
        matricule:       emp.matricule       || "",
        nom:             emp.nom             || "",
        prenom:          emp.prenom          || "",
        email:           emp.email           || "",
        telephone:       emp.telephone       || "",
        date_naissance:  emp.date_naissance  ? emp.date_naissance.split("T")[0] : "",
        lieu_naissance:  emp.lieu_naissance  || "",
        date_embauche:   emp.date_embauche   ? emp.date_embauche.split("T")[0] : "",
        date_fin_contrat:emp.date_fin_contrat ? emp.date_fin_contrat.split("T")[0] : "",
        role:            emp.role            || "employe",
        structure:       String(structureId),
        poste_actuel:    String(emp.poste_actuel?._id || emp.poste_actuel || ""),
        horaire:         String(emp.horaire?._id || emp.horaire || ""),
      });
    }).catch(err => {
      console.error(err);
      afficherToast("❌ Erreur lors du chargement des données", "erreur");
    });
  }, [id]);

  // ── Filtrer les postes selon le département ──────────────────────────────
  useEffect(() => {
    if (!form?.structure) { setPostes([]); return; }
    const filtered = tousPostes.filter(p => {
      const structId = p.structure?._id || p.structure;
      return String(structId) === String(form.structure);
    });
    setPostes(filtered);
  }, [form?.structure, tousPostes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === "structure") {
      setForm(f => ({ ...f, structure: value, poste_actuel: "" }));
    }
    setErreurs(err => { const n = { ...err }; delete n[name]; return n; });
  };

  const toggleSupprimerPhoto = (chemin) => {
    setPhotosASupprime(prev =>
      prev.includes(chemin) ? prev.filter(p => p !== chemin) : [...prev, chemin]
    );
  };

  const handleNouvellesPhotos = (e) => {
    const fichiers = Array.from(e.target.files);
    const totalActuel = photosExistantes.length - photosASupprime.length + nouvellesPhotos.length;
    if (totalActuel + fichiers.length > 10) {
      afficherToast("⚠️ Maximum 10 photos au total", "alerte");
      return;
    }
    const ajouts = fichiers.slice(0, 10 - totalActuel);
    setNouvellesPhotos(p => [...p, ...ajouts]);
    setPreviews(p => [...p, ...ajouts.map(f => URL.createObjectURL(f))]);
  };

  const supprimerNouvellePhoto = (index) => {
    setNouvellesPhotos(p => p.filter((_, i) => i !== index));
    setPreviews(p => p.filter((_, i) => i !== index));
  };

  const valider = () => {
    const nv = {};
    
    if (!form.matricule.trim()) {
      nv.matricule = "Le matricule est obligatoire";
    } else if (!/^[A-Za-z0-9\-_]+$/.test(form.matricule)) {
      nv.matricule = "Le matricule ne doit contenir que des lettres, chiffres, tirets et underscores";
    }
    
    if (!form.nom.trim() || form.nom.trim().length < 2) {
      nv.nom = "Le nom doit contenir au moins 2 caractères";
    }
    
    if (!form.prenom.trim() || form.prenom.trim().length < 2) {
      nv.prenom = "Le prénom doit contenir au moins 2 caractères";
    }
    
    if (!form.email.trim()) {
      nv.email = "L'email est obligatoire";
    } else if (!emailValide(form.email)) {
      nv.email = "Adresse email invalide";
    }
    
    if (form.telephone && !telValide(form.telephone)) {
      nv.telephone = "Numéro de téléphone invalide (7-15 chiffres)";
    }
    
    if (!form.structure) {
      nv.structure = "Le département est obligatoire";
    }
    
    if (!form.poste_actuel) {
      nv.poste_actuel = "Le poste est obligatoire";
    }
    
    if (mdpChange) {
      if (!nouveauMdp) {
        nv.mot_de_passe = "Saisissez le nouveau mot de passe";
      } else if (nouveauMdp.length < 6) {
        nv.mot_de_passe = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (!/[A-Za-z]/.test(nouveauMdp) || !/[0-9]/.test(nouveauMdp)) {
        nv.mot_de_passe = "Le mot de passe doit contenir au moins une lettre et un chiffre";
      }
    }
    
    // Validation des photos (au moins 3)
    const totalPhotosApresModif = (photosExistantes.length - photosASupprime.length) + nouvellesPhotos.length;
    if (totalPhotosApresModif < 3) {
      nv.photos = `Au moins 3 photos sont requises (actuellement: ${totalPhotosApresModif}/3)`;
    }
    
    if (form.date_embauche && form.date_fin_contrat &&
        new Date(form.date_fin_contrat) <= new Date(form.date_embauche)) {
      nv.date_fin_contrat = "La date de fin doit être après la date d'embauche";
    }

    setErreurs(nv);
    
    if (Object.keys(nv).length > 0) {
      const premierChamp = Object.keys(nv)[0];
      const messageErreur = nv[premierChamp];
      afficherToast(`⚠️ ${messageErreur}`, "alerte");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valider()) return;
    
    setChargement(true);
    try {
      const formData = new FormData();
      const champsTexte = [
        "matricule","nom","prenom","email","telephone",
        "date_naissance","lieu_naissance","date_embauche","date_fin_contrat",
        "role","poste_actuel","horaire"
      ];
      champsTexte.forEach(k => { if (form[k]) formData.append(k, form[k]); });

      if (mdpChange && nouveauMdp) {
        formData.append("nouveau_mot_de_passe", nouveauMdp);
      }

      const photosRestantes = photosExistantes.filter(p => !photosASupprime.includes(p));
      formData.append("photo_json", JSON.stringify(photosRestantes));
      nouvellesPhotos.forEach(p => formData.append("photos", p));

      await serviceEmployes.modifier(id, formData);
      
      afficherToast("✅ Employé modifié avec succès !", "succes");
      setSucces(true);
      setTimeout(() => navigate(`/employes/${id}`), 2000);
      
    } catch (err) {
      const response = err.response?.data;
      const msg = response?.message || "Erreur lors de la modification";
      
      // Gérer les erreurs de duplication
      if (response?.field === "matricule") {
        afficherToast(`❌ ${msg}`, "erreur");
        setErreurs({ matricule: msg });
        // Scroll vers le champ matricule
        setTimeout(() => {
          document.querySelector('input[name="matricule"]')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      } 
      else if (response?.field === "email") {
        afficherToast(`❌ ${msg}`, "erreur");
        setErreurs({ email: msg });
        setTimeout(() => {
          document.querySelector('input[name="email"]')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
      else if (response?.field === "photos") {
        afficherToast(`❌ ${msg}`, "erreur");
        setErreurs({ photos: msg });
      }
      else {
        afficherToast(`❌ ${msg}`, "erreur");
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
          <h2 style={{ color: "#0ca678", marginBottom: 8 }}>Modifications enregistrées !</h2>
          <p style={{ color: "#888" }}>Redirection vers le profil...</p>
        </div>
      </main>
    </div>
  );

  if (!form) return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main"><p className="chargement">Chargement...</p></main>
    </div>
  );

  const ChampErreur = ({ champ }) =>
    erreurs[champ] ? (
      <span style={{ fontSize: "0.75rem", color: "#e03131", marginTop: 3, display: "block" }}>
        ⚠ {erreurs[champ]}
      </span>
    ) : null;

  const stylChamp = (champ) => ({
    borderColor: erreurs[champ] ? "#e03131" : undefined,
    boxShadow:   erreurs[champ] ? "0 0 0 2px #ffc9c944" : undefined,
  });

  const totalPhotosApresModif = (photosExistantes.length - photosASupprime.length) + nouvellesPhotos.length;
  const photosManquantes = totalPhotosApresModif < 3;

  return (
    <div className="layout">
      <Sidebar active="employes" />
      <main className="main">

        {/* Toast Notification */}
        <ToastNotif 
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          couleur={toast.couleur}
          onClose={fermerToast}
        />

        <div className="detail-nav">
          <button className="btn-retour" onClick={() => navigate(`/employes/${id}`)}>
            <FaArrowLeft /> Retour au profil
          </button>
          <div className="breadcrumb">
            <span>Employés</span><span className="bc-sep">›</span>
            <span style={{ color: "#ff5c00" }}>Modifier</span>
          </div>
        </div>

        <div className="entete">
          <div>
            <h1 className="entete-titre"><span className="barre-orange" />Modifier l'employé</h1>
            <p className="entete-sous">{form.prenom} {form.nom} — #{form.matricule}</p>
          </div>
        </div>

        {/* Alerte photos manquantes */}
        {photosManquantes && (
          <div style={{ 
            background: "#fff5f5", 
            border: "1px solid #ffc9c9", 
            borderLeft: "4px solid #e03131", 
            borderRadius: 8, 
            padding: "12px 16px", 
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong style={{ color: "#e03131" }}>Photos insuffisantes</strong>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>
                Vous devez avoir au moins 3 photos. Actuellement: {totalPhotosApresModif}/3
              </p>
            </div>
          </div>
        )}

        {erreurs.global && (
          <div style={{ background: "#fff5f5", border: "1px solid #ffc9c9", borderLeft: "4px solid #e03131", borderRadius: 8, padding: "10px 16px", color: "#c92a2a", fontWeight: 600, fontSize: "0.88rem", marginBottom: 16 }}>
            ⚠️ {erreurs.global}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ─── GESTION PHOTOS ─── */}
          <div className="detail-section" style={{ borderColor: photosManquantes ? "#e03131" : undefined }}>
            <h4 className="detail-section-titre">
              PHOTOS 
              <span style={{ 
                fontSize: "0.75rem", 
                color: photosManquantes ? "#e03131" : totalPhotosApresModif >= 3 ? "#0ca678" : "#ff5c00",
                marginLeft: 10
              }}>
                ({totalPhotosApresModif}/3 minimum)
              </span>
            </h4>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 12 }}>
              Cliquez sur une photo existante pour la marquer à supprimer (rouge). Ajoutez de nouvelles photos via le bouton +.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {photosExistantes.map((chemin, i) => {
                const aSupprimer = photosASupprime.includes(chemin);
                return (
                  <div key={i} style={{ position: "relative", cursor: "pointer" }} onClick={() => toggleSupprimerPhoto(chemin)}>
                    <img src={construireUrl(chemin)} alt="" style={{ 
                      width: 80, height: 80, borderRadius: 12, objectFit: "cover", 
                      border: aSupprimer ? "3px solid #e03131" : "2px solid #e4e6ea", 
                      opacity: aSupprimer ? 0.5 : 1, 
                      transition: "0.2s" 
                    }} />
                    {aSupprimer && (
                      <div style={{ position: "absolute", inset: 0, background: "#e0313133", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FaTrash color="#e03131" size={20} />
                      </div>
                    )}
                    <span style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: "0.65rem", color: aSupprimer ? "#e03131" : "#aaa" }}>
                      {aSupprimer ? "À suppr." : "Existante"}
                    </span>
                  </div>
                );
              })}

              {previews.map((src, i) => (
                <div key={`new-${i}`} style={{ position: "relative" }}>
                  <img src={src} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "2px solid #0ca678" }} />
                  <button type="button" onClick={() => supprimerNouvellePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#e03131", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>
                    <FaTimes />
                  </button>
                  <span style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: "0.65rem", color: "#0ca678" }}>Nouvelle</span>
                </div>
              ))}

              {(photosExistantes.length - photosASupprime.length + nouvellesPhotos.length) < 10 && (
                <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed #e4e6ea", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", gap: 4, background: "#f5f6fa", marginTop: 0 }}>
                  <FaCamera size={20} color="#ff5c00" />
                  <span style={{ fontSize: "0.7rem" }}>Ajouter</span>
                  <input type="file" accept="image/*" multiple onChange={handleNouvellesPhotos} style={{ display: "none" }} />
                </label>
              )}
            </div>
            {photosASupprime.length > 0 && (
              <p style={{ fontSize: "0.78rem", color: "#e03131", marginTop: 22 }}>
                ⚠ {photosASupprime.length} photo(s) seront supprimées à l'enregistrement.
              </p>
            )}
            <ChampErreur champ="photos" />
          </div>

          {/* ─── INFOS PERSONNELLES ─── */}
          <div className="detail-section">
            <h4 className="detail-section-titre">INFORMATIONS PERSONNELLES</h4>
            <div className="creer-grille">
              <div className="creer-champ">
                <label>Matricule *</label>
                <input name="matricule" value={form.matricule} onChange={handleChange} style={stylChamp("matricule")} />
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
                <input name="telephone" value={form.telephone} onChange={handleChange} style={stylChamp("telephone")} />
                <ChampErreur champ="telephone" />
              </div>
              <div className="creer-champ">
                <label>Date de naissance</label>
                <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} />
              </div>
              <div className="creer-champ">
                <label>Lieu de naissance</label>
                <input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* ─── COMPTE ─── */}
          <div className="detail-section">
            <h4 className="detail-section-titre">COMPTE & ACCÈS</h4>
            <div className="creer-grille">
              <div className="creer-champ" style={{ gridColumn: "1 / -1" }}>
                <label>Email professionnel *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} style={stylChamp("email")} />
                <ChampErreur champ="email" />
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
              <div className="creer-champ">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Mot de passe
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: "0.8rem", color: "#ff5c00", cursor: "pointer" }}>
                    <input type="checkbox" checked={mdpChange} onChange={e => { setMdpChange(e.target.checked); setNouveauMdp(""); setErreurs(err => { const n = { ...err }; delete n.mot_de_passe; return n; }); }} />
                    Modifier le mot de passe
                  </label>
                </label>
                {mdpChange ? (
                  <div style={{ position: "relative" }}>
                    <input
                      type={voirMdp ? "text" : "password"}
                      value={nouveauMdp}
                      onChange={e => { setNouveauMdp(e.target.value); setErreurs(err => { const n = { ...err }; delete n.mot_de_passe; return n; }); }}
                      placeholder="Nouveau mot de passe"
                      style={{ paddingRight: 40, ...stylChamp("mot_de_passe") }}
                    />
                    <span onClick={() => setVoirMdp(!voirMdp)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>
                      {voirMdp ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    <ChampErreur champ="mot_de_passe" />
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#f5f6fa", borderRadius: 8, color: "#aaa", fontSize: "0.85rem" }}>
                    ●●●●●●●● (inchangé)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── POSTE & AFFECTATION ─── */}
          <div className="detail-section">
            <h4 className="detail-section-titre">POSTE & AFFECTATION</h4>
            <div className="creer-grille">
              <div className="creer-champ">
                <label>Département *</label>
                <select name="structure" value={form.structure} onChange={handleChange} style={stylChamp("structure")}>
                  <option value="">— Sélectionner —</option>
                  {departements.map(d => <option key={d._id} value={d._id}>{d.nom_departement}</option>)}
                </select>
                <ChampErreur champ="structure" />
              </div>
              <div className="creer-champ">
                <label>Poste actuel *</label>
                <select
                  name="poste_actuel"
                  value={form.poste_actuel}
                  onChange={handleChange}
                  disabled={!form.structure}
                  style={{ ...stylChamp("poste_actuel"), opacity: !form.structure ? 0.5 : 1 }}
                >
                  <option value="">
                    {!form.structure ? "— Choisissez d'abord un département —" : "— Sélectionner —"}
                  </option>
                  {postes.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.intitule}{p.niveau ? ` (${p.niveau})` : ""}
                    </option>
                  ))}
                </select>
                <ChampErreur champ="poste_actuel" />
              </div>
              <div className="creer-champ">
                <label>Horaire de travail</label>
                <select name="horaire" value={form.horaire} onChange={handleChange}>
                  <option value="">— Aucun —</option>
                  {horaires.map(h => <option key={h._id} value={h._id}>{h.nom_horaire || h.type}</option>)}
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
                  min={form.date_embauche || undefined} style={stylChamp("date_fin_contrat")} />
                <ChampErreur champ="date_fin_contrat" />
              </div>
            </div>
          </div>

          {/* BOUTONS */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 40 }}>
            <button type="button" className="modal-btn-annuler" onClick={() => navigate(`/employes/${id}`)}>
              Annuler
            </button>
            <button 
              type="submit" 
              className="detail-btn-approuver" 
              style={{ 
                background: photosManquantes ? "#ccc" : "#ff5c00", 
                minWidth: 200,
                cursor: photosManquantes ? "not-allowed" : "pointer"
              }} 
              disabled={chargement || photosManquantes}
            >
              {chargement ? "Enregistrement..." : "✓ Enregistrer les modifications"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}