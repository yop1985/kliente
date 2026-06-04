import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getBusinessSlugFromHostname,
  isAdminLoggedIn,
  loginAdmin,
} from "../../services/adminApi";

const supportEmail = "mitnickconnect@gmail.com";
const supportWhatsapp = "+56 9 4969 1796";
const whatsappLink =
  "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20de%20KLIENTE%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20del%20mensaje.";

const suspendedWhatsappLink =
  "https://wa.me/56949691796?text=Hola%20Mitnick%20Connect%2C%20mi%20servicio%20KLIENTE%20aparece%20suspendido.%20Necesito%20regularizar%20el%20acceso.";

function isBlockedError(error) {
  return error?.code === "USER_LOCKED_BY_PIN" || Number(error?.status) === 423;
}

function isBusinessSuspendedError(error) {
  return (
    error?.code === "BUSINESS_SUSPENDED" ||
    error?.code === "BUSINESS_CANCELLED" ||
    Number(error?.status) === 403
  );
}

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@kliente.cl");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [blockedMessage, setBlockedMessage] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");

  const businessSlug = getBusinessSlugFromHostname();

  const mailLink = useMemo(() => {
    return `mailto:${supportEmail}?subject=Usuario%20bloqueado%20KLIENTE&body=Hola%20Mitnick%20Connect%2C%20mi%20usuario%20fue%20bloqueado%20por%20seguridad.%20Adjunto%20fotograf%C3%ADa%20o%20captura%20del%20mensaje.%0A%0AComercio%3A%20${businessSlug}`;
  }, [businessSlug]);

  const suspendedMailLink = useMemo(() => {
    return `mailto:${supportEmail}?subject=Servicio%20KLIENTE%20suspendido&body=Hola%20Mitnick%20Connect%2C%20mi%20servicio%20KLIENTE%20aparece%20suspendido.%20Necesito%20regularizar%20el%20acceso.%0A%0AComercio%3A%20${businessSlug}`;
  }, [businessSlug]);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage("Debes ingresar correo y contraseña.");
      setBlockedMessage("");
      setServiceMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setBlockedMessage("");
    setServiceMessage("");

    try {
      const result = await loginAdmin({
        email: cleanEmail,
        password: cleanPassword,
      });

      const nextStep = result?.nextStep || "dashboard";

      if (nextStep === "change_password" || nextStep === "create_pin") {
        navigate("/admin/security-setup", { replace: true });
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      if (isBlockedError(error)) {
        setBlockedMessage(
          "Usuario bloqueado por seguridad. Se ingresó incorrectamente el PIN de seguridad 3 veces."
        );
        setErrorMessage("");
        setServiceMessage("");
      } else if (isBusinessSuspendedError(error)) {
        setServiceMessage(
          error.message ||
            "Servicio suspendido. Contactar a Mitnick Connect para regularizar el acceso."
        );
        setErrorMessage("");
        setBlockedMessage("");
      } else {
        setErrorMessage(error.message || "No se pudo iniciar sesión.");
        setBlockedMessage("");
        setServiceMessage("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>K</div>

          <div>
            <span style={styles.kicker}>Panel administrador</span>
            <h1 style={styles.title}>KLIENTE</h1>
            <p style={styles.slug}>Comercio: {businessSlug}</p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label}>
            Correo administrador
            <input
              style={styles.input}
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </label>

          {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

          {serviceMessage && (
            <div style={styles.serviceBox}>
              <strong>{serviceMessage}</strong>

              <p style={styles.blockedText}>
                El acceso del comercio está temporalmente restringido.
              </p>

              <p style={styles.blockedText}>
                Para regularizar el servicio:
                <br />
                Enviar correo a: <strong>{supportEmail}</strong>
                <br />
                WhatsApp: <strong>{supportWhatsapp}</strong>
              </p>

              <div style={styles.supportActions}>
                <a style={styles.supportButton} href={suspendedMailLink}>
                  Enviar correo
                </a>

                <a
                  style={styles.supportButton}
                  href={suspendedWhatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar WhatsApp
                </a>
              </div>
            </div>
          )}

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

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar al panel"}
          </button>
        </form>

        <p style={styles.help}>
          Usuario inicial: <strong>correo administrador</strong> / Clave:{" "}
          <strong>contraseña provisoria entregada por Mitnick</strong>
        </p>
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
      "radial-gradient(circle at top left, rgba(59, 130, 246, 0.24), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "34px",
    padding: "36px",
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    boxShadow:
      "0 30px 90px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "28px",
  },

  logo: {
    width: "76px",
    height: "76px",
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
    fontSize: "2.45rem",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontWeight: "1000",
  },

  slug: {
    margin: "8px 0 0",
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "0.95rem",
    fontWeight: "800",
  },

  form: {
    display: "grid",
    gap: "16px",
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

  errorBox: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(239, 68, 68, 0.20)",
    border: "1px solid rgba(248, 113, 113, 0.45)",
    color: "#fecaca",
    fontWeight: "900",
  },

  serviceBox: {
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(245, 158, 11, 0.18)",
    border: "1px solid rgba(251, 191, 36, 0.48)",
    color: "#fef3c7",
  },

  blockedBox: {
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(239, 68, 68, 0.18)",
    border: "1px solid rgba(248, 113, 113, 0.48)",
    color: "#fee2e2",
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

  help: {
    margin: "18px 0 0",
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: "0.92rem",
    fontWeight: "700",
  },
};