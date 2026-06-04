import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import masterRoutes from "./routes/master.routes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "kliente.cl";

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const productionAllowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [...defaultAllowedOrigins, ...productionAllowedOrigins];

function isAllowedRootDomain(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === ROOT_DOMAIN ||
      hostname === `www.${ROOT_DOMAIN}` ||
      hostname.endsWith(`.${ROOT_DOMAIN}`)
    );
  } catch (error) {
    return false;
  }
}

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isAllowedRootDomain(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor KLIENTE funcionando correctamente",
    app: "KLIENTE",
    createdBy: "Mitnick Connect",
    copyright: "© by Mitnick-Connect",
    rootDomain: ROOT_DOMAIN,
    year: 2026,
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/master", masterRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    createdBy: "Mitnick Connect",
    copyright: "© by Mitnick-Connect",
  });
});

app.use((error, req, res, next) => {
  console.error("Error interno:", error);

  res.status(error.status || 500).json({
    ok: false,
    message: error.message || "Error interno del servidor",
    createdBy: "Mitnick Connect",
    copyright: "© by Mitnick-Connect",
  });
});

export default app;