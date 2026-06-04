const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const STATIC_BASE_URL =
  import.meta.env.VITE_STATIC_BASE_URL || "http://localhost:4000";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "kliente.cl";
const DEFAULT_PUBLIC_SLUG = import.meta.env.VITE_DEFAULT_PUBLIC_SLUG || "demo";

function cleanHostname(hostname = "") {
  return String(hostname)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(":")[0]
    .trim();
}

function getSlugFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    return "";
  }

  return String(slug)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getBusinessSlugFromHostname() {
  const querySlug = getSlugFromQueryString();

  if (querySlug) {
    return querySlug;
  }

  const hostname = cleanHostname(window.location.hostname);

  if (!hostname) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  ) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
    const firstPart = subdomain.split(".")[0];

    return firstPart || DEFAULT_PUBLIC_SLUG;
  }

  return DEFAULT_PUBLIC_SLUG;
}

function getPublicHeaders() {
  return {
    "Content-Type": "application/json",
    "x-business-slug": getBusinessSlugFromHostname(),
  };
}

async function parseResponse(response) {
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Error en la solicitud pública");
  }

  return result;
}

export function buildPublicStaticUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${STATIC_BASE_URL}${path}`;
}

export async function getPublicBusiness() {
  const response = await fetch(`${API_BASE_URL}/public/business`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicContest() {
  const response = await fetch(`${API_BASE_URL}/public/contest`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicPromotions() {
  const response = await fetch(`${API_BASE_URL}/public/promotions`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicRanking() {
  const response = await fetch(`${API_BASE_URL}/public/ranking`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicSocialLinks() {
  const response = await fetch(`${API_BASE_URL}/public/social-links`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicDashboard() {
  const response = await fetch(`${API_BASE_URL}/public/dashboard`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function registerPublicVisit() {
  const visitorKey =
    localStorage.getItem("kliente_public_visitor_key") ||
    crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random()}`;

  localStorage.setItem("kliente_public_visitor_key", visitorKey);

  const response = await fetch(`${API_BASE_URL}/public/visit`, {
    method: "POST",
    headers: getPublicHeaders(),
    body: JSON.stringify({
      visitorKey,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPublicWinner() {
  const response = await fetch(`${API_BASE_URL}/public/winner`, {
    headers: getPublicHeaders(),
  });

  const result = await parseResponse(response);

  return result.data.winner;
}

export async function autoDrawPublicWinner() {
  const response = await fetch(`${API_BASE_URL}/public/winner/auto-draw`, {
    method: "POST",
    headers: getPublicHeaders(),
    body: JSON.stringify({}),
  });

  const result = await parseResponse(response);

  return result.data;
}