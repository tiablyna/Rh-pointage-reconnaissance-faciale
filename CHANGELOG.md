# Changelog

Toutes les versions notables de ce projet sont documentées ici.


## [v1.0] — Socle RH de base
- API Express + MongoDB : employés, postes, structures, horaires.
- CRUD complet des employés (création, modification, suppression, recherche, filtrage par département).
- Import en masse d'employés (fichier Excel + archive ZIP de photos).
- Frontend React : liste des employés, fiche détail, création, modification, import en masse.
-  Pas encore d'authentification (ajoutée en v1.1).

## À venir
- **v1.1** — Authentification JWT (login, rôles admin/employé).
- **v1.2** — Service Python de reconnaissance faciale (MTCNN + ArcFace, comparaison par distance cosinus).
- **v1.3** — Pointage en direct via webcam depuis le frontend, avec ajout d'un employé de test pour la démo.
- **v1.4 → v2.0** — Modules RH complémentaires : congés, absences, heures supplémentaires, jours fériés, horaires par équipes, notifications, tableau de bord d'assiduité.