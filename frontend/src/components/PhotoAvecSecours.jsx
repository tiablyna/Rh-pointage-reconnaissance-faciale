// src/components/PhotoAvecSecours.jsx
//
// Affiche une <img>, mais si l'image ne charge pas (fichier supprimé du
// disque éphémère de l'hébergeur, URL cassée...), affiche à la place un
// placeholder neutre de mêmes dimensions — au lieu de l'icône "image
// cassée" du navigateur.
//
// On mémorise l'URL en erreur plutôt qu'un simple booléen : si `src`
// change (nouvelle photo uploadée), le composant retente automatiquement.
import { useState } from "react";
import { FaUser } from "react-icons/fa";

export default function PhotoAvecSecours({ src, style, ...props }) {
  const [srcEnErreur, setSrcEnErreur] = useState(null);

  if (!src || srcEnErreur === src) {
    return (
      <div
        title="Photo indisponible"
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e9ecef",
          color: "#adb5bd",
          flexShrink: 0,
        }}
      >
        <FaUser />
      </div>
    );
  }

  return (
    <img
      alt=""
      {...props}
      src={src}
      style={style}
      onError={() => setSrcEnErreur(src)}
    />
  );
}