# RH & Pointage par reconnaissance faciale

Système de gestion du personnel avec pointage automatique par reconnaissance faciale.
Projet développé par Lyna Tiab (Master Génie Logiciel) — reconstruit ici en versions
successives pour un portfolio public. Voir [CHANGELOG.md](./CHANGELOG.md) pour le détail
des versions et la roadmap.

**→ [Essayer la démo en direct](https://rh-pointage-reconnaissance-faciale-flame.vercel.app/demo-pointage) : inscris-toi avec ta webcam et teste le pointage par reconnaissance faciale, sans créer de compte.**
Le premier chargement peut prendre jusqu'à une minute : l'hébergement gratuit met les services en veille après une période d'inactivité.

## Stack technique
- **Frontend** : React, React Router
- **Backend** : Node.js, Express, MongoDB (Mongoose), JWT
- **Reconnaissance faciale** : Python, Flask, DeepFace (ArcFace via ONNX Runtime, détection de visage OpenCV), comparaison par distance cosinus

## Structure du dépôt
```
backend/         → API Express + MongoDB + authentification JWT
frontend/        → Application React (admin + démo publique webcam)
pointagepython/  → Service Flask de reconnaissance faciale
```

## Déploiement
- **Frontend** : Vercel
- **Backend Node et service de reconnaissance faciale** : Render (plan gratuit)
- **Base de données** : MongoDB Atlas

## Démarrage en local

Les 3 services doivent tourner en parallèle, chacun dans son terminal.

### Backend
```bash
cd backend
# copier .env.example en .env et renseigner MONGODB_URI + JWT_SECRET
npm install
npm start
```

### Service de reconnaissance faciale
```bash
cd pointagepython
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# copier .env.example en .env et renseigner MONGODB_URI (même base que le backend)
python app.py
```

### Frontend
```bash
cd frontend
# copier .env.example en .env (REACT_APP_API_URL + REACT_APP_PYTHON_URL)
npm install
npm start
```

## État actuel : v1.4
Le cœur du projet est fonctionnel de bout en bout : gestion des employés (CRUD + import
en masse), authentification JWT, pointage par reconnaissance faciale testable en direct
via la webcam (y compris par un visiteur sans compte, via `/demo-pointage`), tableau de
bord admin et suivi d'assiduité mensuel.

### Points connus
- Pas encore de distinction de droits par rôle (admin vs employé).
- L'assiduité estime les jours ouvrés (jours de semaine du mois) sans tenir compte des
  jours fériés ni des congés/absences : un employé en congé apparaît comme absent. À
  corriger avec les modules Congés, Absences et Jours fériés.
- Les photos uploadées en ligne sont stockées sur le disque éphémère de l'hébergeur : elles
  disparaissent à chaque redéploiement ou redémarrage. Un placeholder s'affiche à la place.
  Un stockage externe (Cloudinary) est prévu. La reconnaissance faciale n'est pas
  affectée, les empreintes étant stockées en base.
- Le thème (`/api/apparence/settings`) n'est pas encore implémenté : 404 silencieuse en
  console, sans impact (couleur par défaut appliquée).
- Les comptes créés via `/demo-pointage` (`est_test: true`) s'accumulent en base sans
  nettoyage automatique.