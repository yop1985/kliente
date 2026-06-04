import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  changeInitialPassword,
  clearAdminSession,
  createInitialPin,
  getAdminNextStep,
  getAdminProfile,
  getBusinessSlugFromHostname,
  isAdminLoggedIn,
  setAdminNextStep,
} from "../../services/adminApi";

export default function AdminSecuritySetupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(getAdminNextStep());
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pinForm, setPinForm] = useState({
    newPin: "",
    confirmPin: "",
  });

  const businessSlug = getBusinessSlugFromHostname();

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      try {
        if (!isAdminLoggedIn()) {
          navigate("/admin/login", { replace: true });
          return;
        }

        await getAdminProfile();

        const nextStep = getAdminNextStep();

        if (!mounted) return;

        if (nextStep === "dashboard") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        setStep(nextStep);
      } catch (error) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handlePasswordChange(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePinChange(field, value) {
    const onlyNumbers = String(value || "").replace(/\D/g, "").slice(0, 6);

    setPinForm((current) => ({
      ...current,
      [field]: onlyNumbers,
    }));
  }

  async function handleSubmitPassword(event) {
    event.preventDefault();

    if (savingPassword) {
      return;
    }

    setSavingPassword(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await changeInitialPassword(passwordForm);
      const nextStep = result.nextStep || "create_pin";

      setAdminNextStep(nextStep);
      setStep(nextStep);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMessage("Contraseña actualizada correctamente. Ahora crea tu PIN de seguridad.");
    } catch (error) {
      setErrorMessage(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSubmitPin(event) {
    event.preventDefault();

    if (savingPin) {
      return;
    }

    setSavingPin(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createInitialPin(pinForm);

      setAdminNextStep("dashboard");
      setSuccessMessage("PIN creado correctamente. Entrando al panel...");

      window.setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 700);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo crear el PIN.");
    } finally {
      setSavingPin(false);
    }
  }

  function handleLogout() {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Validando sesión...</h1>
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
            <span style={styles.kicker}>Seguridad obligatoria</span>
            <h1 style={styles.title}>KLIENTE</h1>
            <p style={styles.subtitle}>Comercio: {businessSlug}</p>
          </div>
        </div>

        <div style={styles.notice}>
          Por seguridad del comercio, debes completar esta configuración antes de
          ingresar al panel.
        </div>

        {successMessage && <div style={styles.success}>{successMessage}</div>}
        {errorMessage && <div style={styles.error}>{errorMessage}</div>}

        {step === "change_password" && (
          <form style={styles.form} onSubmit={handleSubmitPassword}>
            <h2 style={styles.sectionTitle}>Cambiar contraseña inicial</h2>

            <label style={styles.label}>
              Contraseña actual
              <input
                style={styles.input}
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  handlePasswordChange("currentPassword", event.target.value)
                }
                placeholder="Contraseña entregada por Mitnick Connect"
                autoComplete="current-password"
              />
            </label>

            <label style={styles.label}>
              Nueva contraseña
              <input
                style={styles.input}
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  handlePasswordChange("newPassword", event.target.value)
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
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  handlePasswordChange("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
              />
            </label>

            <button style={styles.button} type="submit" disabled={savingPassword}>
              {savingPassword ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}

        {step === "create_pin" && (
          <form style={styles.form} onSubmit={handleSubmitPin}>
            <h2 style={styles.sectionTitle}>Crear PIN de seguridad</h2>

            <p style={styles.text}>
              Este PIN de 6 dígitos será solicitado para cambios sensibles, como
              modificar la contraseña. Si se ingresa mal 3 veces, el usuario se
              bloqueará por seguridad.
            </p>

            <label style={styles.label}>
              Nuevo PIN de 6 dígitos
              <input
                style={styles.input}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.newPin}
                onChange={(event) => handlePinChange("newPin", event.target.value)}
                placeholder="Ej: 123456"
              />
            </label>

            <label style={styles.label}>
              Confirmar PIN
              <input
                style={styles.input}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.confirmPin}
                onChange={(event) =>
                  handlePinChange("confirmPin", event.target.value)
                }
                placeholder="Repite el PIN"
              />
            </label>

            <button style={styles.button} type="submit" disabled={savingPin}>
              {savingPin ? "Guardando..." : "Crear PIN y entrar al panel"}
            </button>
          </form>
        )}

        <button style={styles.logoutButton} type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
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
      "radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "620px",
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

  form: {
    display: "grid",
    gap: "16px",
  },

  sectionTitle: {
    margin: "0 0 2px",
    fontSize: "1.45rem",
    fontWeight: "1000",
  },

  text: {
    margin: 0,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.5,
    fontWeight: "700",
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

  logoutButton: {
    width: "100%",
    border: "1px solid rgba(248, 113, 113, 0.42)",
    borderRadius: "18px",
    padding: "13px 16px",
    marginTop: "18px",
    background: "rgba(239, 68, 68, 0.12)",
    color: "#fecaca",
    fontSize: "0.95rem",
    fontWeight: "950",
    cursor: "pointer",
  },
};