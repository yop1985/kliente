const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const STATIC_BASE_URL =
  import.meta.env.VITE_STATIC_BASE_URL || "http://localhost:4000";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "kliente.cl";
const DEFAULT_PUBLIC_SLUG = import.meta.env.VITE_DEFAULT_PUBLIC_SLUG || "demo";

const TOKEN_KEY = "kliente_admin_token";
const USER_KEY = "kliente_admin_user";
const BUSINESS_SLUG_KEY = "kliente_current_business_slug";
const NEXT_STEP_KEY = "kliente_admin_next_step";

function cleanHostname(hostname = "") {
  return String(hostname)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(":")[0]
    .trim();
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSlugFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  return normalizeSlug(slug);
}

function isLocalHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  );
}

export function setCurrentBusinessSlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return;
  }

  localStorage.setItem(BUSINESS_SLUG_KEY, normalizedSlug);
}

export function getCurrentBusinessSlug() {
  return normalizeSlug(localStorage.getItem(BUSINESS_SLUG_KEY));
}

export function getBusinessSlugFromHostname() {
  const querySlug = getSlugFromQueryString();

  if (querySlug) {
    setCurrentBusinessSlug(querySlug);
    return querySlug;
  }

  const hostname = cleanHostname(window.location.hostname);

  if (!hostname) {
    return getCurrentBusinessSlug() || DEFAULT_PUBLIC_SLUG;
  }

  if (isLocalHostname(hostname)) {
    return getCurrentBusinessSlug() || DEFAULT_PUBLIC_SLUG;
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return DEFAULT_PUBLIC_SLUG;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
    const firstPart = normalizeSlug(subdomain.split(".")[0]);

    return firstPart || DEFAULT_PUBLIC_SLUG;
  }

  return getCurrentBusinessSlug() || DEFAULT_PUBLIC_SLUG;
}

function getTenantHeaders() {
  return {
    "x-business-slug": getBusinessSlugFromHostname(),
  };
}

export function saveAdminSession({ token, user, nextStep = "dashboard" }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(NEXT_STEP_KEY, nextStep);

  if (user?.businessSlug) {
    setCurrentBusinessSlug(user.businessSlug);
  }
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getAdminNextStep() {
  return localStorage.getItem(NEXT_STEP_KEY) || "dashboard";
}

export function setAdminNextStep(nextStep) {
  localStorage.setItem(NEXT_STEP_KEY, nextStep || "dashboard");
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(NEXT_STEP_KEY);
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken());
}

function getAuthHeaders() {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Sesión no iniciada");
  }

  return {
    Authorization: `Bearer ${token}`,
    ...getTenantHeaders(),
  };
}

async function parseResponse(response) {
  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    throw new Error("Respuesta inválida del servidor.");
  }

  if (!response.ok || !result.ok) {
    const error = new Error(result.message || "Error en la solicitud");
    error.code = result.code || "";
    error.details = result.details || "";
    error.support = result.support || null;
    error.status = response.status;
    throw error;
  }

  return result;
}

export function buildStaticUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${STATIC_BASE_URL}${path}`;
}

export async function loginAdmin({ email, password }) {
  const businessSlug = getBusinessSlugFromHostname();

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTenantHeaders(),
    },
    body: JSON.stringify({
      email,
      password,
      businessSlug,
    }),
  });

  const result = await parseResponse(response);
  const nextStep = result.data.nextStep || "dashboard";

  saveAdminSession({
    token: result.data.token,
    user: result.data.user,
    nextStep,
  });

  if (result.data.user?.businessSlug) {
    setCurrentBusinessSlug(result.data.user.businessSlug);
  }

  return result.data;
}

export async function getAdminProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);
  const nextStep = result.data.nextStep || "dashboard";

  if (result.data.user?.businessSlug) {
    setCurrentBusinessSlug(result.data.user.businessSlug);
  }

  setAdminNextStep(nextStep);

  return result.data.user;
}

export async function changeInitialPassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const response = await fetch(`${API_BASE_URL}/auth/change-initial-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });

  const result = await parseResponse(response);
  const nextStep = result.data.nextStep || "create_pin";

  setAdminNextStep(nextStep);

  if (result.data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
  }

  return result.data;
}

export async function createInitialPin({ newPin, confirmPin }) {
  const response = await fetch(`${API_BASE_URL}/auth/create-initial-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      newPin,
      confirmPin,
    }),
  });

  const result = await parseResponse(response);
  const nextStep = result.data.nextStep || "dashboard";

  setAdminNextStep(nextStep);

  if (result.data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
  }

  return result.data;
}

export async function changePasswordWithPin({
  currentPassword,
  newPassword,
  confirmPassword,
  securityPin,
}) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password-with-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
      securityPin,
    }),
  });

  const result = await parseResponse(response);

  if (result.data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
  }

  return result.data;
}

export async function verifyPin({ securityPin }) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      securityPin,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getAdminDashboardData() {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);

  if (result.data.business?.slug) {
    setCurrentBusinessSlug(result.data.business.slug);
  }

  return result.data;
}

export async function updateBusiness(business) {
  const response = await fetch(`${API_BASE_URL}/admin/business`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(business),
  });

  const result = await parseResponse(response);

  if (result.data?.slug) {
    setCurrentBusinessSlug(result.data.slug);
  }

  return result.data;
}

export async function uploadBusinessLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${API_BASE_URL}/admin/business/logo`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function updateContest(contest) {
  const response = await fetch(`${API_BASE_URL}/admin/contest`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(contest),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function createNextContest(contest) {
  const response = await fetch(`${API_BASE_URL}/admin/contest/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(contest),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getContestHistory() {
  const response = await fetch(`${API_BASE_URL}/admin/contest-history`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function updatePromotions(promotions) {
  const response = await fetch(`${API_BASE_URL}/admin/promotions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      promotions,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function updateSocialLinks(socialLinks) {
  const response = await fetch(`${API_BASE_URL}/admin/social-links`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      socialLinks,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getCustomers(search = "") {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  const url = query
    ? `${API_BASE_URL}/admin/customers?${query}`
    : `${API_BASE_URL}/admin/customers`;

  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function createCustomer(customer) {
  const response = await fetch(`${API_BASE_URL}/admin/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(customer),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function updateCustomer(customerId, customer) {
  const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(customer),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function registerPurchase(purchase) {
  const response = await fetch(`${API_BASE_URL}/admin/purchases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(purchase),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getPurchases({ customerId = "", mode = "current" } = {}) {
  const params = new URLSearchParams();

  if (customerId) {
    params.set("customerId", customerId);
  }

  if (mode) {
    params.set("mode", mode);
  }

  const query = params.toString();
  const url = query
    ? `${API_BASE_URL}/admin/purchases?${query}`
    : `${API_BASE_URL}/admin/purchases`;

  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getAdminWinner() {
  const response = await fetch(`${API_BASE_URL}/admin/winner`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result = await parseResponse(response);

  return result.data.winner;
}