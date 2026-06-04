const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const MASTER_SESSION_KEY = "kliente_master_session";

function saveMasterSession(session) {
  localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));
}

export function getMasterSession() {
  const rawSession = localStorage.getItem(MASTER_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch (error) {
    localStorage.removeItem(MASTER_SESSION_KEY);
    return null;
  }
}

export function isMasterLoggedIn() {
  const session = getMasterSession();

  return Boolean(
    session?.username &&
      session?.password &&
      session?.pin &&
      session?.canUnlockUsers
  );
}

export function clearMasterSession() {
  localStorage.removeItem(MASTER_SESSION_KEY);
}

function getMasterCredentialsPayload() {
  const session = getMasterSession();

  if (!session) {
    throw new Error("Sesión maestra no iniciada.");
  }

  return {
    masterUsername: session.username,
    masterPassword: session.password,
    masterPin: session.pin,
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
    const requestError = new Error(result.message || "Error en la solicitud.");
    requestError.status = response.status;
    requestError.code = result.code || "";
    requestError.details = result.details || "";
    throw requestError;
  }

  return result;
}

export async function loginMaster({ username, password, pin }) {
  const response = await fetch(`${API_BASE_URL}/auth/master/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      pin,
    }),
  });

  const result = await parseResponse(response);

  saveMasterSession({
    username,
    password,
    pin,
    canUnlockUsers: Boolean(result.data?.canUnlockUsers),
    loggedAt: new Date().toISOString(),
  });

  return result.data;
}

export async function getMasterSummary() {
  const response = await fetch(`${API_BASE_URL}/master/summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(getMasterCredentialsPayload()),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function getMasterBusinesses({ search = "", status = "all" } = {}) {
  const response = await fetch(`${API_BASE_URL}/master/businesses/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...getMasterCredentialsPayload(),
      search,
      status,
    }),
  });

  const result = await parseResponse(response);

  return result.data || [];
}

export async function createMasterBusiness(payload) {
  const response = await fetch(`${API_BASE_URL}/master/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...getMasterCredentialsPayload(),
      ...payload,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}

export async function registerMasterBusinessPayment({
  businessId,
  planName,
  activatedAt,
  paidUntil,
  paymentNote,
}) {
  const response = await fetch(
    `${API_BASE_URL}/master/businesses/${businessId}/payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...getMasterCredentialsPayload(),
        planName,
        activatedAt,
        paidUntil,
        paymentNote,
      }),
    }
  );

  const result = await parseResponse(response);

  return result.data;
}

export async function suspendMasterBusiness({ businessId, reason }) {
  const response = await fetch(
    `${API_BASE_URL}/master/businesses/${businessId}/suspend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...getMasterCredentialsPayload(),
        reason,
      }),
    }
  );

  const result = await parseResponse(response);

  return result.data;
}

export async function reactivateMasterBusiness({
  businessId,
  planName,
  activatedAt,
  paidUntil,
}) {
  const response = await fetch(
    `${API_BASE_URL}/master/businesses/${businessId}/reactivate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...getMasterCredentialsPayload(),
        planName,
        activatedAt,
        paidUntil,
      }),
    }
  );

  const result = await parseResponse(response);

  return result.data;
}

export async function cancelMasterBusiness({ businessId, reason }) {
  const response = await fetch(
    `${API_BASE_URL}/master/businesses/${businessId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...getMasterCredentialsPayload(),
        reason,
      }),
    }
  );

  const result = await parseResponse(response);

  return result.data;
}

export async function unlockAdminUser({
  businessSlug,
  targetEmail,
  targetUserId = "",
  resetPassword = "",
}) {
  const response = await fetch(`${API_BASE_URL}/master/users/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...getMasterCredentialsPayload(),
      businessSlug,
      targetEmail,
      targetUserId,
      resetPassword,
    }),
  });

  const result = await parseResponse(response);

  return result.data;
}