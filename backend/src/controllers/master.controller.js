import bcrypt from "bcryptjs";

import { pool } from "../config/database.js";

const MASTER_USERNAME = process.env.MITNICK_MASTER_USERNAME || "mitnick";
const MASTER_PASSWORD = process.env.MITNICK_MASTER_PASSWORD || "Leandro5891.";
const MASTER_PIN = process.env.MITNICK_MASTER_PIN || "141985";
const DEFAULT_ADMIN_PASSWORD =
  process.env.KLIENTE_DEFAULT_ADMIN_PASSWORD || "123456";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "kliente.cl";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDate(value) {
  const cleanValue = normalizeString(value);

  if (!cleanValue) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return "";
  }

  return cleanValue;
}

function addMonthsToDate(dateValue, monthsToAdd) {
  const cleanDate = normalizeDate(dateValue);

  if (!cleanDate) {
    return null;
  }

  const [year, month, day] = cleanDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setMonth(date.getMonth() + monthsToAdd);

  const outputYear = date.getFullYear();
  const outputMonth = String(date.getMonth() + 1).padStart(2, "0");
  const outputDay = String(date.getDate()).padStart(2, "0");

  return `${outputYear}-${outputMonth}-${outputDay}`;
}

function getPlanMonths(planName) {
  const cleanPlan = normalizeString(planName).toLowerCase();

  if (cleanPlan === "semestral") {
    return 6;
  }

  if (cleanPlan === "anual") {
    return 12;
  }

  return 1;
}

function calculatePaidUntil({ activatedAt, planName, paidUntil }) {
  const manualPaidUntil = normalizeDate(paidUntil);

  if (manualPaidUntil) {
    return manualPaidUntil;
  }

  const cleanActivatedAt = normalizeDate(activatedAt);

  if (!cleanActivatedAt) {
    return null;
  }

  return addMonthsToDate(cleanActivatedAt, getPlanMonths(planName));
}

function isValidMasterCredentials(req) {
  const username = normalizeString(
    req.body.masterUsername || req.body.username
  );
  const password = normalizeString(
    req.body.masterPassword || req.body.password
  );
  const pin = normalizeString(req.body.masterPin || req.body.pin);

  return (
    username === MASTER_USERNAME &&
    password === MASTER_PASSWORD &&
    pin === MASTER_PIN
  );
}

function requireMaster(req, res) {
  if (!isValidMasterCredentials(req)) {
    res.status(401).json({
      ok: false,
      code: "MASTER_UNAUTHORIZED",
      message: "Credenciales maestras inválidas.",
    });

    return false;
  }

  return true;
}

function validateTemporaryPassword(password) {
  const cleanPassword = normalizeString(password);

  if (cleanPassword.length < 6) {
    return {
      ok: false,
      message: "La contraseña provisoria debe tener mínimo 6 caracteres.",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

function getPaymentAlert(paidUntil) {
  if (!paidUntil) {
    return {
      type: "none",
      message: "",
      daysLeft: null,
    };
  }

  const today = new Date();
  const dueDate = new Date(paidUntil);

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / 86400000);

  if (daysLeft < 0) {
    return {
      type: "overdue",
      message: "Pago vencido",
      daysLeft,
    };
  }

  if (daysLeft === 0) {
    return {
      type: "today",
      message: "Debe pagar hoy",
      daysLeft,
    };
  }

  if (daysLeft === 1) {
    return {
      type: "tomorrow",
      message: "Debe pagar mañana",
      daysLeft,
    };
  }

  return {
    type: "ok",
    message: `Faltan ${daysLeft} días`,
    daysLeft,
  };
}

function mapBusiness(row) {
  const paymentAlert = getPaymentAlert(row.paid_until);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    publicUrl: row.slug ? `https://${row.slug}.${ROOT_DOMAIN}` : "",
    rut: row.rut || "",
    address: row.address || "",
    phone: row.phone || "",
    email: row.email || "",
    logoUrl: row.logo_url || "",
    active: Boolean(row.active),
    status: row.status || (row.active ? "active" : "suspended"),
    planName: row.plan_name || "",
    paymentStatus: row.payment_status || "paid",
    activatedAt: row.activated_at || null,
    paidUntil: row.paid_until || null,
    suspendedAt: row.suspended_at || null,
    suspendedReason: row.suspended_reason || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    adminUsersCount: Number(row.admin_users_count || 0),
    lockedUsersCount: Number(row.locked_users_count || 0),
    paymentAlert,
  };
}

function mapAdminUser(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name || "",
    businessSlug: row.business_slug || "",
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    mustChangePassword: Boolean(row.must_change_password),
    pinMustChange: Boolean(row.pin_must_change),
    pinFailedAttempts: Number(row.pin_failed_attempts || 0),
    lockedByPin: Boolean(row.locked_by_pin),
    lockedAt: row.locked_at,
    lockedReason: row.locked_reason || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getMappedBusinessById(businessId) {
  const [[business]] = await pool.query(
    `
    SELECT
      b.*,
      COUNT(au.id) AS admin_users_count,
      SUM(CASE WHEN au.locked_by_pin = 1 THEN 1 ELSE 0 END) AS locked_users_count
    FROM businesses b
    LEFT JOIN admin_users au ON au.business_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
    `,
    [businessId]
  );

  return business ? mapBusiness(business) : null;
}

export async function getMasterSummary(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const [[businessStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_businesses,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_businesses,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_businesses,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_businesses,
        SUM(CASE WHEN paid_until = CURDATE() THEN 1 ELSE 0 END) AS due_today,
        SUM(CASE WHEN paid_until = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS due_tomorrow,
        SUM(CASE WHEN paid_until < CURDATE() THEN 1 ELSE 0 END) AS overdue
      FROM businesses
    `);

    const [[userStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_admin_users,
        SUM(CASE WHEN locked_by_pin = 1 THEN 1 ELSE 0 END) AS locked_users
      FROM admin_users
    `);

    res.json({
      ok: true,
      data: {
        businesses: {
          total: Number(businessStats.total_businesses || 0),
          active: Number(businessStats.active_businesses || 0),
          suspended: Number(businessStats.suspended_businesses || 0),
          cancelled: Number(businessStats.cancelled_businesses || 0),
          dueToday: Number(businessStats.due_today || 0),
          dueTomorrow: Number(businessStats.due_tomorrow || 0),
          overdue: Number(businessStats.overdue || 0),
        },
        users: {
          total: Number(userStats.total_admin_users || 0),
          locked: Number(userStats.locked_users || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMasterBusinesses(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const search = normalizeString(req.body.search || req.query.search);
    const status = normalizeString(req.body.status || req.query.status);

    const params = [];
    const where = [];

    if (search) {
      where.push(`
        (
          b.name LIKE ?
          OR b.slug LIKE ?
          OR b.rut LIKE ?
          OR b.phone LIKE ?
          OR b.email LIKE ?
        )
      `);

      const likeSearch = `%${search}%`;
      params.push(likeSearch, likeSearch, likeSearch, likeSearch, likeSearch);
    }

    if (status && status !== "all") {
      where.push("b.status = ?");
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
      SELECT
        b.*,
        COUNT(au.id) AS admin_users_count,
        SUM(CASE WHEN au.locked_by_pin = 1 THEN 1 ELSE 0 END) AS locked_users_count
      FROM businesses b
      LEFT JOIN admin_users au ON au.business_id = b.id
      ${whereSql}
      GROUP BY b.id
      ORDER BY
        CASE
          WHEN b.paid_until < CURDATE() THEN 0
          WHEN b.paid_until = CURDATE() THEN 1
          WHEN b.paid_until = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 2
          ELSE 3
        END,
        b.created_at DESC
      `,
      params
    );

    res.json({
      ok: true,
      data: rows.map(mapBusiness),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMasterBusinessById(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessId = Number(req.params.businessId || 0);

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        message: "ID de comercio inválido.",
      });
    }

    const [[business]] = await pool.query(
      `
      SELECT
        b.*,
        COUNT(au.id) AS admin_users_count,
        SUM(CASE WHEN au.locked_by_pin = 1 THEN 1 ELSE 0 END) AS locked_users_count
      FROM businesses b
      LEFT JOIN admin_users au ON au.business_id = b.id
      WHERE b.id = ?
      GROUP BY b.id
      `,
      [businessId]
    );

    if (!business) {
      return res.status(404).json({
        ok: false,
        message: "Comercio no encontrado.",
      });
    }

    const [users] = await pool.query(
      `
      SELECT
        au.*,
        b.name AS business_name,
        b.slug AS business_slug
      FROM admin_users au
      INNER JOIN businesses b ON b.id = au.business_id
      WHERE au.business_id = ?
      ORDER BY au.created_at ASC
      `,
      [businessId]
    );

    res.json({
      ok: true,
      data: {
        business: mapBusiness(business),
        users: users.map(mapAdminUser),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createMasterBusiness(req, res, next) {
  const connection = await pool.getConnection();

  try {
    if (!requireMaster(req, res)) {
      connection.release();
      return;
    }

    const name = normalizeString(req.body.name);
    const slug = normalizeSlug(req.body.slug || name);
    const rut = normalizeString(req.body.rut);
    const address = normalizeString(req.body.address);
    const phone = normalizeString(req.body.phone);
    const email = normalizeString(req.body.email);
    const planName = normalizeString(req.body.planName || "Mensual");
    const paymentStatus = normalizeString(req.body.paymentStatus || "paid");
    const activatedAt = normalizeDate(req.body.activatedAt);
    const paidUntil = calculatePaidUntil({
      activatedAt,
      planName,
      paidUntil: req.body.paidUntil,
    });

    const adminName = normalizeString(req.body.adminName || "Administrador");
    const adminEmail = normalizeString(req.body.adminEmail).toLowerCase();
    const adminPassword =
      normalizeString(req.body.adminPassword) || DEFAULT_ADMIN_PASSWORD;

    const passwordValidation = validateTemporaryPassword(adminPassword);

    if (!passwordValidation.ok) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: passwordValidation.message,
      });
    }

    if (!name) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "El nombre del comercio es obligatorio.",
      });
    }

    if (!slug) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "El subdominio del comercio es obligatorio.",
      });
    }

    if (!activatedAt) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "La fecha de activación es obligatoria.",
      });
    }

    if (!adminEmail) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "El correo administrador del comercio es obligatorio.",
      });
    }

    const [existingSlug] = await connection.query(
      "SELECT id FROM businesses WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (existingSlug.length) {
      connection.release();
      return res.status(409).json({
        ok: false,
        message: "Ya existe un comercio con ese subdominio.",
      });
    }

    const [existingAdmin] = await connection.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [adminEmail]
    );

    if (existingAdmin.length) {
      connection.release();
      return res.status(409).json({
        ok: false,
        message: "Ya existe un usuario administrador con ese correo.",
      });
    }

    await connection.beginTransaction();

    const [businessResult] = await connection.query(
      `
      INSERT INTO businesses
        (
          name,
          slug,
          rut,
          address,
          phone,
          email,
          active,
          status,
          plan_name,
          payment_status,
          activated_at,
          paid_until,
          suspended_at,
          suspended_reason
        )
      VALUES
        (?, ?, ?, ?, ?, ?, 1, 'active', ?, ?, ?, ?, NULL, NULL)
      `,
      [
        name,
        slug,
        rut || null,
        address || null,
        phone || null,
        email || null,
        planName || "Mensual",
        paymentStatus || "paid",
        activatedAt,
        paidUntil,
      ]
    );

    const businessId = businessResult.insertId;
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await connection.query(
      `
      INSERT INTO admin_users
        (
          business_id,
          name,
          email,
          password_hash,
          role,
          active,
          must_change_password,
          security_pin_hash,
          pin_must_change,
          pin_failed_attempts,
          locked_by_pin,
          locked_at,
          locked_reason
        )
      VALUES
        (?, ?, ?, ?, 'admin', 1, 1, NULL, 1, 0, 0, NULL, NULL)
      `,
      [businessId, adminName, adminEmail, passwordHash]
    );

    await connection.commit();

    const createdBusiness = await getMappedBusinessById(businessId);

    res.status(201).json({
      ok: true,
      message: "Comercio creado correctamente.",
      data: {
        business: createdBusiness,
        admin: {
          email: adminEmail,
          temporaryPassword: adminPassword,
          mustChangePassword: true,
          pinMustChange: true,
        },
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Error rollback createMasterBusiness:", rollbackError);
    }

    next(error);
  } finally {
    connection.release();
  }
}

export async function registerMasterBusinessPayment(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessId = Number(req.params.businessId || 0);
    const planName = normalizeString(req.body.planName || "Mensual");
    const activatedAt = normalizeDate(req.body.activatedAt);
    const paymentNote =
      normalizeString(req.body.paymentNote) || "Pago registrado desde panel maestro.";

    const paidUntil = calculatePaidUntil({
      activatedAt,
      planName,
      paidUntil: req.body.paidUntil,
    });

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        message: "ID de comercio inválido.",
      });
    }

    if (!activatedAt) {
      return res.status(400).json({
        ok: false,
        message: "La fecha de pago o renovación es obligatoria.",
      });
    }

    if (!paidUntil) {
      return res.status(400).json({
        ok: false,
        message: "No se pudo calcular la próxima fecha de pago.",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE businesses
      SET
        active = 1,
        status = 'active',
        payment_status = 'paid',
        plan_name = ?,
        activated_at = ?,
        paid_until = ?,
        suspended_at = NULL,
        suspended_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [planName, activatedAt, paidUntil, businessId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        ok: false,
        message: "Comercio no encontrado.",
      });
    }

    const business = await getMappedBusinessById(businessId);

    res.json({
      ok: true,
      message: "Pago registrado y comercio renovado correctamente.",
      data: {
        business,
        payment: {
          planName,
          activatedAt,
          paidUntil,
          note: paymentNote,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function suspendMasterBusiness(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessId = Number(req.params.businessId || 0);
    const reason =
      normalizeString(req.body.reason) || "Suspendido por no pago.";

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        message: "ID de comercio inválido.",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE businesses
      SET
        active = 0,
        status = 'suspended',
        payment_status = 'overdue',
        suspended_at = CURRENT_TIMESTAMP,
        suspended_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [reason, businessId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        ok: false,
        message: "Comercio no encontrado.",
      });
    }

    res.json({
      ok: true,
      message: "Comercio suspendido correctamente.",
    });
  } catch (error) {
    next(error);
  }
}

export async function reactivateMasterBusiness(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessId = Number(req.params.businessId || 0);
    const activatedAt = normalizeDate(req.body.activatedAt);
    const planName = normalizeString(req.body.planName);
    const paidUntil = calculatePaidUntil({
      activatedAt,
      planName,
      paidUntil: req.body.paidUntil,
    });

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        message: "ID de comercio inválido.",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE businesses
      SET
        active = 1,
        status = 'active',
        payment_status = 'paid',
        activated_at = COALESCE(?, activated_at),
        plan_name = COALESCE(NULLIF(?, ''), plan_name),
        paid_until = COALESCE(?, paid_until),
        suspended_at = NULL,
        suspended_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [activatedAt || null, planName || "", paidUntil || null, businessId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        ok: false,
        message: "Comercio no encontrado.",
      });
    }

    res.json({
      ok: true,
      message: "Comercio reactivado correctamente.",
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMasterBusiness(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessId = Number(req.params.businessId || 0);
    const reason = normalizeString(req.body.reason) || "Comercio cancelado.";

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        message: "ID de comercio inválido.",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE businesses
      SET
        active = 0,
        status = 'cancelled',
        payment_status = 'overdue',
        suspended_at = CURRENT_TIMESTAMP,
        suspended_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [reason, businessId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        ok: false,
        message: "Comercio no encontrado.",
      });
    }

    res.json({
      ok: true,
      message: "Comercio cancelado correctamente.",
    });
  } catch (error) {
    next(error);
  }
}

export async function unlockMasterAdminUser(req, res, next) {
  try {
    if (!requireMaster(req, res)) {
      return;
    }

    const businessSlug = normalizeSlug(req.body.businessSlug);
    const targetEmail = normalizeString(req.body.targetEmail).toLowerCase();
    const targetUserId = Number(req.body.targetUserId || 0);
    const resetPassword =
      normalizeString(req.body.resetPassword) || DEFAULT_ADMIN_PASSWORD;

    const passwordValidation = validateTemporaryPassword(resetPassword);

    if (!passwordValidation.ok) {
      return res.status(400).json({
        ok: false,
        message: passwordValidation.message,
      });
    }

    if (!businessSlug && !targetUserId) {
      return res.status(400).json({
        ok: false,
        message: "Debes indicar subdominio o ID de usuario.",
      });
    }

    if (!targetEmail && !targetUserId) {
      return res.status(400).json({
        ok: false,
        message: "Debes indicar correo o ID del usuario.",
      });
    }

    const params = [];
    const where = [];

    if (targetUserId) {
      where.push("au.id = ?");
      params.push(targetUserId);
    } else {
      where.push("LOWER(au.email) = ?");
      params.push(targetEmail);

      if (businessSlug) {
        where.push("b.slug = ?");
        params.push(businessSlug);
      }
    }

    const [[user]] = await pool.query(
      `
      SELECT
        au.*,
        b.name AS business_name,
        b.slug AS business_slug
      FROM admin_users au
      INNER JOIN businesses b ON b.id = au.business_id
      WHERE ${where.join(" AND ")}
      LIMIT 1
      `,
      params
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario del comercio no encontrado.",
      });
    }

    const passwordHash = await bcrypt.hash(resetPassword, 10);

    await pool.query(
      `
      UPDATE admin_users
      SET
        password_hash = ?,
        must_change_password = 1,
        security_pin_hash = NULL,
        pin_must_change = 1,
        pin_failed_attempts = 0,
        locked_by_pin = 0,
        locked_at = NULL,
        locked_reason = NULL,
        active = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [passwordHash, user.id]
    );

    res.json({
      ok: true,
      message: "Usuario desbloqueado y reseteado correctamente.",
      data: {
        user: mapAdminUser(user),
        temporaryPassword: resetPassword,
        nextStepForCommerce: "change_password",
      },
    });
  } catch (error) {
    next(error);
  }
}