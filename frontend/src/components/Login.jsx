// src/components/Login.jsx
import "./login.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { appearanceService, serviceAuth } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [chargement, setChargement] = useState(false);
  const [appearance, setAppearance] = useState({
    background: null,
    logo: null,
  });
  const navigate = useNavigate();

  // Le thème/logo personnalisé n'est pas encore implémenté (module "apparence"
  // prévu dans une version ultérieure) — on retombe silencieusement sur le
  // dégradé par défaut défini dans login.css si l'appel échoue.
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const response = await appearanceService.getSettings();
        setAppearance({
          background: response.data.loginBackground
            ? `${process.env.REACT_APP_API_URL}${response.data.loginBackground}`
            : null,
          logo: response.data.loginLogo
            ? `${process.env.REACT_APP_API_URL}${response.data.loginLogo}`
            : null,
        });
      } catch (error) {
        // Pas grave : le dégradé par défaut (login.css) prend le relais.
      }
    };
    loadAppearance();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setChargement(true);
    try {
      const response = await serviceAuth.login(email, password);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/employes");
    } catch (err) {
      console.error("Erreur login:", err);
      const status = err.response?.status;
      if (status === 401) {
        setError("Email ou mot de passe incorrect. Veuillez réessayer.");
      } else if (status === 500) {
        setError("Erreur serveur. Veuillez réessayer plus tard.");
      } else if (!err.response) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      } else {
        setError(err.response?.data?.message || "Erreur de connexion.");
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <div
      className="login-container"
      style={appearance.background ? {
        backgroundImage: `url(${appearance.background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      } : undefined}
    >
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        {appearance.logo && (
          <img src={appearance.logo} alt="Logo" className="logo" />
        )}

        <h2>Connexion</h2>
        <p className="subtitle">Veuillez entrer vos coordonnées</p>

        {error && (
          <p role="alert" style={{
            color: "#c92a2a",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #ffc9c9",
            borderLeft: "3px solid #c92a2a",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            textAlign: "left",
            marginBottom: "10px",
          }}>
            ⚠️ {error}
          </p>
        )}

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="prenom.nom@exemple.com"
          value={email}
          required
          autoComplete="email"
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
        />

        <label htmlFor="login-password">Mot de passe</label>
        <div className="password-field">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            required
            autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            role="button"
            style={{ cursor: "pointer" }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" disabled={chargement}>
          {chargement ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default Login;