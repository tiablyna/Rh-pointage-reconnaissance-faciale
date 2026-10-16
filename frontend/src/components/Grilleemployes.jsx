import { useNavigate } from "react-router-dom";
import CarteEmploye from "./Carteemploye";
import { FaUserTie } from "react-icons/fa";

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : GrilleEmployes
//
// RÔLE :
//   Ce composant est le "conteneur" des cartes.
//   Il reçoit la liste filtrée d'employés depuis la page parente (ListeEmployes)
//   et se charge uniquement de les afficher en grille responsive.
//
// LOGIQUE DE SÉPARATION :
//   - CarteEmploye  → sait AFFICHER un employé (UI d'une seule carte)
//   - GrilleEmployes → sait ORGANISER plusieurs cartes (layout, états vides, navigation)
//   - ListeEmployes  → sait GÉRER les données (API, filtres, recherche)
//   Chaque composant a une seule responsabilité = code plus facile à maintenir
//
// Props :
//   - employes    : tableau d'objets employé déjà filtrés par la page parente
//   - chargement  : booléen — afficher le spinner ou les cartes
// ═════════════════════════════════════════════════════════════════════════════
export default function GrilleEmployes({ employes, chargement }) {
  // useNavigate dans ce composant car c'est lui qui gère le clic sur une carte
  // LOGIQUE : la navigation est une responsabilité du conteneur, pas de la carte elle-même
  // La carte reçoit juste "onClick" sans savoir où elle navigue
  const navigate = useNavigate();

  // ── CAS 1 : Chargement en cours ──────────────────────────────────────────
  // On affiche un état de chargement avec des cartes "skeleton" (silhouettes grises)
  // pour éviter que la page saute quand les données arrivent
  if (chargement) {
    return (
      <div className="emp-grille-cards">
        {/* 8 cartes skeleton = aperçu du nombre habituel de cartes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="emp-card emp-card-skeleton">
            <div className="skeleton-banner" />
            <div className="skeleton-avatar" />
            <div className="skeleton-body">
              <div className="skeleton-line long" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── CAS 2 : Liste vide ────────────────────────────────────────────────────
  // Aucun employé trouvé (liste vide ou recherche sans résultat)
  if (employes.length === 0) {
    return (
      <div className="liste-vide">
        <FaUserTie size={40} color="#ddd" />
        <p>Aucun employé trouvé</p>
      </div>
    );
  }

  // ── CAS 3 : Affichage normal ──────────────────────────────────────────────
  // Grille responsive de CarteEmploye
  // LOGIQUE :
  //   - .map() parcourt chaque employé et retourne une CarteEmploye
  //   - key={e._id} : clé unique React (obligatoire dans les listes)
  //     → permet à React de savoir quelle carte mettre à jour si la liste change
  //   - onClick : fonction qui navigue vers /employes/:id
  //     → on utilise une arrow function pour passer l'ID au bon moment
  return (
    <div className="emp-grille-cards">
      {employes.map(e => (
        <CarteEmploye
          key={e._id}
          employe={e}
          onClick={() => navigate(`/employes/${e._id}`)}
        />
      ))}
    </div>
  );
}