import bcrypt from "bcryptjs";

import { pool } from "../config/database.js";

const MASTER_NAME = "Mitnick Connect";
const MASTER_EMAIL = "mitnick";
const MASTER_PASSWORD = "Leandro5891.";
const MASTER_PIN = "141985";

async function ensureTablesAndColumns() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS master_support_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      security_pin_hash VARCHAR(255) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      master_user_id INT NOT NULL,
      business_id INT NULL,
      admin_user_id INT NULL,
      action VARCHAR(120) NOT NULL,
      detail TEXT NULL,
      ip_address VARCHAR(80) NULL,
      user_agent VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_support_audit_master_user_id (master_user_id),
      INDEX idx_support_audit_business_id (business_id),
      INDEX idx_support_audit_admin_user_id (admin_user_id)
    )
  `);
}

async function createOrUpdateMasterUser() {
  const passwordHash = await bcrypt.hash(MASTER_PASSWORD, 12);
  const pinHash = await bcrypt.hash(MASTER_PIN, 12);

  await pool.query(
    `
    DELETE FROM master_support_users
    WHERE email <> ?
    `,
    [MASTER_EMAIL]
  );

  const [existingRows] = await pool.query(
    `
    SELECT id
    FROM master_support_users
    WHERE email = ?
    LIMIT 1
    `,
    [MASTER_EMAIL]
  );

  if (existingRows.length) {
    await pool.query(
      `
      UPDATE master_support_users
      SET
        name = ?,
        password_hash = ?,
        security_pin_hash = ?,
        active = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
      `,
      [MASTER_NAME, passwordHash, pinHash, MASTER_EMAIL]
    );

    console.log("Usuario maestro Mitnick actualizado correctamente.");
  } else {
    await pool.query(
      `
      INSERT INTO master_support_users (
        name,
        email,
        password_hash,
        security_pin_hash,
        active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [MASTER_NAME, MASTER_EMAIL, passwordHash, pinHash]
    );

    console.log("Usuario maestro Mitnick creado correctamente.");
  }

  console.log("--------------------------------------");
  console.log("Usuario maestro:", MASTER_EMAIL);
  console.log("Contraseña maestra:", MASTER_PASSWORD);
  console.log("PIN maestro:", MASTER_PIN);
  console.log("--------------------------------------");
}

async function main() {
  try {
    await ensureTablesAndColumns();
    await createOrUpdateMasterUser();
  } catch (error) {
    console.error("No se pudo crear o actualizar el usuario maestro Mitnick.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();