import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  changePasswordWithPin,
  clearAdminSession,
  getAdminProfile,
  getBusinessSlugFromHostname,
  isAdminLoggedIn,
} from "../../services/adminApi";

const supportEmail = "mitnickconnect@gmail.com";
const supportWhatsapp = "+56 9 4969 1796";
const whatsappLink =
  "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20de%20KLIENTE%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20del%20mensaje.";

function isBlockedError(error) {
  return error?.code === "USER_LOCKED_BY_PIN" || Number(error?.status) === 423;
}

export default function AdminAccountSecurityPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [blockedMessage, setBlockedMessage] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    securityPin: "",
  });

  const businessSlug = getBusinessSlugFromHostname();

  const mailLink = useMemo(() => {
    return `mailto:${supportEmail}?subject=Usuario%20bloqueado%20KLIENTE&body=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20o%20captura%20del%20mensaje.%0A%0AComercio%3A%20${businessSlug}`;
  }, [businessSlug]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        if (!isAdminLoggedIn()) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const profile = await getAdminProfile();

        if (!mounted) return;

        setUser(profile);
      } catch (error) {
        if (isBlockedError(error)) {
          setBlockedMessage(
            "Usuario bloqueado por seguridad. Se ingresó incorrectamente el PIN de seguridad 3 veces."
          );
        } else {
          clearAdminSession();
          navigate("/admin/login", { replace: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handleChange(field, value) {
    if (field === "securityPin") {
      const onlyNumbers = String(value || "").replace(/\D/g, "").slice(0, 6);

      setForm((current) => ({
        ...current,
        [field]: onlyNumbers,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    setBlockedMessage("");

    try {
      await changePasswordWithPin(form);

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        securityPin: "",
      });

      setSuccessMessage("Contraseña actualizada correctamente.");
    } catch (error) {
      if (isBlockedError(error)) {
        setBlockedMessage(
          "Usuario bloqueado por seguridad. Se ingresó incorrectamente el PIN de seguridad 3 veces."
        );
      } else {
        setErrorMessage(error.message || "No se pudo cambiar la contraseña.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleBackToDashboard() {
    navigate("/admin/dashboard");
  }

  function handleLogout() {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Cargando seguridad...</h1>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>K</div>

          <div>
            <span style={styles.kicker}>Seguridad de cuenta</span>
            <h1 style={styles.title}>KLIENTE</h1>
            <p style={styles.subtitle}>
              Comercio: {businessSlug}
              <br />
              Usuario: {user?.email || "Administrador"}
            </p>
          </div>
        </div>

        <div style={styles.notice}>
          Para cambiar la contraseña debes ingresar tu contraseña actual y
          confirmar la operación con tu PIN de 6 dígitos.
        </div>

        {successMessage && <div style={styles.success}>{successMessage}</div>}

        {errorMessage && <div style={styles.error}>{errorMessage}</div>}

        {blockedMessage && (
          <div style={styles.blockedBox}>
            <strong>{blockedMessage}</strong>

            <p style={styles.blockedText}>
              Por protección del comercio, el acceso quedó bloqueado.
            </p>

            <p style={styles.blockedText}>
              Para solicitar desbloqueo:
              <br />
              Enviar correo a: <strong>{supportEmail}</strong>
              <br />
              Enviar fotografía o captura al WhatsApp:{" "}
              <strong>{supportWhatsapp}</strong>
            </p>

            <div style={styles.supportActions}>
              <a style={styles.supportButton} href={mailLink}>
                Enviar correo
              </a>

              <a
                style={styles.supportButton}
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                Enviar WhatsApp
              </a>
            </div>
          </div>
        )}

        {!blockedMessage && (
          <form style={styles.form} onSubmit={handleSubmit}>
            <h2 style={styles.sectionTitle}>Cambiar contraseña</h2>

            <label style={styles.label}>
              Contraseña actual
              <input
                style={styles.input}
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  handleChange("currentPassword", event.target.value)
                }
                autoComplete="current-password"
              />
            </label>

            <label style={styles.label}>
              Nueva contraseña
              <input
                style={styles.input}
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  handleChange("newPassword", event.target.value)
                }
                placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
                autoComplete="new-password"
              />
            </label>

            <label style={styles.label}>
              Confirmar nueva contraseña
              <input
                style={styles.input}
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  handleChange("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
              />
            </label>

            <label style={styles.label}>
              PIN de seguridad
              <input
                style={styles.input}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={form.securityPin}
                onChange={(event) =>
                  handleChange("securityPin", event.target.value)
                }
                placeholder="PIN de 6 dígitos"
              />
            </label>

            <button style={styles.button} type="submit" disabled={saving}>
              {saving ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}

        <div style={styles.actions}>
          <button style={styles.secondaryButton} type="button" onClick={handleBackToDashboard}>
            Volver al panel
          </button>

          <button style={styles.logoutButton} type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top left, rgba(245, 158, 11, 0.22), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "640px",
    borderRadius: "34px",
    padding: "36px",
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    boxShadow:
      "0 30px 90px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "24px",
  },

  logo: {
    width: "72px",
    height: "72px",
    borderRadius: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f59e0b, #facc15)",
    color: "#713f12",
    fontSize: "2rem",
    fontWeight: "1000",
    boxShadow: "0 18px 40px rgba(245, 158, 11, 0.32)",
  },

  kicker: {
    display: "block",
    color: "#5eead4",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.82rem",
    fontWeight: "1000",
    marginBottom: "4px",
  },

  title: {
    margin: 0,
    fontSize: "2.35rem",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontWeight: "1000",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "0.95rem",
    fontWeight: "800",
    lineHeight: 1.45,
  },

  notice: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(96, 165, 250, 0.36)",
    color: "#dbeafe",
    fontWeight: "850",
    marginBottom: "16px",
  },

  success: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(34, 197, 94, 0.18)",
    border: "1px solid rgba(74, 222, 128, 0.38)",
    color: "#dcfce7",
    fontWeight: "900",
    marginBottom: "16px",
  },

  error: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(239, 68, 68, 0.20)",
    border: "1px solid rgba(248, 113, 113, 0.45)",
    color: "#fecaca",
    fontWeight: "900",
    marginBottom: "16px",
  },

  blockedBox: {
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(239, 68, 68, 0.18)",
    border: "1px solid rgba(248, 113, 113, 0.48)",
    color: "#fee2e2",
    marginBottom: "16px",
  },

  blockedText: {
    margin: "10px 0 0",
    color: "rgba(255, 255, 255, 0.86)",
    lineHeight: 1.45,
    fontWeight: "700",
  },

  supportActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  supportButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.72)",
    color: "#ffffff",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.22)",
    fontWeight: "900",
  },

  form: {
    display: "grid",
    gap: "16px",
  },

  sectionTitle: {
    margin: "0 0 2px",
    fontSize: "1.45rem",
    fontWeight: "1000",
  },

  label: {
    display: "grid",
    gap: "8px",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "0.95rem",
    fontWeight: "900",
  },

  input: {
    width: "100%",
    border: "1px solid rgba(148, 163, 184, 0.38)",
    borderRadius: "18px",
    padding: "15px 17px",
    background: "rgba(15, 23, 42, 0.82)",
    color: "#ffffff",
    outline: "none",
    fontSize: "1rem",
    fontWeight: "750",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  button: {
    width: "100%",
    border: "0",
    borderRadius: "18px",
    padding: "16px 18px",
    marginTop: "4px",
    background: "linear-gradient(135deg, #f59e0b, #fde047)",
    color: "#713f12",
    fontSize: "1rem",
    fontWeight: "1000",
    cursor: "pointer",
    boxShadow: "0 18px 38px rgba(245, 158, 11, 0.28)",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "18px",
  },

  secondaryButton: {
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "18px",
    padding: "13px 16px",
    background: "rgba(15, 23, 42, 0.65)",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontWeight: "950",
    cursor: "pointer",
  },

  logoutButton: {
    border: "1px solid rgba(248, 113, 113, 0.42)",
    borderRadius: "18px",
    padding: "13px 16px",
    background: "rgba(239, 68, 68, 0.12)",
    color: "#fecaca",
    fontSize: "0.95rem",
    fontWeight: "950",
    cursor: "pointer",
  },
};