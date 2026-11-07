# RH & Pointage par reconnaissance faciale

Système de gestion du personnel avec pointage automatique par reconnaissance faciale.
Projet développé par Lyna Tiab (Master Génie Logiciel) — reconstruit ici pour un portfolio public.
 Voir [CHANGELOG.md](./CHANGELOG.md) pour le détail des versions et la roadmap.

**→ [Essayer la démo en direct](https://rh-pointage-reconnaissance-faciale-flame.vercel.app/demo-pointage) : inscris-toi avec ta webcam et teste le pointage par reconnaissance faciale, sans créer de compte.**
Le premier chargement peut prendre jusqu'à une minute : l'hébergement gratuit met les services en veille après une période d'inactivité.


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

## État actuel : v1.3.1
Le cœur du projet est fonctionnel de bout en bout : gestion des employés (CRUD + import
en masse), authentification JWT, et pointage par reconnaissance faciale testable en
direct via la webcam, y compris par un visiteur sans compte, via `/demo-pointage`.

### Points connus
- Pas encore de distinction de droits par rôle (admin vs employé).
- Les photos uploadées en ligne sont stockées sur le disque éphémère de l'hébergeur : elles
  disparaissent à chaque redéploiement ou redémarrage. Un placeholder s'affiche à la place.
  Un stockage externe (Cloudinary) est prévu. La reconnaissance faciale n'est pas
  affectée, les empreintes étant stockées en base.
- Le thème (`/api/apparence/settings`) n'est pas encore implémenté : 404 silencieuse en
  console, sans impact (couleur par défaut appliquée).
- La liste des pointages (`/api/pointages`) est volontairement simple pour l'instant, sans
  calcul de retard ni d'assiduité.
- Les comptes créés via `/demo-pointage` (`est_test: true`) s'accumulent en base sans
  nettoyage automatique.