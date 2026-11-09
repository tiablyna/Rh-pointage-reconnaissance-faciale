// components/AvatarEmploye.jsx
//
// Affiche la photo d'un employé, ou ses initiales (pastille orange dégradée,
// comme dans le projet d'origine) quand il n'y a pas de photo ou qu'elle ne
// charge pas — par exemple si le fichier a disparu du disque éphémère de
// l'hébergeur. Les styles .pt-avatar / .pt-avatar-initiales viennent de
// components/Pointage.css, à importer dans la page qui utilise ce composant.
import { useState } from "react";

// Même logique que la fonction du même nom des pages d'origine. Accepte aussi
// une URL absolue (cas d'un stockage externe type Cloudinary).
export function construireUrl(chemin) {
  if (Array.isArray(chemin)) chemin = chemin[0];
  if (!chemin || typeof chemin !== "string") return null;
  if (chemin.startsWith("http")) return chemin;
  const propre = chemin.replace(/^\/+/, "");
  if (!propre.startsWith("uploads/")) {
    return `${process.env.REACT_APP_API_URL}/uploads/${propre}`;
  }
  return `${process.env.REACT_APP_API_URL}/${propre}`;
}

export default function AvatarEmploye({ photo, nom, prenom }) {
  const url = construireUrl(photo);
  // On mémorise l'URL en erreur (et non un booléen) : si la photo change, on réessaie.
  const [urlEnErreur, setUrlEnErreur] = useState(null);

  if (!url || urlEnErreur === url) {
    return (
      <div className="pt-avatar-initiales">
        {nom?.[0]}
        {prenom?.[0]}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="pt-avatar"
      onError={() => setUrlEnErreur(url)}
    />
  );
}