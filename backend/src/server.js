import "dotenv/config";

import app from "./app.js";
import { pool } from "./config/database.js";

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log("======================================");
      console.log("Servidor KLIENTE iniciado correctamente");
      console.log(`URL backend: http://localhost:${PORT}`);
      console.log("Creado por Mitnick Connect");
      console.log("======================================");
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor KLIENTE");
    console.error("Creado por Mitnick Connect");
    console.error(error);
    process.exit(1);
  }
}

startServer();