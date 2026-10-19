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

## État actuel : v1.2
Le socle RH (CRUD employés + import en masse), l'authentification JWT, et le service de
reconnaissance faciale (MTCNN + ArcFace) sont en place et fonctionnels indépendamment.
La v1.3 reliera le tout : capture webcam côté frontend → reconnaissance → pointage
affiché en direct, avec un mode "employé de test" pour permettre à un recruteur
d'essayer sans vraie donnée d'employé.

### Points connus
- Pas encore de distinction de droits par rôle (admin vs employé) — tout compte
  authentifié a accès à tout. Pourra être ajouté si besoin avec les modules RH (v1.4+).
- Le thème (`/api/apparence/settings`) n'est pas encore implémenté : erreur 404
  silencieuse en console, sans impact (couleur par défaut appliquée).
- Le service `pointagepython` n'est pas encore appelé par le frontend (prévu en v1.3) ;
  pour l'instant testable uniquement en direct via `curl`/Postman.