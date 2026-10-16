// src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// La couleur principale est stockée dans apparence.json côté backend,
// exactement comme le logo et le background de login.
// Au démarrage, on appelle GET /api/apparence/settings pour récupérer la
// couleur et l'appliquer immédiatement via des variables CSS sur :root.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/apparence`;

// ── Palettes prédéfinies ──────────────────────────────────────────────────────
export const PALETTES_PREDEFINIES = [
  { id: "orange",  label: "Orange (défaut)",  couleur: "#ff5c00", preview: "linear-gradient(135deg, #ff5c00, #ff8c42)" },
  { id: "bleu",    label: "Bleu Corporate",   couleur: "#1971c2", preview: "linear-gradient(135deg, #1971c2, #4dabf7)" },
  { id: "vert",    label: "Vert Émeraude",    couleur: "#0ca678", preview: "linear-gradient(135deg, #0ca678, #38d9a9)" },
  { id: "violet",  label: "Violet Premium",   couleur: "#7048e8", preview: "linear-gradient(135deg, #7048e8, #a78bfa)" },
  { id: "rouge",   label: "Rouge Vif",        couleur: "#e03131", preview: "linear-gradient(135deg, #e03131, #ff6b6b)" },
  { id: "teal",    label: "Teal Moderne",     couleur: "#0891b2", preview: "linear-gradient(135deg, #0891b2, #22d3ee)" },
  { id: "rose",    label: "Rose Dynamique",   couleur: "#e64980", preview: "linear-gradient(135deg, #e64980, #f783ac)" },
  { id: "indigo",  label: "Indigo Pro",       couleur: "#4263eb", preview: "linear-gradient(135deg, #4263eb, #748ffc)" },
];

const COULEUR_DEFAUT = "#ff5c00";

// ── Utilitaires couleur ───────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function melangerBlanc(hex, ratio) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r + (255 - r) * ratio)}, ${Math.round(g + (255 - g) * ratio)}, ${Math.round(b + (255 - b) * ratio)})`;
}

function assombrir(hex, ratio) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
}

/** Applique toutes les variables CSS sur :root — instantané, sans re-render */
function appliquerCss(couleur) {
  const root = document.documentElement;
  const { r, g, b } = hexToRgb(couleur);

  const vars = {
    "--couleur-principale":            couleur,
    "--couleur-principale-clair":      melangerBlanc(couleur, 0.88),
    "--couleur-principale-moyen":      melangerBlanc(couleur, 0.70),
    "--couleur-principale-bord":       melangerBlanc(couleur, 0.55),
    "--couleur-principale-fonce":      assombrir(couleur, 0.15),
    "--couleur-principale-tres-fonce": assombrir(couleur, 0.28),
    "--couleur-principale-rgb":        `${r}, ${g}, ${b}`,
    // Alias rétrocompatibilité avec l'ancien code qui utilise --orange
    "--orange":                        couleur,
    "--orange-clair":                  melangerBlanc(couleur, 0.88),
  };

  Object.entries(vars).forEach(([prop, val]) => root.style.setProperty(prop, val));
}

// ── Contexte ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [couleur,    setCouleur]    = useState(COULEUR_DEFAUT);
  const [chargement, setChargement] = useState(true);

  // Au montage : charger depuis le backend (même endpoint que logo/favicon)
  useEffect(() => {
    // Pré-application immédiate pour éviter le flash orange→autre couleur
    appliquerCss(COULEUR_DEFAUT);

    axios.get(`${API_BASE}/settings`)
      .then(({ data }) => {
        const c = data.couleurPrincipale || COULEUR_DEFAUT;
        setCouleur(c);
        appliquerCss(c);
      })
      .catch(() => {
        // Silencieux — la couleur par défaut reste appliquée
      })
      .finally(() => setChargement(false));
  }, []);

  /**
   * changerCouleur(hex)
   * 1. Applique instantanément en CSS (feedback immédiat pour l'admin)
   * 2. Sauvegarde dans le backend → partagé avec tous les utilisateurs
   */
  const changerCouleur = useCallback(async (nouvelleCouleur) => {
    // Application immédiate — pas besoin d'attendre la réponse serveur
    setCouleur(nouvelleCouleur);
    appliquerCss(nouvelleCouleur);

    try {
      await axios.put(`${API_BASE}/couleur`, { couleur: nouvelleCouleur });
    } catch (err) {
      console.error("Erreur sauvegarde couleur:", err);
      // On garde quand même la couleur appliquée visuellement
    }
  }, []);

  /** Remet #ff5c00 et le persiste côté serveur */
  const reinitialiser = useCallback(async () => {
    setCouleur(COULEUR_DEFAUT);
    appliquerCss(COULEUR_DEFAUT);
    try {
      await axios.put(`${API_BASE}/couleur`, { couleur: COULEUR_DEFAUT });
    } catch (err) {
      console.error("Erreur reset couleur:", err);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ couleur, changerCouleur, reinitialiser, chargement }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
}