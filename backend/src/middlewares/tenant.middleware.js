import { pool } from "../config/database.js";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "kliente.cl";
const DEFAULT_PUBLIC_SLUG = process.env.DEFAULT_PUBLIC_SLUG || "demo";

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

function getSlugFromRequest(req) {
  const bodySlug =
    typeof req.body?.businessSlug === "string"
      ? req.body.businessSlug.trim()
      : "";

  const querySlug =
    typeof req.query?.slug === "string" ? req.query.slug.trim() : "";

  const headerSlug =
    typeof req.headers["x-business-slug"] === "string"
      ? req.headers["x-business-slug"].trim()
      : "";

  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "";

  return bodySlug || querySlug || headerSlug || getSlugFromHostname(hostHeader);
}

function buildBusinessBlockedResponse(business) {
  if (business.status === "cancelled") {
    return {
      status: 403,
      payload: {
        ok: false,
        code: "BUSINESS_CANCELLED",
        message: "Servicio cancelado. Contactar a Mitnick Connect.",
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          status: business.status,
          suspendedReason: business.suspended_reason || "",
        },
        support: {
          email: "mitnickconnect@gmail.com",
          whatsapp: "+56 9 4969 1796",
        },
        copyright: "© by Mitnick-Connect",
      },
    };
  }

  return {
    status: 403,
    payload: {
      ok: false,
      code: "BUSINESS_SUSPENDED",
      message: "Servicio suspendido. Contactar a Mitnick Connect.",
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        status: business.status,
        suspendedReason:
          business.suspended_reason || "Servicio suspendido por no pago.",
      },
      support: {
        email: "mitnickconnect@gmail.com",
        whatsapp: "+56 9 4969 1796",
      },
      copyright: "© by Mitnick-Connect",
    },
  };
}

export async function requireTenant(req, res, next) {
  try {
    const requestedSlug = getSlugFromRequest(req);

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Sesión no iniciada",
        copyright: "© by Mitnick-Connect",
      });
    }

    const tokenBusinessId = Number(req.user.businessId || 0);

    if (!tokenBusinessId) {
      return res.status(403).json({
        ok: false,
        message: "El usuario no tiene comercio asignado",
        copyright: "© by Mitnick-Connect",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        active,
        status,
        suspended_reason
      FROM businesses
      WHERE id = ?
      LIMIT 1
      `,
      [tokenBusinessId]
    );

    if (!rows.length) {
      return res.status(403).json({
        ok: false,
        message: "Comercio no encontrado",
        copyright: "© by Mitnick-Connect",
      });
    }

    const business = rows[0];
    const businessStatus = business.status || (business.active ? "active" : "suspended");

    if (!business.active || businessStatus === "suspended" || businessStatus === "cancelled") {
      const blockedResponse = buildBusinessBlockedResponse({
        ...business,
        status: businessStatus,
      });

      return res.status(blockedResponse.status).json(blockedResponse.payload);
    }

    if (requestedSlug && business.slug && requestedSlug !== business.slug) {
      return res.status(403).json({
        ok: false,
        message: "El usuario no pertenece a este comercio",
        expectedSlug: business.slug,
        requestedSlug,
        copyright: "© by Mitnick-Connect",
      });
    }

    req.businessId = business.id;
    req.businessSlug = business.slug;
    req.businessName = business.name;
    req.businessStatus = businessStatus;

    return next();
  } catch (error) {
    return next(error);
  }
}