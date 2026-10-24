// pages/PointageDemo.jsx
//
// v1.3 — Page PUBLIQUE (pas de PrivateRoute) : permet à un visiteur du
// portfolio de s'inscrire avec sa webcam (3 photos → embeddings ArcFace)
// puis de tester le pointage par reconnaissance faciale en direct.
//
// Orchestration : le frontend appelle directement le backend Node (pour
// créer/persister l'employé de test) ET directement le service Python
// (pour le calcul ML), plutôt que de faire transiter le calcul ML par le
// backend Node — ça illustre une vraie architecture à services séparés.
//
// CORRECTIF : l'élément <video> reste TOUJOURS monté (il est seulement
// masqué visuellement selon l'étape). Avant, il était démonté pendant
// l'étape "encodage" puis remonté sans flux → videoWidth = 0 → toBlob()
// renvoyait null → FormData.append(null) levait l'erreur.
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { FaCamera, FaCheck, FaArrowRight, FaRedo } from "react-icons/fa";
import { serviceDemoPointage } from "../services/api";

const PYTHON_URL = process.env.REACT_APP_PYTHON_URL || "http://localhost:5001";
const NB_PHOTOS_INSCRIPTION = 3;
const ETAPES_AVEC_CAMERA = ["inscription", "pret", "pointage_en_cours"];

// Transforme une image <canvas> en Blob JPEG (callback → Promise)
function canvasVersBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}

export default function PointageDemo() {
  const [etape, setEtape] = useState("chargement_modele");
  // chargement_modele → inscription → encodage → pret → pointage_en_cours → resultat

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [photosCapturees, setPhotosCapturees] = useState([]); // Blobs
  const [employeId, setEmployeId] = useState(null);
  const [erreur, setErreur] = useState("");
  const [resultatPointage, setResultatPointage] = useState(null);
  const [progression, setProgression] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ─── Ref callback : rattache le flux dès que <video> est monté ─────────
  const attacherVideo = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  // ─── Démarrer / arrêter la webcam ──────────────────────────────────────
  const demarrerCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      setErreur("Impossible d'accéder à la webcam. Vérifie les autorisations de ton navigateur.");
    }
  }, []);

  const arreterCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // La caméra démarre au montage et s'arrête au démontage (indépendamment
  // du chargement du modèle, et compatible avec React StrictMode).
  useEffect(() => {
    demarrerCamera();
    return () => arreterCamera();
  }, [demarrerCamera, arreterCamera]);

  // Sécurité : à chaque changement d'étape où la caméra est visible,
  // on s'assure que le flux est attaché et en lecture.
  useEffect(() => {
    if (ETAPES_AVEC_CAMERA.includes(etape) && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [etape]);

  // ─── Attendre que le modèle Python soit chargé ────────────────────────
  useEffect(() => {
    let annule = false;
    let timer = null;
    const verifier = async () => {
      try {
        const { data } = await axios.get(`${PYTHON_URL}/health`);
        if (annule) return;
        if (data.modele_charge) {
          setEtape("inscription");
        } else {
          timer = setTimeout(verifier, 2000);
        }
      } catch (e) {
        // service peut-être encore en train de démarrer
        if (!annule) timer = setTimeout(verifier, 3000);
      }
    };
    verifier();
    return () => {
      annule = true;
      clearTimeout(timer);
    };
  }, []);

  // ─── Capturer une photo depuis le flux vidéo ──────────────────────────
  // Renvoie un Blob JPEG, ou null si aucune image n'est disponible.
  const capturerPhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Rattacher le flux si besoin
    if (!video.srcObject && streamRef.current) video.srcObject = streamRef.current;
    if (video.paused) {
      try { await video.play(); } catch (e) { /* ignoré */ }
    }

    // Attendre qu'une image soit réellement disponible (max 2 s)
    const debut = Date.now();
    while ((video.readyState < 2 || !video.videoWidth) && Date.now() - debut < 2000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!video.videoWidth) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvasVersBlob(canvas);
  };

  const ajouterPhoto = async () => {
    setErreur("");
    const blob = await capturerPhoto();
    if (!blob) {
      setErreur("Impossible de capturer l'image de la webcam. Réessaie.");
      return;
    }
    setPhotosCapturees((prev) => [...prev, blob]);
  };

  const recommencerPhotos = () => setPhotosCapturees([]);

  // ─── Inscription : envoyer les 3 photos au backend, puis encoder ──────
  const sInscrire = async () => {
    setErreur("");
    if (photosCapturees.length < NB_PHOTOS_INSCRIPTION) {
      setErreur(`Prends ${NB_PHOTOS_INSCRIPTION} photos avant de continuer.`);
      return;
    }
    setEtape("encodage");

    try {
      // 1) Créer l'employé de test côté backend (stocke les photos)
      setProgression("Création du profil de démo...");
      const formData = new FormData();
      formData.append("prenom", prenom || "Visiteur");
      formData.append("nom", nom || "Démo");
      photosCapturees.forEach((blob, i) => formData.append("photos", blob, `photo${i}.jpg`));

      const { data: creation } = await serviceDemoPointage.creerEmployeTest(formData);
      setEmployeId(creation.employe_id);

      // 2) Demander au service Python l'embedding de chaque photo
      setProgression("Analyse des visages (reconnaissance faciale)...");
      const encodages = [];
      for (let i = 0; i < photosCapturees.length; i++) {
        const fd = new FormData();
        fd.append("photo", photosCapturees[i], `photo${i}.jpg`);
        const { data } = await axios.post(`${PYTHON_URL}/encoder`, fd);
        encodages.push({ photo_source: creation.photos[i], encodage: data.embedding });
      }

      // 3) Sauvegarder les empreintes sur le profil de démo
      setProgression("Enregistrement des empreintes...");
      await serviceDemoPointage.enregistrerEmbeddings(creation.employe_id, encodages);

      setEtape("pret");
    } catch (e) {
      console.error(e);
      setErreur(e.response?.data?.message || "Une erreur est survenue pendant l'inscription. Réessaie.");
      setEtape("inscription");
    }
  };

  // ─── Tester le pointage ────────────────────────────────────────────────
  const testerPointage = async () => {
    setErreur("");

    // On capture AVANT de changer d'étape, avec une garde explicite.
    const blob = await capturerPhoto();
    if (!blob) {
      setErreur("Impossible de capturer l'image de la webcam. Réessaie.");
      return;
    }

    setEtape("pointage_en_cours");
    try {
      const fd = new FormData();
      fd.append("photo", blob, "pointage.jpg");
      fd.append("type", "entree");
      const { data } = await axios.post(`${PYTHON_URL}/reconnaitre`, fd);
      setResultatPointage(data);
      setEtape("resultat");
    } catch (e) {
      console.error(e);
      setErreur(e.response?.data?.message || "Erreur lors de la reconnaissance.");
      setEtape("pret");
    }
  };

  const rejouer = () => {
    setResultatPointage(null);
    setEtape("pret");
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────
  const cameraVisible = ETAPES_AVEC_CAMERA.includes(etape);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 24, fontFamily: "Segoe UI, sans-serif" }}>
      <h2 style={{ marginBottom: 4 }}>🎥 Démo — Pointage par reconnaissance faciale</h2>
      <p style={{ color: "#888", marginBottom: 24 }}>
        Inscris-toi avec ta webcam (3 photos), puis teste le pointage en direct —
        aucune donnée réelle, tout est isolé dans un compte de démonstration.
      </p>

      {etape === "chargement_modele" && (
        <div style={{ padding: 20, background: "#f1f3f5", borderRadius: 10, marginBottom: 16 }}>
          ⏳ Chargement du modèle de reconnaissance faciale... (jusqu'à une minute si le
          service se réveille après une période d'inactivité — c'est normal, pas un bug)
        </div>
      )}

      {erreur && (
        <div style={{ color: "#c92a2a", background: "#fff5f5", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Vidéo et canvas TOUJOURS montés : on ne fait que les masquer.
          (position hors écran plutôt que display:none, pour que le
          navigateur continue à décoder les images de la vidéo) */}
      <div
        style={
          cameraVisible
            ? { marginBottom: 16 }
            : { position: "absolute", left: -9999, top: 0, width: 1, height: 1, overflow: "hidden" }
        }
      >
        <video
          ref={attacherVideo}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", borderRadius: 10, background: "#000", transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {etape === "inscription" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input placeholder="Prénom (optionnel)" value={prenom} onChange={(e) => setPrenom(e.target.value)}
                   style={{ flex: 1, padding: 8 }} />
            <input placeholder="Nom (optionnel)" value={nom} onChange={(e) => setNom(e.target.value)}
                   style={{ flex: 1, padding: 8 }} />
          </div>

          <p style={{ fontSize: 14, color: "#555" }}>
            Photo {Math.min(photosCapturees.length + 1, NB_PHOTOS_INSCRIPTION)} / {NB_PHOTOS_INSCRIPTION}
            {photosCapturees.length >= NB_PHOTOS_INSCRIPTION && " — prêt !"}
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            {photosCapturees.length < NB_PHOTOS_INSCRIPTION ? (
              <button onClick={ajouterPhoto} style={boutonPrimaire}>
                <FaCamera /> Capturer la photo {photosCapturees.length + 1}
              </button>
            ) : (
              <>
                <button onClick={sInscrire} style={boutonPrimaire}>
                  <FaArrowRight /> S'inscrire et continuer
                </button>
                <button onClick={recommencerPhotos} style={boutonSecondaire}>
                  <FaRedo /> Reprendre les photos
                </button>
              </>
            )}
          </div>
        </>
      )}

      {etape === "encodage" && (
        <div style={{ padding: 20, background: "#f1f3f5", borderRadius: 10 }}>
          ⏳ {progression}
        </div>
      )}

      {etape === "pret" && (
        <button onClick={testerPointage} style={boutonPrimaire}>
          <FaCamera /> Pointer maintenant
        </button>
      )}

      {etape === "pointage_en_cours" && (
        <div style={{ padding: 20, background: "#f1f3f5", borderRadius: 10 }}>
          🔍 Analyse en cours...
        </div>
      )}

      {etape === "resultat" && resultatPointage && (
        <div style={{
          padding: 20, borderRadius: 10,
          background: resultatPointage.reconnu ? "#ebfbee" : "#fff5f5",
          border: `1px solid ${resultatPointage.reconnu ? "#2f9e44" : "#e03131"}`,
        }}>
          {resultatPointage.reconnu ? (
            <>
              <p style={{ fontWeight: 700, color: "#2f9e44", display: "flex", alignItems: "center", gap: 8 }}>
                <FaCheck /> Reconnu : {resultatPointage.nom}
              </p>
              <p style={{ fontSize: 14, color: "#555" }}>{resultatPointage.message}</p>
              {typeof resultatPointage.distance === "number" && (
                <p style={{ fontSize: 13, color: "#888" }}>Distance : {resultatPointage.distance}</p>
              )}
            </>
          ) : (
            <p style={{ color: "#e03131" }}>❌ {resultatPointage.message || "Visage non reconnu."}</p>
          )}
          <button onClick={rejouer} style={{ ...boutonSecondaire, marginTop: 12 }}>
            <FaRedo /> Retester
          </button>
        </div>
      )}
    </div>
  );
}

const boutonPrimaire = {
  display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
  borderRadius: 8, border: "none", background: "#4263eb", color: "#fff",
  fontWeight: 600, cursor: "pointer",
};
const boutonSecondaire = {
  display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
  borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer",
};