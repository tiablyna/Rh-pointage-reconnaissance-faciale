# Changelog

Toutes les versions notables de ce projet sont documentées ici.

## [v1.3] — Pointage en direct + démo publique
- Intégration webcam côté frontend : capture de photos via `getUserMedia`, sans dépendance externe.
- Page publique `/demo-pointage` (sans authentification) : un visiteur peut s'inscrire avec sa webcam (3 photos → empreintes ArcFace) puis tester le pointage par reconnaissance faciale en direct.
- Nouveau flux "employé de test" (`est_test: true`) côté backend, isolé des vrais employés : poste/structure "Démo" créés automatiquement, endpoint public dédié protégé par ce flag.
- Liste des derniers pointages (`GET /api/pointages`) — version simple ; le calcul de retard/assiduité (lié aux modules Horaire par équipes, Congés, Absences, Jours fériés) est réservé à la v1.4+.
- Le frontend attend que le service Python ait fini de charger son modèle (`GET /health`) avant d'activer la webcam, avec un message explicite plutôt qu'un échec silencieux.

## [v1.2] — Service de reconnaissance faciale
- Nouveau service Python (`pointagepython/`), API Flask autonome.
- Pipeline MTCNN (détection de visage) + ArcFace (empreinte biométrique à 512 dimensions) + comparaison par distance cosinus (seuil 0.50).
- `POST /encoder` — génère l'empreinte d'un visage à partir d'une photo.
- `POST /reconnaitre` — reconnaît un visage et enregistre le pointage (entrée/sortie) directement en base, avec anti-doublon (5 min).
- `GET /health` — permet au frontend de savoir si le modèle est chargé (utile au réveil d'un service hébergé gratuitement).
- Adapté du script original (caméras physiques + fenêtre OpenCV) en API HTTP sans état, pensée pour recevoir une photo capturée depuis le navigateur.

## [v1.1] — Authentification JWT
- `POST /api/auth/login` : connexion par email/mot de passe, retourne un token JWT (24h).
- `authMiddleware` remplacé : vrai contrôle JWT au lieu du passthrough temporaire de la v1.0 — toutes les routes employés/postes/structures/horaires sont désormais protégées.
- Frontend : page de connexion (`Login.jsx`), routes protégées côté client (`PrivateRoute`), déconnexion.
- Pas encore de distinction de droits par rôle (admin vs employé) — tout compte authentifié a accès à tout.

## [v1.0] — Socle RH de base
- API Express + MongoDB : employés, postes, structures, horaires.
- CRUD complet des employés (création, modification, suppression, recherche, filtrage par département).
- Import en masse d'employés (fichier Excel + archive ZIP de photos).
- Frontend React : liste des employés, fiche détail, création, modification, import en masse.

## À venir
- **v1.4 → v2.0** — Modules RH complémentaires : congés, absences, heures supplémentaires, jours fériés, horaires par équipes, notifications, tableau de bord d'assiduité.