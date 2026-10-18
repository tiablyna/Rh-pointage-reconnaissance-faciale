// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// ─── Connexion MongoDB ───────────────────────────────────
connectDB();

const app = express();

// ─── Middleware globaux ──────────────────────────────────
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:3000").split(","),
    credentials: false,
  }),
);
app.use(express.json());

// ─── Dossier uploads (photos employés) ───────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// ─── Routes (v1.0 : socle RH de base) ────────────────────
app.use("/api/employes", require("./routes/Employeroutes"));
app.use("/api/postes", require("./routes/Posteroutes"));
app.use("/api/departements", require("./routes/structureRoutes"));
app.use("/api/structures", require("./routes/structureRoutes"));
app.use("/api/horaires", require("./routes/Horaireroutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// ─── Route de test ───────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ message: "✅ API RH opérationnelle (v1.0)" }),
);

// ─── Démarrage ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
