// components/ToastNotif.jsx
import { useEffect } from "react";
import { FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import "./ToastNotif.css";

export default function ToastNotif({ visible, message, type = "succes", couleur, onClose }) {
    useEffect(() => {
        if (visible) {
            const t = setTimeout(onClose, 30000);
            return () => clearTimeout(t);
        }
    }, [visible]);

    if (!visible) return null;

    const icon = type === "erreur"
        ? <FaTimes color="#e03131" size={16} />
        : type === "alerte"
        ? <FaExclamationTriangle color="#ff5c00" size={16} />
        : <FaCheck color={couleur || "#0ca678"} size={16} />;

    const borderColor = type === "erreur" ? "#e03131" : type === "alerte" ? "#ff5c00" : (couleur || "#0ca678");

    return (
        <div className="toast-notif" style={{ borderLeft: `4px solid ${borderColor}` }}>
            <div className="toast-icone"
                style={{ background: type === "erreur" ? "#fff5f5" : type === "alerte" ? "#fff3ee" : "#e6fcf5" }}>
                {icon}
            </div>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}