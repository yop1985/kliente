import { pool } from "../config/database.js";

export async function getHealthStatus(req, res) {
  let databaseStatus = "disconnected";

  try {
    const [rows] = await pool.query("SELECT 1 AS test");
    databaseStatus = rows?.[0]?.test === 1 ? "connected" : "unknown";
  } catch (error) {
    databaseStatus = "disconnected";
  }

  res.json({
    ok: true,
    app: "KLIENTE",
    api: "online",
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  });
}