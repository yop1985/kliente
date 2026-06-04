import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../config/database.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "kliente_mitnick_connect_super_secret_2026";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "kliente.cl";
const DEFAULT_PUBLIC_SLUG = process.env.DEFAULT_PUBLIC_SLUG || "demo";

const SUPPORT_EMAIL = "mitnickconnect@gmail.com";
const SUPPORT_WHATSAPP = "+56 9 4969 1796";
const SUPPORT_WHATSAPP_LINK =
  "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20de%20KLIENTE%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20del%20mensaje.";

const MASTER_USERNAME = process.env.MITNICK_MASTER_USERNAME || "mitnick";
const MASTER_PASSWORD = process.env.MITNICK_MASTER_PASSWORD || "Leandro5891.";
const MASTER_PIN = process.env.MITNICK_MASTER_PIN || "141985";
const RESET_PASSWORD = process.env.KLIENTE_RESET_PASSWORD || "123456";

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanHostname(hostname = "") {
  return String(hostname)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(":")[0]
    .trim();
}

function getSlugFromHostname(hostname) {
  const cleanHost = cleanHostname(hostname);

  if (!cleanHost) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "0.0.0.0"
  ) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (cleanHost === ROOT_DOMAIN || cleanHost === `www.${ROOT_DOMAIN}`) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (cleanHost.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = cleanHost.replace(`.${ROOT_DOMAIN}`, "");
    const firstPart = subdomain.split(".")[0];

    return firstPart || DEFAULT_PUBLIC_SLUG;
  }

  return DEFAULT_PUBLIC_SLUG;
}

function getBusinessSlugFromRequest(req) {
  const bodySlug = normalizeString(req.body?.businessSlug);
  const querySlug = normalizeString(req.query?.slug);

  const headerSlug =
    typeof req.headers["x-business-slug"] === "string"
      ? req.headers["x-business-slug"].trim()
      : "";

  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "";

  return bodySlug || querySlug || headerSlug || getSlugFromHostname(hostHeader);
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      businessId: user.business_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

function getBusinessStatus(row) {
  if (!row) {
    return "active";
  }

  return row.business_status || (row.business_active ? "active" : "suspended");
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id,
    businessSlug: row.business_slug,
    businessName: row.business_name,
    businessStatus: getBusinessStatus(row),
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    mustChangePassword: Boolean(row.must_change_password),
    pinMustChange: Boolean(row.pin_must_change),
    lockedByPin: Boolean(row.locked_by_pin),
    pinFailedAttempts: Number(row.pin_failed_attempts || 0),
  };
}

function getBusinessBlockedPayload(business) {
  const status = business.status || (business.active ? "active" : "suspended");

  if (status === "cancelled") {
    return {
      ok: false,
      code: "BUSINESS_CANCELLED",
      message: "Servicio cancelado. Contactar a Mitnick Connect.",
      details:
        business.suspended_reason ||
        "El servicio del comercio se encuentra cancelado.",
      support: {
        email: SUPPORT_EMAIL,
        whatsapp: SUPPORT_WHATSAPP,
        whatsappLink:
          "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20servicio%20KLIENTE%20aparece%20cancelado.",
      },
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        status,
      },
      copyright: "© by Mitnick-Connect",
    };
  }

  return {
    ok: false,
    code: "BUSINESS_SUSPENDED",
    message: "Servicio suspendido. Contactar a Mitnick Connect.",
    details:
      business.suspended_reason ||
      "El servicio del comercio se encuentra suspendido por no pago.",
    support: {
      email: SUPPORT_EMAIL,
      whatsapp: SUPPORT_WHATSAPP,
      whatsappLink:
        "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20servicio%20KLIENTE%20aparece%20suspendido.",
    },
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status,
    },
    copyright: "© by Mitnick-Connect",
  };
}

function getBlockedPayload(user = null) {
  return {
    ok: false,
    code: "USER_LOCKED_BY_PIN",
    message:
      "Usuario bloqueado por seguridad. Se ingresó incorrectamente el PIN de seguridad 3 veces.",
    details:
      "Por protección del comercio, el acceso quedó bloqueado. Para solicitar desbloqueo, enviar correo a mitnickconnect@gmail.com y fotografía o captura del mensaje al WhatsApp +56 9 4969 1796.",
    support: {
      email: SUPPORT_EMAIL,
      whatsapp: SUPPORT_WHATSAPP,
      whatsappLink: SUPPORT_WHATSAPP_LINK,
      mailto:
        "mailto:mitnickconnect@gmail.com?subject=Usuario%20bloqueado%20KLIENTE&body=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20o%20captura%20del%20mensaje.",
    },
    user: user ? mapUser(user) : null,
    copyright: "© by Mitnick-Connect",
  };
}

function verifyMasterCredentials({ username, password, pin }) {
  const cleanUsername = normalizeString(username).toLowerCase();
  const cleanPassword = normalizeString(password);
  const cleanPin = normalizeString(pin);

  return (
    cleanUsername === MASTER_USERNAME.toLowerCase() &&
    cleanPassword === MASTER_PASSWORD &&
    cleanPin === MASTER_PIN
  );
}

function mapMasterUnlockUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id,
    businessSlug: row.business_slug,
    businessName: row.business_name,
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    mustChangePassword: Boolean(row.must_change_password),
    pinMustChange: Boolean(row.pin_must_change),
    lockedByPin: Boolean(row.locked_by_pin),
    pinFailedAttempts: Number(row.pin_failed_attempts || 0),
    lockedAt: row.locked_at,
    lockedReason: row.locked_reason,
  };
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  const looksLikeBcrypt =
    passwordHash.startsWith("$2a$") ||
    passwordHash.startsWith("$2b$") ||
    passwordHash.startsWith("$2y$");

  if (looksLikeBcrypt) {
    return bcrypt.compare(password, passwordHash);
  }

  return password === passwordHash;
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "La nueva contraseña debe tener mínimo 8 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "La nueva contraseña debe tener al menos una letra mayúscula.";
  }

  if (!/[a-z]/.test(password)) {
    return "La nueva contraseña debe tener al menos una letra minúscula.";
  }

  if (!/[0-9]/.test(password)) {
    return "La nueva contraseña debe tener al menos un número.";
  }

  return "";
}

function validatePin(pin) {
  if (!/^[0-9]{6}$/.test(pin)) {
    return "El PIN debe tener exactamente 6 dígitos numéricos.";
  }

  return "";
}

function isBusinessBlocked(businessOrUser) {
  const status =
    businessOrUser.status ||
    businessOrUser.business_status ||
    (businessOrUser.business_active || businessOrUser.active
      ? "active"
      : "suspended");

  return (
    !Boolean(businessOrUser.business_active ?? businessOrUser.active) ||
    status === "suspended" ||
    status === "cancelled"
  );
}

async function getAdminUserById(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.business_id,
      b.slug AS business_slug,
      b.name AS business_name,
      b.active AS business_active,
      b.status AS business_status,
      b.suspended_reason AS business_suspended_reason,
      u.name,
      u.email,
      u.password_hash,
      u.role,
      u.active,
      u.must_change_password,
      u.security_pin_hash,
      u.pin_must_change,
      u.pin_failed_attempts,
      u.locked_by_pin,
      u.locked_at,
      u.locked_reason
    FROM admin_users u
    INNER JOIN businesses b
      ON b.id = u.business_id
    WHERE u.id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function getAdminUserByEmailAndBusiness(email, businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.business_id,
      b.slug AS business_slug,
      b.name AS business_name,
      b.active AS business_active,
      b.status AS business_status,
      b.suspended_reason AS business_suspended_reason,
      u.name,
      u.email,
      u.password_hash,
      u.role,
      u.active,
      u.must_change_password,
      u.security_pin_hash,
      u.pin_must_change,
      u.pin_failed_attempts,
      u.locked_by_pin,
      u.locked_at,
      u.locked_reason
    FROM admin_users u
    INNER JOIN businesses b
      ON b.id = u.business_id
    WHERE u.email = ?
      AND u.business_id = ?
    LIMIT 1
    `,
    [email, businessId]
  );

  return rows[0] || null;
}

async function getAdminUserForMasterUnlock({
  targetEmail,
  targetUserId,
  businessSlug,
}) {
  const params = [];
  let filters = "";

  if (targetUserId) {
    filters += " AND u.id = ?";
    params.push(targetUserId);
  }

  if (targetEmail) {
    filters += " AND u.email = ?";
    params.push(targetEmail);
  }

  if (businessSlug) {
    filters += " AND b.slug = ?";
    params.push(businessSlug);
  }

  if (!filters) {
    return null;
  }

  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.business_id,
      b.slug AS business_slug,
      b.name AS business_name,
      u.name,
      u.email,
      u.password_hash,
      u.role,
      u.active,
      u.must_change_password,
      u.security_pin_hash,
      u.pin_must_change,
      u.pin_failed_attempts,
      u.locked_by_pin,
      u.locked_at,
      u.locked_reason
    FROM admin_users u
    INNER JOIN businesses b
      ON b.id = u.business_id
    WHERE 1 = 1
      ${filters}
    ORDER BY u.id ASC
    LIMIT 1
    `,
    params
  );

  return rows[0] || null;
}

async function registerFailedPinAttempt(user) {
  const currentAttempts = Number(user.pin_failed_attempts || 0);
  const nextAttempts = currentAttempts + 1;
  const shouldLock = nextAttempts >= 3;

  await pool.query(
    `
    UPDATE admin_users
    SET
      pin_failed_attempts = ?,
      locked_by_pin = ?,
      locked_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE locked_at END,
      locked_reason = CASE WHEN ? = 1 THEN 'PIN incorrecto 3 veces' ELSE locked_reason END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      nextAttempts,
      shouldLock ? 1 : 0,
      shouldLock ? 1 : 0,
      shouldLock ? 1 : 0,
      user.id,
    ]
  );

  return {
    attempts: nextAttempts,
    locked: shouldLock,
  };
}

async function resetPinAttempts(userId) {
  await pool.query(
    `
    UPDATE admin_users
    SET
      pin_failed_attempts = 0,
      locked_by_pin = 0,
      locked_at = NULL,
      locked_reason = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [userId]
  );
}

async function verifySecurityPinOrLock(user, pin) {
  if (user.locked_by_pin) {
    return {
      ok: false,
      locked: true,
      message: "Usuario bloqueado por seguridad.",
    };
  }

  if (!user.security_pin_hash) {
    return {
      ok: false,
      locked: false,
      message: "El usuario todavía no tiene PIN de seguridad creado.",
    };
  }

  const pinIsValid = await bcrypt.compare(pin, user.security_pin_hash);

  if (pinIsValid) {
    await resetPinAttempts(user.id);

    return {
      ok: true,
      locked: false,
      message: "PIN correcto.",
    };
  }

  const attemptResult = await registerFailedPinAttempt(user);

  if (attemptResult.locked) {
    return {
      ok: false,
      locked: true,
      message:
        "PIN incorrecto. El usuario fue bloqueado por seguridad después de 3 intentos fallidos.",
    };
  }

  return {
    ok: false,
    locked: false,
    message: `PIN incorrecto. Intentos fallidos: ${attemptResult.attempts}/3.`,
  };
}

async function handleLogin(req, res, next) {
  try {
    const email = normalizeString(req.body.email).toLowerCase();
    const password = normalizeString(req.body.password);
    const businessSlug = getBusinessSlugFromRequest(req);

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Correo y contraseña son obligatorios",
        copyright: "© by Mitnick-Connect",
      });
    }

    const [businessRows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        active,
        status,
        suspended_reason
      FROM businesses
      WHERE slug = ?
      LIMIT 1
      `,
      [businessSlug]
    );

    if (!businessRows.length) {
      return res.status(404).json({
        ok: false,
        message: `No existe comercio para el subdominio: ${businessSlug}`,
        copyright: "© by Mitnick-Connect",
      });
    }

    const business = businessRows[0];
    const businessStatus = business.status || (business.active ? "active" : "suspended");

    if (!business.active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res
        .status(403)
        .json(getBusinessBlockedPayload({ ...business, status: businessStatus }));
    }

    const user = await getAdminUserByEmailAndBusiness(email, business.id);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Correo o contraseña incorrectos",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        ok: false,
        message: "Usuario inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    const passwordIsValid = await verifyPassword(password, user.password_hash);

    if (!passwordIsValid) {
      return res.status(401).json({
        ok: false,
        message: "Correo o contraseña incorrectos",
        copyright: "© by Mitnick-Connect",
      });
    }

    const token = createToken(user);

    return res.json({
      ok: true,
      data: {
        token,
        user: mapUser(user),
        nextStep: user.must_change_password
          ? "change_password"
          : user.pin_must_change || !user.security_pin_hash
            ? "create_pin"
            : "dashboard",
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function handleAdminProfile(req, res, next) {
  try {
    const userId = Number(req.user?.id || 0);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    const user = await getAdminUserById(userId);

    if (!user || !user.active) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado o inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const businessStatus = getBusinessStatus(user);

    if (!user.business_active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res.status(403).json(
        getBusinessBlockedPayload({
          id: user.business_id,
          name: user.business_name,
          slug: user.business_slug,
          active: user.business_active,
          status: businessStatus,
          suspended_reason: user.business_suspended_reason,
        })
      );
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    return res.json({
      ok: true,
      data: {
        user: mapUser(user),
        nextStep: user.must_change_password
          ? "change_password"
          : user.pin_must_change || !user.security_pin_hash
            ? "create_pin"
            : "dashboard",
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function changeInitialPassword(req, res, next) {
  try {
    const userId = Number(req.user?.id || 0);
    const currentPassword = normalizeString(req.body.currentPassword);
    const newPassword = normalizeString(req.body.newPassword);
    const confirmPassword = normalizeString(req.body.confirmPassword);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    const user = await getAdminUserById(userId);

    if (!user || !user.active) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado o inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const businessStatus = getBusinessStatus(user);

    if (!user.business_active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res.status(403).json(
        getBusinessBlockedPayload({
          id: user.business_id,
          name: user.business_name,
          slug: user.business_slug,
          active: user.business_active,
          status: businessStatus,
          suspended_reason: user.business_suspended_reason,
        })
      );
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        ok: false,
        message:
          "Debes completar contraseña actual, nueva contraseña y confirmación.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        ok: false,
        message: "La confirmación de contraseña no coincide.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        ok: false,
        message: passwordError,
        copyright: "© by Mitnick-Connect",
      });
    }

    const currentPasswordIsValid = await verifyPassword(
      currentPassword,
      user.password_hash
    );

    if (!currentPasswordIsValid) {
      return res.status(401).json({
        ok: false,
        message: "La contraseña actual es incorrecta.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `
      UPDATE admin_users
      SET
        password_hash = ?,
        must_change_password = 0,
        last_password_change_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [newPasswordHash, userId]
    );

    const updatedUser = await getAdminUserById(userId);

    return res.json({
      ok: true,
      message: "Contraseña actualizada correctamente.",
      data: {
        user: mapUser(updatedUser),
        nextStep:
          updatedUser.pin_must_change || !updatedUser.security_pin_hash
            ? "create_pin"
            : "dashboard",
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function createOrChangeInitialPin(req, res, next) {
  try {
    const userId = Number(req.user?.id || 0);
    const newPin = normalizeString(req.body.newPin);
    const confirmPin = normalizeString(req.body.confirmPin);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    const user = await getAdminUserById(userId);

    if (!user || !user.active) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado o inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const businessStatus = getBusinessStatus(user);

    if (!user.business_active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res.status(403).json(
        getBusinessBlockedPayload({
          id: user.business_id,
          name: user.business_name,
          slug: user.business_slug,
          active: user.business_active,
          status: businessStatus,
          suspended_reason: user.business_suspended_reason,
        })
      );
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    if (user.must_change_password) {
      return res.status(409).json({
        ok: false,
        message: "Primero debes cambiar tu contraseña inicial.",
        nextStep: "change_password",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!newPin || !confirmPin) {
      return res.status(400).json({
        ok: false,
        message: "Debes ingresar y confirmar el nuevo PIN.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({
        ok: false,
        message: "La confirmación del PIN no coincide.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const pinError = validatePin(newPin);

    if (pinError) {
      return res.status(400).json({
        ok: false,
        message: pinError,
        copyright: "© by Mitnick-Connect",
      });
    }

    const pinHash = await bcrypt.hash(newPin, 12);

    await pool.query(
      `
      UPDATE admin_users
      SET
        security_pin_hash = ?,
        pin_must_change = 0,
        pin_failed_attempts = 0,
        locked_by_pin = 0,
        locked_at = NULL,
        locked_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [pinHash, userId]
    );

    const updatedUser = await getAdminUserById(userId);

    return res.json({
      ok: true,
      message: "PIN creado correctamente.",
      data: {
        user: mapUser(updatedUser),
        nextStep: "dashboard",
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function changePasswordWithPin(req, res, next) {
  try {
    const userId = Number(req.user?.id || 0);
    const currentPassword = normalizeString(req.body.currentPassword);
    const newPassword = normalizeString(req.body.newPassword);
    const confirmPassword = normalizeString(req.body.confirmPassword);
    const securityPin = normalizeString(req.body.securityPin);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    const user = await getAdminUserById(userId);

    if (!user || !user.active) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado o inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const businessStatus = getBusinessStatus(user);

    if (!user.business_active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res.status(403).json(
        getBusinessBlockedPayload({
          id: user.business_id,
          name: user.business_name,
          slug: user.business_slug,
          active: user.business_active,
          status: businessStatus,
          suspended_reason: user.business_suspended_reason,
        })
      );
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    if (!currentPassword || !newPassword || !confirmPassword || !securityPin) {
      return res.status(400).json({
        ok: false,
        message:
          "Debes completar contraseña actual, nueva contraseña, confirmación y PIN.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        ok: false,
        message: "La confirmación de contraseña no coincide.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        ok: false,
        message: passwordError,
        copyright: "© by Mitnick-Connect",
      });
    }

    const pinError = validatePin(securityPin);

    if (pinError) {
      return res.status(400).json({
        ok: false,
        message: pinError,
        copyright: "© by Mitnick-Connect",
      });
    }

    const currentPasswordIsValid = await verifyPassword(
      currentPassword,
      user.password_hash
    );

    if (!currentPasswordIsValid) {
      return res.status(401).json({
        ok: false,
        message: "La contraseña actual es incorrecta.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const pinResult = await verifySecurityPinOrLock(user, securityPin);

    if (!pinResult.ok) {
      const updatedUser = await getAdminUserById(userId);

      if (pinResult.locked) {
        return res.status(423).json(getBlockedPayload(updatedUser));
      }

      return res.status(401).json({
        ok: false,
        message: pinResult.message,
        attempts: updatedUser?.pin_failed_attempts || 0,
        copyright: "© by Mitnick-Connect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `
      UPDATE admin_users
      SET
        password_hash = ?,
        must_change_password = 0,
        last_password_change_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [newPasswordHash, userId]
    );

    const updatedUser = await getAdminUserById(userId);

    return res.json({
      ok: true,
      message: "Contraseña actualizada correctamente.",
      data: {
        user: mapUser(updatedUser),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyCurrentPin(req, res, next) {
  try {
    const userId = Number(req.user?.id || 0);
    const securityPin = normalizeString(req.body.securityPin);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    const user = await getAdminUserById(userId);

    if (!user || !user.active) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado o inactivo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const businessStatus = getBusinessStatus(user);

    if (!user.business_active || businessStatus === "suspended" || businessStatus === "cancelled") {
      return res.status(403).json(
        getBusinessBlockedPayload({
          id: user.business_id,
          name: user.business_name,
          slug: user.business_slug,
          active: user.business_active,
          status: businessStatus,
          suspended_reason: user.business_suspended_reason,
        })
      );
    }

    if (user.locked_by_pin) {
      return res.status(423).json(getBlockedPayload(user));
    }

    const pinError = validatePin(securityPin);

    if (pinError) {
      return res.status(400).json({
        ok: false,
        message: pinError,
        copyright: "© by Mitnick-Connect",
      });
    }

    const pinResult = await verifySecurityPinOrLock(user, securityPin);

    if (!pinResult.ok) {
      const updatedUser = await getAdminUserById(userId);

      if (pinResult.locked) {
        return res.status(423).json(getBlockedPayload(updatedUser));
      }

      return res.status(401).json({
        ok: false,
        message: pinResult.message,
        attempts: updatedUser?.pin_failed_attempts || 0,
        copyright: "© by Mitnick-Connect",
      });
    }

    return res.json({
      ok: true,
      message: "PIN correcto.",
      data: {
        verified: true,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function masterLogin(req, res, next) {
  try {
    const username = normalizeString(req.body.username || req.body.masterUsername);
    const password = normalizeString(req.body.password || req.body.masterPassword);
    const pin = normalizeString(req.body.pin || req.body.masterPin);

    if (!username || !password || !pin) {
      return res.status(400).json({
        ok: false,
        message:
          "Usuario maestro, contraseña maestra y PIN maestro son obligatorios.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!verifyMasterCredentials({ username, password, pin })) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales maestras incorrectas.",
        copyright: "© by Mitnick-Connect",
      });
    }

    return res.json({
      ok: true,
      message: "Acceso maestro Mitnick validado correctamente.",
      data: {
        masterUser: MASTER_USERNAME,
        canUnlockUsers: true,
      },
      copyright: "© by Mitnick-Connect",
    });
  } catch (error) {
    return next(error);
  }
}

export async function masterUnlockAdminUser(req, res, next) {
  try {
    const masterUsername = normalizeString(
      req.body.masterUsername || req.body.username
    );
    const masterPassword = normalizeString(
      req.body.masterPassword || req.body.password
    );
    const masterPin = normalizeString(req.body.masterPin || req.body.pin);

    const targetEmail = normalizeString(
      req.body.targetEmail || req.body.email
    ).toLowerCase();

    const targetUserId = req.body.targetUserId ? Number(req.body.targetUserId) : 0;
    const businessSlug = normalizeString(
      req.body.businessSlug || req.body.slug
    ).toLowerCase();

    if (!masterUsername || !masterPassword || !masterPin) {
      return res.status(400).json({
        ok: false,
        message:
          "Usuario maestro, contraseña maestra y PIN maestro son obligatorios.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (
      !verifyMasterCredentials({
        username: masterUsername,
        password: masterPassword,
        pin: masterPin,
      })
    ) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales maestras incorrectas.",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!targetEmail && !targetUserId) {
      return res.status(400).json({
        ok: false,
        message:
          "Debes indicar el correo o ID del usuario del comercio a desbloquear.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const targetUser = await getAdminUserForMasterUnlock({
      targetEmail,
      targetUserId,
      businessSlug,
    });

    if (!targetUser) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el usuario del comercio para desbloquear.",
        copyright: "© by Mitnick-Connect",
      });
    }

    const resetPasswordHash = await bcrypt.hash(RESET_PASSWORD, 12);

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
      [resetPasswordHash, targetUser.id]
    );

    const unlockedUser = await getAdminUserById(targetUser.id);

    return res.json({
      ok: true,
      message:
        "Usuario desbloqueado correctamente. La contraseña y el PIN fueron reseteados.",
      data: {
        user: mapMasterUnlockUser(unlockedUser),
        temporaryPassword: RESET_PASSWORD,
        nextStepForCommerce: "change_password",
        instructions:
          "El comercio debe ingresar con la contraseña temporal, cambiar contraseña y crear un nuevo PIN de 6 dígitos.",
      },
      copyright: "© by Mitnick-Connect",
    });
  } catch (error) {
    return next(error);
  }
}

export const login = handleLogin;
export const loginAdmin = handleLogin;

export const getAdminProfile = handleAdminProfile;
export const me = handleAdminProfile;