# Service de reconnaissance faciale (pointagepython)

API Flask qui encapsule le pipeline de reconnaissance faciale : détection de
visage (MTCNN) + extraction d'empreinte biométrique (ArcFace, 512 dimensions)
+ comparaison par distance cosinus.

Reprend la logique du script original, pensé pour
tourner en continu sur deux caméras physiques avec affichage OpenCV local,
adaptée ici en API HTTP sans état : le frontend envoie une photo capturée via
la webcam du navigateur, le service répond avec le résultat. Partage la même
base MongoDB que le backend Node (`gestion_rh`).

## Démarrage en local

```bash
cd pointagepython
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py
```

Le premier démarrage prend plusieurs secondes (chargement du modèle ArcFace).

## Endpoints

### `GET /health`
Vérifie si le service est démarré et si le modèle est chargé. À interroger
côté frontend pour afficher "Chargement du modèle..." plutôt que de laisser
croire à un bug pendant les quelques secondes de démarrage.
```json
{ "status": "ok", "modele_charge": true }
```

### `POST /encoder`
Génère l'empreinte biométrique d'un visage, à stocker dans
`encodages_faciaux` côté employé.
- **Body** : `multipart/form-data`, champ `photo` (fichier image)
- **Réponse** :
```json
{ "embedding": [0.0123, -0.0456, ...], "dimensions": 512 }
```

### `POST /reconnaitre`
Compare une photo capturée en direct aux employés connus. Enregistre
directement le pointage dans MongoDB (`pointages`) si reconnu et pas déjà
pointé récemment (anti-doublon, `DELAI_POINTAGE` secondes).
- **Body** : `multipart/form-data`, champs `photo` (fichier) et `type`
  (`entree` ou `sortie`)
- **Réponse (reconnu)** :
```json
{
  "reconnu": true,
  "nom": "Lyna Tiab",
  "employe_id": "671f...",
  "distance": 0.241,
  "pointe": true,
  "heure": "09:14:02",
  "message": "Pointage (entree) enregistré pour Lyna Tiab."
}
```
- **Réponse (non reconnu)** : `{ "reconnu": false, "distance": 0.68, "message": "Visage non reconnu." }`

## Différences avec le script original
- Pas de connexion caméra physique ni de fenêtre OpenCV — tout passe par une
  photo envoyée en HTTP.
- Pas d'upload Cloudinary de la capture (simplification pour la démo — le
  pointage est enregistré sans photo jointe).
- `enforce_detection=True` à l'encodage (plutôt que `False`) : une erreur
  claire est renvoyée si aucun visage n'est détecté, utile pour guider
  l'utilisateur pendant la démo plutôt que d'échouer silencieusement.