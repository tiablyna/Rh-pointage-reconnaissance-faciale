# pointagepython/app.py
#
# v1.2 — Service de reconnaissance faciale, exposé en API web (Flask) plutôt
# qu'en script lié à des caméras physiques (contrairement au script original
# 08_pointage_2cameras.py, pensé pour tourner en continu sur deux flux vidéo
# avec affichage OpenCV local). Ici, le frontend envoie une photo capturée
# via la webcam du navigateur ; le service répond avec le résultat.
#
# Deux usages :
#   POST /encoder      → enregistrer le visage d'un employé (génère son embedding)
#   POST /reconnaitre   → reconnaître un visage au moment du pointage
#
# Le modèle ArcFace + le détecteur MTCNN sont chargés une seule fois au
# démarrage (coûteux — plusieurs secondes), d'où l'endpoint /health que le
# frontend peut interroger pour savoir si le service est prêt.

import os
import warnings
warnings.filterwarnings("ignore")

# Force DeepFace à utiliser le backend ONNX (onnxruntime) plutôt que
# TensorFlow : même modèle ArcFace, mais ~600 Mo de RAM en moins au
# chargement — indispensable pour tenir dans les 512 Mo du free tier Render.
# Voir pointagepython/README.md pour le détail de ce choix.
os.environ["DEEPFACE_BACKEND_ENGINE"] = "onnx"

from datetime import datetime, timezone

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.environ["MONGODB_URI"]
SEUIL_DISTANCE = float(os.environ.get("SEUIL_DISTANCE", 0.50))
DELAI_POINTAGE = int(os.environ.get("DELAI_POINTAGE", 300))  # secondes anti-doublon

# Détecteur de visage : "opencv" par défaut (classique, sans réseau de
# neurones dédié, très léger en mémoire — essentiel pour tenir sur un
# hébergement gratuit à 512 Mo de RAM). MTCNN (plus précis, mais qui exige
# TensorFlow et ses ~600 Mo rien que pour la détection) reste utilisable en
# le réglant via la variable d'environnement FACE_DETECTOR=mtcnn, à
# condition d'installer `tensorflow` et `mtcnn` en plus localement —
# non recommandé une fois déployé sur le free tier.
DETECTOR = os.environ.get("FACE_DETECTOR", "opencv")
MODEL_NAME = "ArcFace"

app = Flask(__name__)
CORS(app)

client = MongoClient(MONGODB_URI)
db = client.get_default_database()
col_employes = db["employes"]
col_pointages = db["pointages"]

# Chargé au premier appel pour ne pas bloquer le démarrage du serveur Flask
# lui-même (séparé du chargement du modèle DeepFace, plus lent).
_modele_pret = False


def charger_modele():
    """Force DeepFace à charger le modèle ArcFace + le détecteur MTCNN en
    mémoire dès le démarrage, plutôt qu'au premier vrai appel (évite que la
    toute première requête d'un utilisateur soit anormalement lente)."""
    global _modele_pret
    from deepface import DeepFace
    import numpy as np
    image_test = np.zeros((160, 160, 3), dtype=np.uint8)
    try:
        DeepFace.represent(
            img_path=image_test,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=False,
        )
    except Exception:
        pass
    _modele_pret = True
    print("✅ Modèle ArcFace + détecteur MTCNN chargés.")


def distance_cosinus(v1, v2):
    v1, v2 = np.array(v1), np.array(v2)
    return 1 - np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


def extraire_embedding(fichier_image):
    """Lance DeepFace sur le fichier reçu. Lève une exception explicite si
    aucun visage n'est détecté (enforce_detection=True ici, contrairement au
    script original, car on veut un message d'erreur clair pour la démo)."""
    from deepface import DeepFace
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        fichier_image.save(tmp.name)
        chemin_tmp = tmp.name

    try:
        resultats = DeepFace.represent(
            img_path=chemin_tmp,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True,
        )
    finally:
        os.unlink(chemin_tmp)

    if not resultats:
        raise ValueError("Aucun visage détecté dans l'image.")

    # On garde le plus grand visage détecté (cas d'une photo avec plusieurs personnes)
    plus_grand = max(resultats, key=lambda r: r["facial_area"]["w"] * r["facial_area"]["h"])
    return plus_grand["embedding"]


def charger_embeddings_connus():
    """Reconstruit la liste des embeddings connus à chaque appel : simple et
    suffisant pour une démo (peu d'employés). Pour un vrai volume de
    production, on mettrait ça en cache avec invalidation."""
    embeddings, noms, ids = [], [], []
    for emp in col_employes.find({"encodages_faciaux": {"$exists": True, "$ne": []}}):
        nom = f"{emp['prenom']} {emp['nom']}"
        for enc in emp.get("encodages_faciaux", []):
            vecteur = enc.get("encodage")
            if isinstance(vecteur, list) and len(vecteur) == 512:
                embeddings.append(np.array(vecteur))
                noms.append(nom)
                ids.append(emp["_id"])
    return embeddings, noms, ids


def deja_pointe_recemment(employe_id, type_camera):
    dernier = col_pointages.find_one(
        {"employe": employe_id, "camera": type_camera},
        sort=[("date_heure", DESCENDING)],
    )
    if dernier:
        secondes = (datetime.now(timezone.utc) - dernier["date_heure"].replace(tzinfo=timezone.utc)).total_seconds()
        if secondes < DELAI_POINTAGE:
            return True, int(secondes)
    return False, 0


# ─── ROUTES ───────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Le frontend interroge cet endpoint pour afficher "Chargement du
    modèle..." tant que _modele_pret est False (utile au réveil d'un
    service hébergé gratuitement, qui se met en veille après inactivité)."""
    return jsonify({"status": "ok", "modele_charge": _modele_pret})


@app.route("/encoder", methods=["POST"])
def encoder():
    """Enregistre le visage d'un employé : reçoit une photo, renvoie
    l'embedding ArcFace (512 valeurs) à stocker dans encodages_faciaux."""
    if "photo" not in request.files:
        return jsonify({"message": "Aucune photo reçue (champ 'photo' attendu)."}), 400

    try:
        embedding = extraire_embedding(request.files["photo"])
        return jsonify({"embedding": embedding, "dimensions": len(embedding)})
    except ValueError as e:
        return jsonify({"message": str(e)}), 422
    except Exception as e:
        return jsonify({"message": f"Erreur lors de l'encodage : {e}"}), 500


@app.route("/reconnaitre", methods=["POST"])
def reconnaitre():
    """Pointage : reçoit une photo capturée en direct, la compare aux
    employés connus, et enregistre le pointage si reconnu (et pas déjà
    pointé il y a moins de DELAI_POINTAGE secondes)."""
    if "photo" not in request.files:
        return jsonify({"message": "Aucune photo reçue (champ 'photo' attendu)."}), 400

    type_camera = request.form.get("type", "entree")
    if type_camera not in ("entree", "sortie"):
        return jsonify({"message": "Le champ 'type' doit être 'entree' ou 'sortie'."}), 400

    try:
        embedding_capture = extraire_embedding(request.files["photo"])
    except ValueError as e:
        return jsonify({"reconnu": False, "message": str(e)}), 422
    except Exception as e:
        return jsonify({"message": f"Erreur lors de l'analyse : {e}"}), 500

    embeddings, noms, ids = charger_embeddings_connus()
    if not embeddings:
        return jsonify({
            "reconnu": False,
            "message": "Aucun employé n'a encore de visage enregistré en base."
        }), 200

    distances = [distance_cosinus(embedding_capture, e) for e in embeddings]
    idx = int(np.argmin(distances))
    dist_min = distances[idx]

    if dist_min >= SEUIL_DISTANCE:
        return jsonify({
            "reconnu": False,
            "distance": round(float(dist_min), 3),
            "message": "Visage non reconnu."
        })

    nom, employe_id = noms[idx], ids[idx]
    doublon, secondes = deja_pointe_recemment(employe_id, type_camera)
    if doublon:
        return jsonify({
            "reconnu": True,
            "nom": nom,
            "employe_id": str(employe_id),
            "distance": round(float(dist_min), 3),
            "pointe": False,
            "message": f"{nom} a déjà pointé il y a {secondes}s ({type_camera})."
        })

    maintenant = datetime.now(timezone.utc)
    col_pointages.insert_one({
        "employe": employe_id,
        "type": type_camera,
        "date_heure": maintenant,
        "camera": type_camera,
        "confiance": float(dist_min),
    })

    return jsonify({
        "reconnu": True,
        "nom": nom,
        "employe_id": str(employe_id),
        "distance": round(float(dist_min), 3),
        "pointe": True,
        "heure": maintenant.strftime("%H:%M:%S"),
        "message": f"Pointage ({type_camera}) enregistré pour {nom}."
    })


if __name__ == "__main__":
    charger_modele()
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)