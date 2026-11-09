// src/services/api.js
//
// Point d'entrée unique vers les services : aucun appel axios direct dans les
// composants. Les groupes marqués « À VENIR » correspondent à des routes
// backend pas encore implémentées (modules prévus de la v1.5 à la v2.0) :
// aucune page ne les appelle pour l'instant.
import axios from "axios";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
});

// Intercepteur token JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
// Token expiré ou invalide → retour à la page de connexion
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // authMiddleware répond 403 "Token invalide" quand le token est expiré ou signé
    // avec un autre secret. On ne réagit qu'à ce message précis : d'autres 401/403
    // (mauvais mot de passe, garde-fou de la démo...) ne doivent pas déconnecter.
    if (error.response?.data?.message === "Token invalide") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES DISPONIBLES (v1.0 → v1.4)
// ═════════════════════════════════════════════════════════════════════════════

// ─── AUTH (v1.1) ──────────────────────────────────────────────────────────────
export const serviceAuth = {
  login: (email, password) => API.post("/auth/login", { email, password }),
};

// ─── EMPLOYÉS (v1.0) ──────────────────────────────────────────────────────────
export const serviceEmployes = {
  obtenirTous: (params) => API.get("/employes", { params }),
  obtenirParId: (id) => API.get(`/employes/${id}`),
  obtenirCarriere: (id) => API.get(`/employes/${id}/carriere`),
  obtenirPlanning: (id, params) =>
    API.get(`/employes/${id}/planning`, { params }),

  creer: (formData) =>
    API.post("/employes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // PUT avec multipart pour permettre l'upload de nouvelles photos
  modifier: (id, formData) =>
    API.put(`/employes/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  supprimer: (id) => API.delete(`/employes/${id}`),

  gererCarriere: (id, data) => API.post(`/employes/${id}/carriere`, data),

  // Import en masse : POST /api/employes/import/masse
  // formData contient : champ "excel" (.xlsx) + champ "zip" (.zip)
  importerMasse: (formData) =>
    API.post("/employes/import/masse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ─── POSTES (v1.0) ────────────────────────────────────────────────────────────
export const servicePostes = {
  obtenirTous: (params) => API.get("/postes", { params }),
  obtenirParId: (id) => API.get(`/postes/${id}`),
  creer: (data) => API.post("/postes", data),
  modifier: (id, data) => API.put(`/postes/${id}`, data),
  supprimer: (id) => API.delete(`/postes/${id}`),
};

// ─── STRUCTURES / DÉPARTEMENTS (v1.0) ─────────────────────────────────────────
export const serviceStructures = {
  obtenirTous: () => API.get("/departements"),
  obtenirParId: (id) => API.get(`/structures/${id}`),
  creer: (data) => API.post("/structures", data),
  modifier: (id, data) => API.put(`/structures/${id}`, data),
  supprimer: (id) => API.delete(`/structures/${id}`),
};

// ─── HORAIRES (v1.0) ──────────────────────────────────────────────────────────
export const serviceHoraires = {
  obtenirTous: () => API.get("/horaires"),
  obtenirParId: (id) => API.get(`/horaires/${id}`),
  creer: (data) => API.post("/horaires", data),
  modifier: (id, data) => API.put(`/horaires/${id}`, data),
  supprimer: (id) => API.delete(`/horaires/${id}`),
};

// ─── DÉMO PUBLIQUE : inscription d'un employé de test (v1.3) ──────────────────
export const serviceDemoPointage = {
  creerEmployeTest: (formData) =>
    API.post("/demo/employe-test", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  enregistrerEmbeddings: (employeId, encodages) =>
    API.patch(`/demo/employe-test/${employeId}/embeddings`, { encodages }),
};

// ─── SERVICE DE RECONNAISSANCE FACIALE (v1.2) ─────────────────────────────────
// Autre service (Python/Flask), donc autre URL : instance axios dédiée, sans
// le token JWT (ces routes sont publiques, utilisées par la démo).
const APIReconnaissance = axios.create({
  baseURL: process.env.REACT_APP_PYTHON_URL || "http://localhost:5001",
});
export const serviceReconnaissance = {
  verifierSante: () => APIReconnaissance.get("/health"),
  // formData : champ "photo"
  encoder: (formData) => APIReconnaissance.post("/encoder", formData),
  // formData : champs "photo" + "type" ("entree" ou "sortie")
  reconnaitre: (formData) => APIReconnaissance.post("/reconnaitre", formData),
};

// ─── POINTAGES ────────────────────────────────────────────────────────────────
export const servicePointage = {
  // v1.3 — derniers pointages
  obtenirRecents: (limit = 20) => API.get("/pointages", { params: { limit } }),
  // v1.4 — assiduité mensuelle : params = { mois, annee }
  obtenirAssiduite: (params) => API.get("/pointages/assiduite", { params }),

  // À VENIR — routes backend pas encore implémentées
  obtenirAujourdhui: () => API.get("/pointages/aujourdhui"),
  obtenirHistorique: (params) => API.get("/pointages/historique", { params }),
  obtenirRapportEmploye: (employeId, params) =>
    API.get(`/pointages/rapport/${employeId}`, { params }),
  corrigerPointage: (id, data) => API.put(`/pointages/corriger/${id}`, data),
  // Vérifier une HS précise : data = { employe_id, date }
  verifierHeuresSup: (data) => API.post("/pointages/verifier-heures-sup", data),
  // Vérifier TOUTES les HS validées passées non encore vérifiées
  verifierToutesHeuresSup: (employeId) =>
    API.post("/pointages/verifier-heures-sup", { employe_id: employeId }),
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const serviceDashboard = {
  // v1.4
  obtenirStats: () => API.get("/dashboard/stats"),

  // À VENIR — routes backend pas encore implémentées
  obtenirAujourdhui: () => API.get("/pointages/aujourdhui"),
  // Même route que servicePointage.obtenirAssiduite (conservé : hérité du
  // dashboard d'origine, qui sera reconstruit en v2.0)
  obtenirAssiduite: (mois, annee) =>
    API.get("/pointages/assiduite", { params: { mois, annee } }),
  obtenirCongesAttente: () =>
    API.get("/conges", { params: { statut: "En attente" } }),
  obtenirAbsencesAttente: () =>
    API.get("/absences", { params: { statut: "En attente" } }),
  obtenirHeuresSupAttente: () =>
    API.get("/heures-sup", { params: { statut: "En attente" } }),
  // Courbe d'évolution jour par jour — 30 derniers jours ouvrables
  obtenirEvolution30j: () => API.get("/dashboard/evolution-30j"),
  // Donut des absences par motif — mois en cours
  obtenirAbsencesMotifs: () => API.get("/dashboard/absences-motifs"),
  // Valider / rejeter depuis le dashboard : type = "conge" | "absence" | "heureSup"
  validerDemande: (type, id) =>
    API.put(`/dashboard/demandes/${type}/${id}/valider`),
  rejeterDemande: (type, id) =>
    API.put(`/dashboard/demandes/${type}/${id}/rejeter`),
};

// ─── APPARENCE ────────────────────────────────────────────────────────────────
// Pas encore implémenté côté backend : appelé par Login.jsx et ThemeContext,
// qui tolèrent l'erreur 404 (fond et couleur par défaut).
export const appearanceService = {
  getSettings: () => API.get("/apparence/settings"),

  updateBackground: (file) => {
    const formData = new FormData();
    formData.append("background", file);
    return API.put("/apparence/background", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateLogo: (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    return API.put("/apparence/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateFavicon: (file) => {
    const formData = new FormData();
    formData.append("favicon", file);
    return API.put("/apparence/favicon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  resetToDefault: () => API.post("/apparence/reset"),
};

// ═════════════════════════════════════════════════════════════════════════════
// À VENIR (modules v1.5 → v2.0) — routes backend pas encore implémentées
// ═════════════════════════════════════════════════════════════════════════════

// ─── DEMANDES (absences, congés, heures supplémentaires) ──────────────────────
export const serviceDemandes = {
  // Absences
  obtenirAbsences: (params) =>
    API.get("/absences", { params: { statut: "En attente", ...params } }),
  obtenirAbsencesTraitees: (params) =>
    API.get("/absences", { params: { statut: "Validée", ...params } }),
  // Congés
  obtenirConges: (params) =>
    API.get("/conges", { params: { statut: "En attente", ...params } }),
  obtenirCongesTraites: (params) =>
    API.get("/conges", { params: { statut: "Validée", ...params } }),
  // Heures supplémentaires
  obtenirHeuresSup: (params) =>
    API.get("/heures-sup", { params: { statut: "En attente", ...params } }),
  obtenirHeuresSupTraitees: (params) =>
    API.get("/heures-sup", {
      params: {
        statut: ["Validée", "Effectuée", "Non effectuée"],
        ...params,
      },
      paramsSerializer: (p) => {
        const parts = [];
        Object.entries(p).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            val.forEach((v) => parts.push(`${key}=${encodeURIComponent(v)}`));
          } else if (val !== undefined && val !== null && val !== "") {
            parts.push(`${key}=${encodeURIComponent(val)}`);
          }
        });
        return parts.join("&");
      },
    }),
  // Départements
  obtenirDepartements: () => API.get("/departements"),
  // Solde congé
  obtenirSoldeConge: (employeId) => API.get(`/conges/solde/${employeId}`),
  // Mise à jour statut (validation/rejet)
  mettreAJourStatut: (type, id, nouveauStatut) =>
    API.put(`/${type}/${id}/statut`, { statut: nouveauStatut }),
};

// ─── PROFIL EMPLOYÉ ───────────────────────────────────────────────────────────
export const employeeProfilService = {
  obtenirProfil: (employeId) => API.get(`/employee/profil/${employeId}`),
  // Utilise la même route avec format=calendrier
  obtenirCalendrier: (employeId, mois, annee) =>
    API.get(`/employes/${employeId}/planning`, {
      params: { mois, annee, format: "calendrier" },
    }),
};

// ─── ABSENCES EMPLOYÉ ─────────────────────────────────────────────────────────
export const employeeAbsenceService = {
  // Récupérer mes absences
  obtenirMesAbsences: (employeId, annee) =>
    API.get(`/employee/absences/${employeId}`, {
      params: { annee },
    }),
  // Créer une nouvelle absence
  creerAbsence: (formData) => API.post("/employee/absences", formData), // ⚠️ ne pas mettre Content-Type
};

// ─── HEURES SUPP EMPLOYÉ ──────────────────────────────────────────────────────
// Récupérer les heures sup d'un employé par année
export const getHeuresSupEmploye = (employeId, annee) =>
  API.get(`/employee/heures-sup/${employeId}?annee=${annee}`);
// Créer une demande d'heures sup
export const createHeureSup = (data) => API.post(`/employee/heures-sup`, data);
// Annuler une demande d'heures sup
export const annulerHeureSup = (heureSupId, employeId) =>
  API.put(`/employee/heures-sup/annuler/${heureSupId}`, { employeId });

// ─── CONGÉS EMPLOYÉ ───────────────────────────────────────────────────────────
// Récupérer les congés d'un employé par année
export const getCongesEmploye = (employeId, annee) =>
  API.get(`/employee/conges/${employeId}?annee=${annee}`);
// Récupérer le solde de congés
export const getSoldeConges = (employeId) =>
  API.get(`/employee/conges/solde/${employeId}`);
// Créer une demande de congé
export const createConge = (data) => API.post(`/employee/conges`, data);
// Annuler une demande de congé
export const annulerConge = (congeId, employeId) =>
  API.put(`/employee/conges/annuler/${congeId}`, { employeId });

// ─── JOURS FÉRIÉS ────────────────────────────────────────────────────────────
export const serviceJoursFeries = {
  // GET /api/jours-feries?annee=2026
  obtenirParAnnee: (annee) => API.get("/jours-feries", { params: { annee } }),
  // POST /api/jours-feries  — body: { nom, date, type }
  ajouter: (data) => API.post("/jours-feries", data),
  // DELETE /api/jours-feries/:id
  supprimer: (id) => API.delete(`/jours-feries/${id}`),
};

// Identique à serviceEmployes.obtenirTous — conservé pour la future page Pointage
export const serviceEmployesPointage = {
  obtenirTous: (params) => API.get("/employes", { params }),
};