# RH & Pointage par reconnaissance faciale

Système de gestion du personnel avec pointage automatique par reconnaissance faciale.
Projet développé par Lyna Tiab (Master Génie Logiciel) — reconstruit ici pour un portfolio public.
 Voir [CHANGELOG.md](./CHANGELOG.md) pour le détail des versions et la roadmap.

## Stack technique
- **Frontend** : React, React Router
- **Backend** : Node.js, Express, MongoDB (Mongoose)
- **Reconnaissance faciale** *(à partir de la v1.2)* : Python, DeepFace (MTCNN + ArcFace), comparaison par distance cosinus
- **Auth** *(à partir de la v1.1)* : JWT

## Structure du dépôt
backend/ → API Express + MongoDB
frontend/ → Application React
pointagepython/ → Service Python de reconnaissance faciale (à partir de la v1.2)


## Démarrage en local

### Backend
```bash
cd backend
cp .env.example .env   # renseigner ton URI MongoDB
npm install
npm start
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## État actuel : v1.0
Le socle RH est en place : gestion complète des employés (CRUD + import en masse via
Excel/ZIP), postes, structures et horaires. L'authentification, le pointage par
reconnaissance faciale et les modules RH complémentaires arrivent dans les versions
suivantes.

### Points connus (v1.0)
- L'authentification (`authMiddleware`) est un passthrough temporaire — aucune route
  n'est protégée pour l'instant. Remplacée par un vrai contrôle JWT en v1.1.
- Le thème (`/api/apparence/settings`) n'est pas encore implémenté : erreur 404
  silencieuse en console, sans impact (couleur par défaut appliquée).