import { useState } from "react";
import { FaBuilding, FaEnvelope, FaPhone } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext"; // 👈 IMPORT AJOUTÉ

// ─────────────────────────────────────────────────────────────────────────────
// construireUrl(chemin)
// Transforme un chemin relatif BDD en URL complète vers le backend
// Ex: "uploads/photo.jpg" → "http://localhost:5000/uploads/photo.jpg"
// ─────────────────────────────────────────────────────────────────────────────
function construireUrl(chemin) {
  if (!chemin) return null;
  if (chemin.startsWith("http")) return chemin;
  const propre = chemin.replace(/^\/+/, "");
  if (!propre.startsWith("uploads/")) return `${process.env.REACT_APP_API_URL}/uploads/${propre}`;
  return `${process.env.REACT_APP_API_URL}/${propre}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CarteEmploye
//
// DESIGN : Carte carrée compacte (260px) avec :
//   - Haut : banderole colorée fine + photo ronde centrée à cheval sur la banderole
//   - Corps : nom, poste, département, email/téléphone
//   - Bas : badge de rôle discret
//
// LOGIQUE :
//   - Si photo disponible → affichée, sinon → cercle avec initiales
//   - La couleur de la banderole + badge dépend du rôle de l'employé
//   - onClick déclenché sur toute la carte → navigation vers le détail
//
// Props :
//   - employe : objet MongoDB complet (avec .populate structure, poste_actuel)
//   - onClick  : callback de navigation (passé depuis GrilleEmployes)
// ═════════════════════════════════════════════════════════════════════════════
export default function CarteEmploye({ employe, onClick }) {
  // Récupérer la couleur principale du thème
  const { couleur: couleurPrincipale } = useTheme();

  // photoErr : devient true si l'image ne charge pas → on affiche les initiales
  const [photoErr, setPhotoErr] = useState(false);

  // URL de la photo principale (index 0 du tableau photo[])
  const photoUrl = employe.photo?.[0] && !photoErr
    ? construireUrl(employe.photo[0])
    : null;

  // Dictionnaire des couleurs par rôle avec la couleur dynamique pour 'employe'
  const COULEUR_ROLE = {
    admin:             { color: "#7048e8", bg: "#f3f0ff", label: "Admin" },
    chefdeservice:     { color: "#1971c2", bg: "#dbeafe", label: "Chef de service" },
    chefdedepartement: { color: "#0ca678", bg: "#d1fae5", label: "Chef de dept." },
    employe:           { color: couleurPrincipale, bg: `${couleurPrincipale}15`, label: "Employé" },
  };

  // Couleurs du rôle — fallback sur "employe" si rôle inconnu
  const role = COULEUR_ROLE[employe.role] || COULEUR_ROLE.employe;

  // Initiales : première lettre du nom + première lettre du prénom
  const initiales = `${employe.nom?.[0] || ""}${employe.prenom?.[0] || ""}`.toUpperCase();

  return (
    // ── Carte principale ──
    // cursor pointer + transition pour indiquer que c'est cliquable
    <div
      className="emp-card"
      onClick={onClick}
      // La bordure gauche prend la couleur du rôle → accent visuel discret
      style={{ borderLeft: `3px solid ${role.color}` }}
    >

      {/* ── BANDEROLE HAUTE ──────────────────────────────────────────────── */}
      {/* Fine bande colorée en haut de la carte */}
      <div className="emp-card-banner" style={{ background: role.bg }} />

      {/* ── AVATAR ───────────────────────────────────────────────────────── */}
      {/* Positionné à cheval entre la banderole et le corps grâce à margin-top négatif */}
      <div className="emp-card-avatar-wrapper">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${employe.prenom} ${employe.nom}`}
            className="emp-card-photo"
            style={{ borderColor: role.color }}   // bordure colorée selon le rôle
            onError={() => setPhotoErr(true)}      // si l'image échoue → initiales
          />
        ) : (
          // Cercle avec initiales — fond coloré selon le rôle
          <div
            className="emp-card-initiales"
            style={{ background: role.color, borderColor: role.bg }}
          >
            {initiales}
          </div>
        )}
      </div>

      {/* ── CORPS ────────────────────────────────────────────────────────── */}
      <div className="emp-card-body">

        {/* Nom complet */}
        <h3 className="emp-card-nom">{employe.prenom} {employe.nom}</h3>

        {/* Poste actuel */}
        <p className="emp-card-poste">{employe.poste_actuel?.intitule || "—"}</p>

        {/* Séparateur */}
        <div className="emp-card-divider" style={{ background: role.bg }} />

        {/* Département */}
        {employe.structure && (
          <div className="emp-card-info-ligne">
            <FaBuilding size={11} color={role.color} />
            <span>{employe.structure.STRacro || employe.structure.nom_departement}</span>
          </div>
        )}

        {/* Email (tronqué si trop long) */}
        {employe.email && (
          <div className="emp-card-info-ligne">
            <FaEnvelope size={11} color={role.color} />
            <span className="emp-card-email">{employe.email}</span>
          </div>
        )}

        {/* Téléphone */}
        {employe.telephone && (
          <div className="emp-card-info-ligne">
            <FaPhone size={11} color={role.color} />
            <span>{employe.telephone}</span>
          </div>
        )}

      </div>

      {/* ── PIED DE CARTE ────────────────────────────────────────────────── */}
      <div className="emp-card-footer">
        {/* Badge rôle coloré */}
        <span
          className="emp-card-badge"
          style={{ background: role.bg, color: role.color }}
        >
          {role.label}
        </span>
        {/* Matricule discret à droite */}
        <span className="emp-card-matricule">#{employe.matricule}</span>
      </div>

    </div>
  );
}