import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  clearMasterSession,
  createMasterBusiness,
  getMasterBusinesses,
  getMasterSession,
  getMasterSummary,
  reactivateMasterBusiness,
  registerMasterBusinessPayment,
  suspendMasterBusiness,
  unlockAdminUser,
} from "../../services/masterApi";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "kliente.cl";

function getTodayDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const emptyBusinessForm = {
  name: "",
  slug: "",
  rut: "",
  address: "",
  phone: "",
  email: "",
  planName: "Mensual",
  paymentStatus: "paid",
  activatedAt: getTodayDate(),
  paidUntil: "",
  adminName: "Administrador",
  adminEmail: "",
  adminPassword: "",
};

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

function getPlanMonths(planName) {
  if (planName === "Semestral") return 6;
  if (planName === "Anual") return 12;
  return 1;
}

function addMonthsToDate(dateValue, monthsToAdd) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setMonth(date.getMonth() + monthsToAdd);

  const outputYear = date.getFullYear();
  const outputMonth = String(date.getMonth() + 1).padStart(2, "0");
  const outputDay = String(date.getDate()).padStart(2, "0");

  return `${outputYear}-${outputMonth}-${outputDay}`;
}

function calculatePaidUntil(activatedAt, planName) {
  if (!activatedAt) {
    return "";
  }

  return addMonthsToDate(activatedAt, getPlanMonths(planName));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-CL");
}

function getStatusText(status) {
  if (status === "active") return "Activo";
  if (status === "suspended") return "Suspendido";
  if (status === "cancelled") return "Cancelado";
  return status || "-";
}

function getPublicUrl(slug) {
  if (!slug) {
    return "";
  }

  return `https://${slug}.${ROOT_DOMAIN}`;
}

function getLocalPaymentAlert(paidUntil) {
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

  const daysLeft = Math.round(
    (dueDate.getTime() - today.getTime()) / 86400000
  );

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

function createTemporaryPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#";
  const all = `${letters}${numbers}${symbols}`;

  let password = "Kl";

  for (let index = 0; index < 6; index += 1) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  password += numbers[Math.floor(Math.random() * numbers.length)];

  return password;
}

export default function MasterDashboardPage() {
  const navigate = useNavigate();
  const session = getMasterSession();

  const [activeSection, setActiveSection] = useState("businesses");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState("");

  const [summary, setSummary] = useState({
    businesses: {
      total: 0,
      active: 0,
      suspended: 0,
      cancelled: 0,
      dueToday: 0,
      dueTomorrow: 0,
      overdue: 0,
    },
    users: {
      total: 0,
      locked: 0,
    },
  });

  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [businessForm, setBusinessForm] = useState(() => ({
    ...emptyBusinessForm,
    adminPassword: createTemporaryPassword(),
    paidUntil: calculatePaidUntil(
      emptyBusinessForm.activatedAt,
      emptyBusinessForm.planName
    ),
  }));

  const [unlockBusinessSlug, setUnlockBusinessSlug] = useState("demo");
  const [unlockTargetEmail, setUnlockTargetEmail] =
    useState("admin@kliente.cl");
  const [unlockResetPassword, setUnlockResetPassword] = useState(() =>
    createTemporaryPassword()
  );
  const [loadingUnlock, setLoadingUnlock] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredBusinesses = useMemo(() => {
    return businesses;
  }, [businesses]);

  useEffect(() => {
    loadMasterData();
  }, []);

  async function loadMasterData() {
    setLoadingInitial(true);
    setErrorMessage("");

    try {
      const [summaryData, businessList] = await Promise.all([
        getMasterSummary(),
        getMasterBusinesses({ search, status: statusFilter }),
      ]);

      setSummary(summaryData);
      setBusinesses(businessList);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo cargar el panel maestro.");
    } finally {
      setLoadingInitial(false);
    }
  }

  async function reloadBusinesses() {
    setLoadingBusinesses(true);
    setErrorMessage("");

    try {
      const [summaryData, businessList] = await Promise.all([
        getMasterSummary(),
        getMasterBusinesses({ search, status: statusFilter }),
      ]);

      setSummary(summaryData);
      setBusinesses(businessList);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo actualizar comercios.");
    } finally {
      setLoadingBusinesses(false);
    }
  }

  function showSuccess(message) {
    setSuccessMessage(message);
    setErrorMessage("");

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 6500);
  }

  function showError(message) {
    setErrorMessage(message);
    setSuccessMessage("");

    window.setTimeout(() => {
      setErrorMessage("");
    }, 6500);
  }

  function handleLogout() {
    clearMasterSession();
    navigate("/mitnick/login", { replace: true });
  }

  function handleBusinessFormChange(field, value) {
    setBusinessForm((current) => {
      if (field === "name") {
        const slug = normalizeSlug(value);

        return {
          ...current,
          name: value,
          slug,
        };
      }

      if (field === "slug") {
        return {
          ...current,
          slug: normalizeSlug(value),
        };
      }

      if (field === "planName") {
        return {
          ...current,
          planName: value,
          paidUntil: calculatePaidUntil(current.activatedAt, value),
        };
      }

      if (field === "activatedAt") {
        return {
          ...current,
          activatedAt: value,
          paidUntil: calculatePaidUntil(value, current.planName),
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function handleGenerateBusinessPassword() {
    setBusinessForm((current) => ({
      ...current,
      adminPassword: createTemporaryPassword(),
    }));
  }

  function handleGenerateUnlockPassword() {
    setUnlockResetPassword(createTemporaryPassword());
  }

  async function handleSearchBusinesses(event) {
    event.preventDefault();
    await reloadBusinesses();
  }

  async function handleCreateBusiness(event) {
    event.preventDefault();

    if (savingBusiness) {
      return;
    }

    const payload = {
      name: businessForm.name.trim(),
      slug: normalizeSlug(businessForm.slug),
      rut: businessForm.rut.trim(),
      address: businessForm.address.trim(),
      phone: businessForm.phone.trim(),
      email: businessForm.email.trim(),
      planName: businessForm.planName,
      paymentStatus: businessForm.paymentStatus,
      activatedAt: businessForm.activatedAt,
      paidUntil: businessForm.paidUntil,
      adminName: businessForm.adminName.trim(),
      adminEmail: businessForm.adminEmail.trim().toLowerCase(),
      adminPassword: businessForm.adminPassword.trim(),
    };

    if (!payload.name || !payload.slug || !payload.adminEmail) {
      showError("Debes ingresar nombre, subdominio y correo administrador.");
      return;
    }

    if (!payload.activatedAt) {
      showError("Debes seleccionar la fecha de activación.");
      return;
    }

    if (!payload.adminPassword || payload.adminPassword.length < 6) {
      showError("Debes crear una contraseña provisoria de mínimo 6 caracteres.");
      return;
    }

    setSavingBusiness(true);

    try {
      const result = await createMasterBusiness(payload);

      const nextDefault = {
        ...emptyBusinessForm,
        activatedAt: getTodayDate(),
        adminPassword: createTemporaryPassword(),
      };

      setBusinessForm({
        ...nextDefault,
        paidUntil: calculatePaidUntil(
          nextDefault.activatedAt,
          nextDefault.planName
        ),
      });

      showSuccess(
        `Comercio creado correctamente. Link público: ${
          result?.business?.publicUrl || getPublicUrl(payload.slug)
        }. Usuario inicial: ${payload.adminEmail}. Contraseña provisoria: ${
          result?.admin?.temporaryPassword || payload.adminPassword
        }. Próximo pago: ${formatDate(result?.business?.paidUntil)}.`
      );

      await reloadBusinesses();
      setActiveSection("businesses");
    } catch (error) {
      showError(error.message || "No se pudo crear el comercio.");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleRegisterPayment(business) {
    const planName = window.prompt(
      `Plan pagado por ${business.name}: Mensual, Semestral o Anual`,
      business.planName || "Mensual"
    );

    if (planName === null) {
      return;
    }

    const cleanPlanName = planName.trim();

    if (!["Mensual", "Semestral", "Anual"].includes(cleanPlanName)) {
      showError("El plan debe ser Mensual, Semestral o Anual.");
      return;
    }

    const activatedAt = window.prompt(
      `Fecha de pago/renovación para ${business.name} en formato YYYY-MM-DD:`,
      getTodayDate()
    );

    if (activatedAt === null) {
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(activatedAt.trim())) {
      showError("La fecha de renovación debe tener formato YYYY-MM-DD.");
      return;
    }

    const paidUntil = calculatePaidUntil(activatedAt.trim(), cleanPlanName);

    const paymentNote = window.prompt(
      `Nota del pago para ${business.name}:`,
      `Pago ${cleanPlanName} registrado desde panel maestro.`
    );

    if (paymentNote === null) {
      return;
    }

    setLoadingActionId(`payment-${business.id}`);

    try {
      const result = await registerMasterBusinessPayment({
        businessId: business.id,
        planName: cleanPlanName,
        activatedAt: activatedAt.trim(),
        paidUntil,
        paymentNote,
      });

      showSuccess(
        `Pago registrado para ${business.name}. Plan: ${
          result?.payment?.planName || cleanPlanName
        }. Próximo pago: ${formatDate(result?.payment?.paidUntil || paidUntil)}.`
      );

      await reloadBusinesses();
    } catch (error) {
      showError(error.message || "No se pudo registrar el pago.");
    } finally {
      setLoadingActionId("");
    }
  }

  async function handleSuspendBusiness(business) {
    const reason = window.prompt(
      `Motivo de suspensión para ${business.name}:`,
      "Suspendido por no pago."
    );

    if (reason === null) {
      return;
    }

    setLoadingActionId(`suspend-${business.id}`);

    try {
      await suspendMasterBusiness({
        businessId: business.id,
        reason: reason || "Suspendido por no pago.",
      });

      showSuccess(`Comercio ${business.name} suspendido correctamente.`);
      await reloadBusinesses();
    } catch (error) {
      showError(error.message || "No se pudo suspender el comercio.");
    } finally {
      setLoadingActionId("");
    }
  }

  async function handleReactivateBusiness(business) {
    const planName = window.prompt(
      `Plan para reactivar ${business.name}: Mensual, Semestral o Anual`,
      business.planName || "Mensual"
    );

    if (planName === null) {
      return;
    }

    const activatedAt = window.prompt(
      `Fecha de activación para ${business.name} en formato YYYY-MM-DD:`,
      getTodayDate()
    );

    if (activatedAt === null) {
      return;
    }

    const paidUntil = calculatePaidUntil(activatedAt, planName);

    setLoadingActionId(`reactivate-${business.id}`);

    try {
      await reactivateMasterBusiness({
        businessId: business.id,
        planName,
        activatedAt,
        paidUntil,
      });

      showSuccess(
        `Comercio ${business.name} reactivado correctamente. Próximo pago: ${formatDate(
          paidUntil
        )}.`
      );

      await reloadBusinesses();
    } catch (error) {
      showError(error.message || "No se pudo reactivar el comercio.");
    } finally {
      setLoadingActionId("");
    }
  }

  async function handleUnlockUser(event) {
    event.preventDefault();

    if (loadingUnlock) {
      return;
    }

    const cleanSlug = normalizeSlug(unlockBusinessSlug);
    const cleanEmail = unlockTargetEmail.trim().toLowerCase();
    const cleanPassword = unlockResetPassword.trim();

    if (!cleanSlug || !cleanEmail) {
      showError("Debes ingresar subdominio y correo del usuario.");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      showError(
        "Debes ingresar una contraseña provisoria de mínimo 6 caracteres."
      );
      return;
    }

    setLoadingUnlock(true);

    try {
      const result = await unlockAdminUser({
        businessSlug: cleanSlug,
        targetEmail: cleanEmail,
        resetPassword: cleanPassword,
      });

      showSuccess(
        `Usuario desbloqueado correctamente. Usuario: ${cleanEmail}. Contraseña provisoria: ${
          result?.temporaryPassword || cleanPassword
        }. El comercio deberá cambiar contraseña y crear nuevo PIN.`
      );

      setUnlockResetPassword(createTemporaryPassword());
      await reloadBusinesses();
    } catch (error) {
      showError(error.message || "No se pudo desbloquear el usuario.");
    } finally {
      setLoadingUnlock(false);
    }
  }

  function fillUnlockFromBusiness(business) {
    setUnlockBusinessSlug(business.slug || "");
    setUnlockTargetEmail(business.email || "");
    setUnlockResetPassword(createTemporaryPassword());
    setActiveSection("unlock");
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <span style={styles.kicker}>Panel maestro</span>
          <h1 style={styles.title}>Mitnick Connect</h1>
          <p style={styles.subtitle}>
            Sesión activa: <strong>{session?.username || "mitnick"}</strong>
          </p>
        </div>

        <button style={styles.logoutButton} type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {loadingInitial && (
        <div style={{ ...styles.alert, ...styles.infoAlert }}>
          Cargando gestión de comercios...
        </div>
      )}

      {successMessage && (
        <div style={{ ...styles.alert, ...styles.successAlert }}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ ...styles.alert, ...styles.errorAlert }}>
          {errorMessage}
        </div>
      )}

      <section style={styles.hero}>
        <div>
          <span style={styles.kicker}>Administración central</span>
          <h2 style={styles.heroTitle}>Gestión de comercios KLIENTE</h2>
          <p style={styles.heroText}>
            Crea comercios, registra pagos, controla subdominios, suspende por
            no pago, reactiva clientes y desbloquea usuarios bloqueados por PIN.
          </p>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <article style={styles.statCard}>
          <span>Total comercios</span>
          <strong>{summary.businesses.total}</strong>
          <small>Todos los negocios creados.</small>
        </article>

        <article style={styles.statCard}>
          <span>Activos</span>
          <strong>{summary.businesses.active}</strong>
          <small>Comercios funcionando.</small>
        </article>

        <article style={styles.statCard}>
          <span>Pago mañana</span>
          <strong>{summary.businesses.dueTomorrow}</strong>
          <small>Clientes que deben pagar mañana.</small>
        </article>

        <article style={styles.statCard}>
          <span>Pago hoy / vencidos</span>
          <strong>
            {summary.businesses.dueToday + summary.businesses.overdue}
          </strong>
          <small>Revisar y cobrar.</small>
        </article>

        <article style={styles.statCard}>
          <span>Usuarios bloqueados</span>
          <strong>{summary.users.locked}</strong>
          <small>Bloqueados por PIN incorrecto.</small>
        </article>
      </section>

      <nav style={styles.tabs}>
        <button
          type="button"
          style={
            activeSection === "businesses"
              ? { ...styles.tab, ...styles.activeTab }
              : styles.tab
          }
          onClick={() => setActiveSection("businesses")}
        >
          Comercios
        </button>

        <button
          type="button"
          style={
            activeSection === "create"
              ? { ...styles.tab, ...styles.activeTab }
              : styles.tab
          }
          onClick={() => setActiveSection("create")}
        >
          Crear comercio
        </button>

        <button
          type="button"
          style={
            activeSection === "unlock"
              ? { ...styles.tab, ...styles.activeTab }
              : styles.tab
          }
          onClick={() => setActiveSection("unlock")}
        >
          Desbloquear usuario
        </button>
      </nav>

      {activeSection === "businesses" && (
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <span style={styles.cardKicker}>Comercios</span>
              <h3 style={styles.cardTitle}>Listado de negocios</h3>
              <p style={styles.cardText}>
                Busca por nombre, subdominio, RUT, teléfono o correo.
              </p>
            </div>
          </div>

          <form style={styles.searchRow} onSubmit={handleSearchBusinesses}>
            <input
              style={styles.input}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar comercio..."
            />

            <select
              style={styles.input}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="cancelled">Cancelados</option>
            </select>

            <button style={styles.primaryButton} type="submit">
              {loadingBusinesses ? "Buscando..." : "Buscar"}
            </button>
          </form>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Comercio</th>
                  <th style={styles.th}>Subdominio</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Activación</th>
                  <th style={styles.th}>Próximo pago</th>
                  <th style={styles.th}>Alerta</th>
                  <th style={styles.th}>Bloqueados</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredBusinesses.map((business) => {
                  const alert =
                    business.paymentAlert ||
                    getLocalPaymentAlert(business.paidUntil);

                  return (
                    <tr key={business.id}>
                      <td style={styles.td}>
                        <strong>{business.name}</strong>
                        <br />
                        <small>{business.email || "-"}</small>
                      </td>

                      <td style={styles.td}>
                        <strong>{business.slug}</strong>
                        <br />
                        <a
                          href={
                            business.publicUrl || getPublicUrl(business.slug)
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Ver público
                        </a>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(business.status === "active"
                              ? styles.badgeSuccess
                              : business.status === "suspended"
                                ? styles.badgeWarning
                                : styles.badgeDanger),
                          }}
                        >
                          {getStatusText(business.status)}
                        </span>
                      </td>

                      <td style={styles.td}>{business.planName || "-"}</td>

                      <td style={styles.td}>
                        {formatDate(business.activatedAt)}
                      </td>

                      <td style={styles.td}>
                        {formatDate(business.paidUntil)}
                      </td>

                      <td style={styles.td}>
                        {alert.type !== "none" && (
                          <span
                            style={{
                              ...styles.badge,
                              ...(alert.type === "overdue" ||
                              alert.type === "today"
                                ? styles.badgeDanger
                                : alert.type === "tomorrow"
                                  ? styles.badgeWarning
                                  : styles.badgeSuccess),
                            }}
                          >
                            {alert.message}
                          </span>
                        )}
                      </td>

                      <td style={styles.td}>{business.lockedUsersCount}</td>

                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button
                            type="button"
                            style={styles.smallPrimaryButton}
                            disabled={loadingActionId === `payment-${business.id}`}
                            onClick={() => handleRegisterPayment(business)}
                          >
                            {loadingActionId === `payment-${business.id}`
                              ? "Registrando..."
                              : "Registrar pago"}
                          </button>

                          <button
                            type="button"
                            style={styles.smallButton}
                            onClick={() => fillUnlockFromBusiness(business)}
                          >
                            Desbloquear
                          </button>

                          {business.status === "active" ? (
                            <button
                              type="button"
                              style={styles.smallDangerButton}
                              disabled={
                                loadingActionId === `suspend-${business.id}`
                              }
                              onClick={() => handleSuspendBusiness(business)}
                            >
                              {loadingActionId === `suspend-${business.id}`
                                ? "Suspendiendo..."
                                : "Suspender"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.smallSuccessButton}
                              disabled={
                                loadingActionId === `reactivate-${business.id}`
                              }
                              onClick={() => handleReactivateBusiness(business)}
                            >
                              {loadingActionId === `reactivate-${business.id}`
                                ? "Reactivando..."
                                : "Reactivar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredBusinesses.length && (
                  <tr>
                    <td style={styles.td} colSpan="9">
                      No hay comercios para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeSection === "create" && (
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <span style={styles.cardKicker}>Nuevo comercio</span>
              <h3 style={styles.cardTitle}>Crear comercio y administrador</h3>
              <p style={styles.cardText}>
                El sistema creará el comercio, el subdominio y el usuario
                administrador con la contraseña provisoria que tú definas.
              </p>
            </div>
          </div>

          <form style={styles.formGrid} onSubmit={handleCreateBusiness}>
            <label style={styles.label}>
              Nombre del comercio
              <input
                style={styles.input}
                type="text"
                value={businessForm.name}
                onChange={(event) =>
                  handleBusinessFormChange("name", event.target.value)
                }
                required
              />
            </label>

            <label style={styles.label}>
              Subdominio / slug automático
              <input
                style={styles.input}
                type="text"
                value={businessForm.slug}
                readOnly
                placeholder="se-crea-automatico"
              />
              <small style={styles.smallText}>
                Link público: {getPublicUrl(businessForm.slug)}
              </small>
            </label>

            <label style={styles.label}>
              RUT
              <input
                style={styles.input}
                type="text"
                value={businessForm.rut}
                onChange={(event) =>
                  handleBusinessFormChange("rut", event.target.value)
                }
                placeholder="76.000.000-0"
              />
            </label>

            <label style={styles.label}>
              Teléfono
              <input
                style={styles.input}
                type="text"
                value={businessForm.phone}
                onChange={(event) =>
                  handleBusinessFormChange("phone", event.target.value)
                }
                placeholder="+56912345678"
              />
            </label>

            <label style={styles.label}>
              Correo comercio
              <input
                style={styles.input}
                type="email"
                value={businessForm.email}
                onChange={(event) =>
                  handleBusinessFormChange("email", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Plan
              <select
                style={styles.input}
                value={businessForm.planName}
                onChange={(event) =>
                  handleBusinessFormChange("planName", event.target.value)
                }
              >
                <option value="Mensual">Mensual</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </label>

            <label style={styles.label}>
              Fecha de activación
              <input
                style={styles.input}
                type="date"
                value={businessForm.activatedAt}
                onChange={(event) =>
                  handleBusinessFormChange("activatedAt", event.target.value)
                }
                required
              />
            </label>

            <label style={styles.label}>
              Próximo pago automático
              <input
                style={styles.input}
                type="date"
                value={businessForm.paidUntil}
                readOnly
              />
              <small style={styles.smallText}>
                Se calcula según el plan seleccionado.
              </small>
            </label>

            <label style={styles.label}>
              Estado de pago
              <select
                style={styles.input}
                value={businessForm.paymentStatus}
                onChange={(event) =>
                  handleBusinessFormChange("paymentStatus", event.target.value)
                }
              >
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="overdue">Vencido</option>
              </select>
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Dirección
              <input
                style={styles.input}
                type="text"
                value={businessForm.address}
                onChange={(event) =>
                  handleBusinessFormChange("address", event.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Nombre administrador
              <input
                style={styles.input}
                type="text"
                value={businessForm.adminName}
                onChange={(event) =>
                  handleBusinessFormChange("adminName", event.target.value)
                }
                required
              />
            </label>

            <label style={styles.label}>
              Correo administrador / usuario inicial
              <input
                style={styles.input}
                type="email"
                value={businessForm.adminEmail}
                onChange={(event) =>
                  handleBusinessFormChange("adminEmail", event.target.value)
                }
                required
              />
              <small style={styles.smallText}>
                Este correo será el usuario inicial del comercio.
              </small>
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Contraseña provisoria definida por Mitnick
              <div style={styles.passwordRow}>
                <input
                  style={styles.input}
                  type="text"
                  value={businessForm.adminPassword}
                  onChange={(event) =>
                    handleBusinessFormChange(
                      "adminPassword",
                      event.target.value
                    )
                  }
                  required
                />

                <button
                  style={styles.secondaryButton}
                  type="button"
                  onClick={handleGenerateBusinessPassword}
                >
                  Generar segura
                </button>
              </div>
              <small style={styles.smallText}>
                El comercio deberá cambiar esta contraseña y crear un PIN al
                primer ingreso.
              </small>
            </label>

            <button
              style={{ ...styles.primaryButton, gridColumn: "1 / -1" }}
              type="submit"
              disabled={savingBusiness}
            >
              {savingBusiness ? "Creando comercio..." : "Crear comercio"}
            </button>
          </form>
        </section>
      )}

      {activeSection === "unlock" && (
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <span style={styles.cardKicker}>Seguridad</span>
              <h3 style={styles.cardTitle}>Desbloquear usuario bloqueado</h3>
              <p style={styles.cardText}>
                Usa esta opción cuando el comercio quede bloqueado por ingresar
                mal el PIN 3 veces. El sistema reseteará contraseña y PIN usando
                la contraseña provisoria que tú definas.
              </p>
            </div>
          </div>

          <form style={styles.unlockForm} onSubmit={handleUnlockUser}>
            <label style={styles.label}>
              Subdominio / slug del negocio
              <input
                style={styles.input}
                type="text"
                value={unlockBusinessSlug}
                onChange={(event) => setUnlockBusinessSlug(event.target.value)}
                placeholder="demo"
                disabled={loadingUnlock}
              />
            </label>

            <label style={styles.label}>
              Correo administrador del comercio
              <input
                style={styles.input}
                type="email"
                value={unlockTargetEmail}
                onChange={(event) => setUnlockTargetEmail(event.target.value)}
                placeholder="admin@kliente.cl"
                disabled={loadingUnlock}
              />
            </label>

            <label style={styles.label}>
              Nueva contraseña provisoria
              <div style={styles.passwordRow}>
                <input
                  style={styles.input}
                  type="text"
                  value={unlockResetPassword}
                  onChange={(event) => setUnlockResetPassword(event.target.value)}
                  disabled={loadingUnlock}
                  required
                />

                <button
                  style={styles.secondaryButton}
                  type="button"
                  onClick={handleGenerateUnlockPassword}
                  disabled={loadingUnlock}
                >
                  Generar segura
                </button>
              </div>
              <small style={styles.smallText}>
                El comercio será obligado a cambiar esta contraseña y crear un
                nuevo PIN.
              </small>
            </label>

            <button
              style={styles.primaryButton}
              type="submit"
              disabled={loadingUnlock}
            >
              {loadingUnlock ? "Desbloqueando..." : "Desbloquear y resetear"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    padding: 28,
    background:
      "radial-gradient(circle at top left, rgba(20, 184, 166, 0.22), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 52%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    marginBottom: 22,
  },

  kicker: {
    display: "block",
    color: "#5eead4",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.78rem",
    fontWeight: 1000,
    marginBottom: 5,
  },

  title: {
    margin: 0,
    fontSize: "2.2rem",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontWeight: 1000,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.78)",
    fontWeight: 800,
  },

  logoutButton: {
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(15, 23, 42, 0.72)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  alert: {
    padding: "14px 16px",
    borderRadius: 18,
    marginBottom: 18,
    fontWeight: 900,
    lineHeight: 1.45,
  },

  infoAlert: {
    background: "rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(96, 165, 250, 0.45)",
    color: "#dbeafe",
  },

  successAlert: {
    background: "rgba(34, 197, 94, 0.18)",
    border: "1px solid rgba(74, 222, 128, 0.45)",
    color: "#dcfce7",
  },

  errorAlert: {
    background: "rgba(239, 68, 68, 0.20)",
    border: "1px solid rgba(248, 113, 113, 0.45)",
    color: "#fecaca",
  },

  hero: {
    borderRadius: 30,
    padding: 28,
    marginBottom: 22,
    background:
      "linear-gradient(145deg, rgba(8, 47, 73, 0.62), rgba(15, 23, 42, 0.92))",
    border: "1px solid rgba(94, 234, 212, 0.24)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
  },

  heroTitle: {
    margin: 0,
    fontSize: "2rem",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    fontWeight: 1000,
  },

  heroText: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.5,
    fontWeight: 750,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 16,
    marginBottom: 22,
  },

  statCard: {
    borderRadius: 24,
    padding: 20,
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.92))",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
  },

  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },

  tab: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(15, 23, 42, 0.66)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  activeTab: {
    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
    color: "#042f2e",
    borderColor: "transparent",
  },

  card: {
    borderRadius: 28,
    padding: 24,
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
  },

  cardHeader: {
    marginBottom: 18,
  },

  cardKicker: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(20, 184, 166, 0.14)",
    color: "#99f6e4",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.72rem",
    fontWeight: 1000,
    marginBottom: 10,
  },

  cardTitle: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 1000,
  },

  cardText: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.45,
    fontWeight: 750,
  },

  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 160px",
    gap: 12,
    marginBottom: 18,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  unlockForm: {
    display: "grid",
    gap: 16,
    maxWidth: 720,
  },

  label: {
    display: "grid",
    gap: 8,
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "0.95rem",
    fontWeight: 900,
  },

  input: {
    width: "100%",
    border: "1px solid rgba(148, 163, 184, 0.38)",
    borderRadius: 18,
    padding: "15px 17px",
    background: "rgba(15, 23, 42, 0.82)",
    color: "#ffffff",
    outline: "none",
    fontSize: "1rem",
    fontWeight: 750,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  passwordRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "center",
  },

  primaryButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    padding: "16px 18px",
    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
    color: "#042f2e",
    fontSize: "1rem",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 18px 38px rgba(20, 184, 166, 0.25)",
  },

  secondaryButton: {
    border: "1px solid rgba(94, 234, 212, 0.34)",
    borderRadius: 18,
    padding: "15px 17px",
    background: "rgba(20, 184, 166, 0.14)",
    color: "#ccfbf1",
    fontSize: "0.95rem",
    fontWeight: 1000,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  smallPrimaryButton: {
    border: 0,
    borderRadius: 999,
    padding: "8px 12px",
    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
    color: "#042f2e",
    fontWeight: 1000,
    cursor: "pointer",
  },

  smallButton: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(15, 23, 42, 0.72)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  smallDangerButton: {
    border: 0,
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(239, 68, 68, 0.88)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  smallSuccessButton: {
    border: 0,
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(34, 197, 94, 0.88)",
    color: "#052e16",
    fontWeight: 1000,
    cursor: "pointer",
  },

  smallText: {
    color: "rgba(255,255,255,0.62)",
    fontWeight: 750,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
    minWidth: 1240,
  },

  th: {
    padding: "0 12px 8px",
    color: "rgba(255,255,255,0.62)",
    textAlign: "left",
    fontSize: "0.82rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  td: {
    padding: 12,
    background: "rgba(15, 23, 42, 0.68)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.86)",
    fontWeight: 750,
    verticalAlign: "middle",
  },

  link: {
    color: "#5eead4",
    fontWeight: 900,
    textDecoration: "none",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: "0.78rem",
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },

  badgeSuccess: {
    background: "rgba(34, 197, 94, 0.18)",
    color: "#bbf7d0",
    border: "1px solid rgba(74, 222, 128, 0.36)",
  },

  badgeWarning: {
    background: "rgba(245, 158, 11, 0.18)",
    color: "#fde68a",
    border: "1px solid rgba(251, 191, 36, 0.36)",
  },

  badgeDanger: {
    background: "rgba(239, 68, 68, 0.18)",
    color: "#fecaca",
    border: "1px solid rgba(248, 113, 113, 0.36)",
  },

  actionGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
};