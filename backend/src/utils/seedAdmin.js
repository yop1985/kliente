import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";

async function seedAdminUser() {
  const businessId = 1;
  const name = "Administrador";
  const email = "admin@kliente.cl";
  const password = "123456";
  const role = "owner";

  try {
    console.log("Creando usuario administrador inicial...");

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO admin_users (
        business_id,
        name,
        email,
        password_hash,
        role,
        active
      )
      VALUES (?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        active = VALUES(active),
        updated_at = CURRENT_TIMESTAMP
      `,
      [businessId, name, email, passwordHash, role]
    );

    console.log("Administrador creado correctamente.");
    console.log("------------------------------------");
    console.log("Email: admin@kliente.cl");
    console.log("Password: 123456");
    console.log("------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creando administrador inicial:");
    console.error(error);
    process.exit(1);
  }
}

seedAdminUser();