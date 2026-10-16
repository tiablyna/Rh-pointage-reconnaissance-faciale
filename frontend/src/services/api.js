// src/services/api.js
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
// ─── DEMANDES ─────────────────────────────────────────────────────────────────
export const serviceDemandes = {
  // Absences
  obtenirAbsences:         (params) => API.get("/absences",   { params: { statut: "En attente", ...params } }),
  obtenirAbsencesTraitees: (params) => API.get("/absences",   { params: { statut: "Validée",    ...params } }),
  // Congés
  obtenirConges:           (params) => API.get("/conges",     { params: { statut: "En attente", ...params } }),
  obtenirCongesTraites:    (params) => API.get("/conges",     { params: { statut: "Validée",    ...params } }),
  // Heures supplémentaires
  obtenirHeuresSup:        (params) => API.get("/heures-sup", { params: { statut: "En attente", ...params } }),
 obtenirHeuresSupTraitees: (params) => API.get("/heures-sup", { 
  params: { 
    statut: ["Validée", "Effectuée", "Non effectuée"], 
    ...params 
  },
  paramsSerializer: (p) => {
    const parts = [];
    Object.entries(p).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach(v => parts.push(`${key}=${encodeURIComponent(v)}`));
      } else if (val !== undefined && val !== null && val !== "") {
        parts.push(`${key}=${encodeURIComponent(val)}`);
      }
    });
    return parts.join("&");
  }
}),
  // Départements
  obtenirDepartements:     ()       => API.get("/departements"),
  // Solde congé
  obtenirSoldeConge:       (employeId) => API.get(`/conges/solde/${employeId}`),
  // Mise à jour statut (validation/rejet)
  mettreAJourStatut: (type, id, nouveauStatut) =>
    API.put(`/${type}/${id}/statut`, { statut: nouveauStatut }),
};
// ── PROFIL EMPLOYÉ ──────────────────────────────────────
export const employeeProfilService = {
  obtenirProfil: (employeId) =>
    API.get(`/employee/profil/${employeId}`),
  // Utilise la même route avec format=calendrier
  obtenirCalendrier: (employeId, mois, annee) =>
    API.get(`/employes/${employeId}/planning`, {
      params: { mois, annee, format: "calendrier" }
    })
};
// ── ABSENCES EMPLOYÉ ─────────────────────────────────────
export const employeeAbsenceService = {
  // Récupérer mes absences
  obtenirMesAbsences: (employeId, annee) =>
    API.get(`/employee/absences/${employeId}`, {
      params: { annee }
    }),
  // Créer une nouvelle absence
  creerAbsence: (formData) =>
    API.post("/employee/absences", formData) // ⚠️ ne pas mettre Content-Type
};
// ── HEURES SUPP EMPLOYÉ ─────────────────────────────────────
// Récupérer les heures sup d'un employé par année
export const getHeuresSupEmploye = (employeId, annee) =>
  API.get(`/employee/heures-sup/${employeId}?annee=${annee}`);
// Créer une demande d'heures sup
export const createHeureSup = (data) =>
  API.post(`/employee/heures-sup`, data);
// Annuler une demande d'heures sup
export const annulerHeureSup = (heureSupId, employeId) =>
  API.put(`/employee/heures-sup/annuler/${heureSupId}`, { employeId });
// ── CONGES EMPLOYÉ ─────────────────────────────────────
// Récupérer les congés d'un employé par année
export const getCongesEmploye = (employeId, annee) =>
  API.get(`/employee/conges/${employeId}?annee=${annee}`);
// Récupérer le solde de congés
export const getSoldeConges = (employeId) =>
  API.get(`/employee/conges/solde/${employeId}`);
// Créer une demande de congé
export const createConge = (data) =>
  API.post(`/employee/conges`, data);
// Annuler une demande de congé
export const annulerConge = (congeId, employeId) =>
  API.put(`/employee/conges/annuler/${congeId}`, { employeId });
// ─── EMPLOYÉS ─────────────────────────────────────────────────────────────────
export const serviceEmployes = {
  obtenirTous:     (params)     => API.get("/employes",                { params }),
  obtenirParId:    (id)         => API.get(`/employes/${id}`),
  obtenirCarriere: (id)         => API.get(`/employes/${id}/carriere`),
  obtenirPlanning: (id, params) => API.get(`/employes/${id}/planning`, { params }),
 
  creer:   (formData) => API.post("/employes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
 
  // PUT avec multipart pour permettre l'upload de nouvelles photos
  modifier: (id, formData) => API.put(`/employes/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
 
  supprimer: (id) => API.delete(`/employes/${id}`),
 
  gererCarriere: (id, data) => API.post(`/employes/${id}/carriere`, data),
 
  // Import en masse : POST /api/employes/import/masse
  // formData contient : champ "excel" (.xlsx) + champ "zip" (.zip)
  importerMasse: (formData) => API.post("/employes/import/masse", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};
// ─── POSTES ───────────────────────────────────────────────────────────────────
export const servicePostes = {
  obtenirTous:  (params) => API.get("/postes", { params }),
  obtenirParId: (id)     => API.get(`/postes/${id}`),
  creer:        (data)   => API.post("/postes", data),
  modifier:     (id, data) => API.put(`/postes/${id}`, data),
  supprimer:    (id)     => API.delete(`/postes/${id}`),
};
// ─── STRUCTURES / DÉPARTEMENTS ────────────────────────────────────────────────
export const serviceStructures = {
  obtenirTous:  ()         => API.get("/departements"),
  obtenirParId: (id)       => API.get(`/structures/${id}`),
  creer:        (data)     => API.post("/structures", data),
  modifier:     (id, data) => API.put(`/structures/${id}`, data),
  supprimer:    (id)       => API.delete(`/structures/${id}`),
};
// ─── HORAIRES ─────────────────────────────────────────────────────────────────
export const serviceHoraires = {
  obtenirTous:  ()         => API.get("/horaires"),
  obtenirParId: (id)       => API.get(`/horaires/${id}`),
  creer:        (data)     => API.post("/horaires", data),
  modifier:     (id, data) => API.put(`/horaires/${id}`, data),
  supprimer:    (id)       => API.delete(`/horaires/${id}`),
};
// ─── POINTAGE ─────────────────────────────────────────────────────────────────
export const servicePointage = {
  // Onglet 1 — Aujourd'hui
  obtenirAujourdhui: () =>
    API.get("/pointages/aujourdhui"),
  // Onglet 2 — Historique
  obtenirHistorique: (params) =>
    API.get("/pointages/historique", { params }),
  // Onglet 3 — Assiduité mensuelle
  obtenirAssiduite: (params) =>
    API.get("/pointages/assiduite", { params }),
  // Onglet 4 — Rapport employé individuel
  obtenirRapportEmploye: (employeId, params) =>
    API.get(`/pointages/rapport/${employeId}`, { params }),
  // Corriger un pointage manuellement
  corrigerPointage: (id, data) =>
    API.put(`/pointages/corriger/${id}`, data),
  // Vérifier les heures supplémentaires
  verifierHeuresSup: (data) =>
    API.post("/pointages/verifier-heures-sup", data),
 // Vérifier une HS précise : body = { employe_id, date }
  verifierHeuresSup:          (data)       => API.post("/pointages/verifier-heures-sup", data),
  // Vérifier TOUTES les HS validées passées non encore vérifiées : body = { employe_id }
  verifierToutesHeuresSup:    (employeId)  => API.post("/pointages/verifier-heures-sup", { employe_id: employeId }),
};

export const serviceEmployesPointage = {
  obtenirTous: (params) => API.get("/employes", { params }),
};
export const serviceJoursFeries = {
  // GET /api/jours-feries?annee=2026
  obtenirParAnnee: (annee) => API.get("/jours-feries", { params: { annee } }),
  // POST /api/jours-feries  — body: { nom, date, type }
  ajouter:         (data)  => API.post("/jours-feries", data),
  // DELETE /api/jours-feries/:id
  supprimer:       (id)    => API.delete(`/jours-feries/${id}`),
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// Réutilise les routes existantes + seulement 2 nouvelles routes backend
export const serviceDashboard = {
  // ── Routes existantes réutilisées ─────────────────────────────────────────

  // KPIs + liste employés du jour (stats: presents/absents/retards/conges/partis)
  obtenirAujourdhui: () =>
    API.get("/pointages/aujourdhui"),

  // Assiduité par département du mois en cours
  obtenirAssiduite: (mois, annee) =>
    API.get("/pointages/assiduite", { params: { mois, annee } }),

  // Demandes en attente — 3 appels sur routes déjà existantes
  obtenirCongesAttente:    () => API.get("/conges",     { params: { statut: "En attente" } }),
  obtenirAbsencesAttente:  () => API.get("/absences",   { params: { statut: "En attente" } }),
  obtenirHeuresSupAttente: () => API.get("/heures-sup", { params: { statut: "En attente" } }),

  // ── Nouvelles routes (dashboardController.js) ─────────────────────────────

  // Courbe évolution jour par jour — 30 derniers jours ouvrables
  obtenirEvolution30j: () =>
    API.get("/dashboard/evolution-30j"),

  // Donut absences par motif — mois en cours
  obtenirAbsencesMotifs: () =>
    API.get("/dashboard/absences-motifs"),

  // Valider / Rejeter depuis le dashboard (route unifiée)
  // type = "conge" | "absence" | "heureSup"
  validerDemande: (type, id) =>
    API.put(`/dashboard/demandes/${type}/${id}/valider`),
  rejeterDemande: (type, id) =>
    API.put(`/dashboard/demandes/${type}/${id}/rejeter`),
};



/////apparence 
export const appearanceService = {
  // Obtenir les paramètres actuels
  getSettings: () => API.get('/apparence/settings'),  // Changé: appearance -> apparence
  
  // Mettre à jour le background
  updateBackground: (file) => {
    const formData = new FormData();
    formData.append('background', file);
    return API.put('/apparence/background', formData, {  // Changé: appearance -> apparence
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Mettre à jour le logo
  updateLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return API.put('/apparence/logo', formData, {  // Changé: appearance -> apparence
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Mettre à jour le favicon
  updateFavicon: (file) => {
    const formData = new FormData();
    formData.append('favicon', file);
    return API.put('/apparence/favicon', formData, {  // Changé: appearance -> apparence
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Réinitialiser
  resetToDefault: () => API.post('/apparence/reset')  // Changé: appearance -> apparence
};