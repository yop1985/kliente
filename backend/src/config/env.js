import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["PORT", "DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Variable de entorno faltante: ${key}`);
  }
}

export const env = {
  port: process.env.PORT || 4000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "kliente_db",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "kliente_super_secret_change_this",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  },

  app: {
    name: process.env.APP_NAME || "KLIENTE",
    env: process.env.APP_ENV || "development",
  },
};