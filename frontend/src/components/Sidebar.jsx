// components/Sidebar.jsx
import "./Sidebar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaSignOutAlt, FaCog, FaBars, FaTimes, FaUsers } from "react-icons/fa";

function construireUrl(chemin) {
  if (!chemin) return null;
  if (chemin.startsWith("http")) return chemin;
  const propre = chemin.replace(/^\/+/, "");
  if (!propre.startsWith("uploads/")) return `${process.env.REACT_APP_API_URL}/uploads/${propre}`;
  return `${process.env.REACT_APP_API_URL}/${propre}`;
}

export default function Sidebar({ active }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [photoErreur, setPhotoErreur] = useState(false);
  const [ouvert, setOuvert] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const photoUrl = user?.photo && !photoErreur ? construireUrl(user.photo) : null;
  const initiales = user ? `${user.nom?.[0] || ""}${user.prenom?.[0] || ""}` : "AD";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const naviguer = (path) => {
    navigate(path);
    setOuvert(false);
  };

  // v1.0 — seul le module Employés est disponible.
  // Dashboard, Demandes, Pointage, Organigramme et Calendrier reviendront
  // au fil des versions suivantes (voir CHANGELOG.md).
  const menuItems = [
    {
      label: "Employés", icon: <FaUsers />, path: "/employes",
      actif: location.pathname === "/employes" || location.pathname.startsWith("/employes/"),
    },
  ];

  return (
    <>
      <button className="sidebar-hamburger" onClick={() => setOuvert(o => !o)}>
        {ouvert ? <FaTimes /> : <FaBars />}
      </button>

      {ouvert && <div className="sidebar-overlay" onClick={() => setOuvert(false)} />}

      <div className={`sidebar ${ouvert ? "sidebar-mobile-ouvert" : ""}`}>

        {/* PROFIL */}
        <div className="sidebar-profile">
          {photoUrl ? (
            <img src={photoUrl} alt="profil" onError={() => setPhotoErreur(true)} />
          ) : (
            <div className="sidebar-initiales">{initiales}</div>
          )}
          <h4>{user ? `${user.nom} ${user.prenom}` : "Administrateur"}</h4>
          <span>@{user?.email?.split("@")[0] || "admin"}</span>
        </div>

        {/* MENU */}
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = item.actif !== undefined
              ? item.actif
              : location.pathname === item.path;
            return (
              <li key={item.path} className={isActive ? "active" : ""} onClick={() => naviguer(item.path)}>
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
                {item.badge && (
                  <span className="menu-badge">{item.badge}</span>
                )}
              </li>
            );
          })}
        </ul>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <div className={`sidebar-footer-item ${location.pathname === "/settings" ? "active" : ""}`}
            onClick={() => naviguer("/settings")}>
            <FaCog /><span>Paramètres</span>
          </div>
          <div className="sidebar-footer-item logout" onClick={handleLogout}>
            <FaSignOutAlt /><span>Déconnexion</span>
          </div>
        </div>
      </div>
    </>
  );
}