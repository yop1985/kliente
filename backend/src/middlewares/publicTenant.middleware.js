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

export async function resolvePublicTenant(req, res, next) {
  try {
    const querySlug =
      typeof req.query.slug === "string" ? req.query.slug.trim() : "";

    const headerSlug =
      typeof req.headers["x-business-slug"] === "string"
        ? req.headers["x-business-slug"].trim()
        : "";

    const hostHeader =
      req.headers["x-forwarded-host"] || req.headers.host || "";

    const detectedSlug =
      querySlug || headerSlug || getSlugFromHostname(hostHeader);

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug
      FROM businesses
      WHERE slug = ?
        AND active = 1
      LIMIT 1
      `,
      [detectedSlug]
    );

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        message: `No se encontró comercio para el subdominio: ${detectedSlug}`,
        slug: detectedSlug,
        copyright: "© by Mitnick-Connect",
      });
    }

    req.businessId = rows[0].id;
    req.businessSlug = rows[0].slug;
    req.businessName = rows[0].name;

    return next();
  } catch (error) {
    return next(error);
  }
}