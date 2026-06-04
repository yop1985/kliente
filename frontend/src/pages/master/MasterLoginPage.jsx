import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { isMasterLoggedIn, loginMaster } from "../../services/masterApi";

export default function MasterLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("mitnick");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isMasterLoggedIn()) {
      navigate("/mitnick/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanPin = pin.trim();

    if (!cleanUsername || !cleanPassword || !cleanPin) {
      setErrorMessage("Debes ingresar usuario maestro, contraseña y PIN.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await loginMaster({
        username: cleanUsername,
        password: cleanPassword,
        pin: cleanPin,
      });

      navigate("/mitnick/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "No se pudo iniciar sesión maestra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>M</div>

          <div>
            <span style={styles.kicker}>Panel maestro</span>
            <h1 style={styles.title}>Mitnick Connect</h1>
            <p style={styles.subtitle}>Administración central KLIENTE</p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label}>
            Usuario maestro
            <input
              style={styles.input}
              type="text"
              value={username}
              autoComplete="off"
              onChange={(event) => setUsername(event.target.value)}
              disabled={loading}
            />
          </label>

          <label style={styles.label}>
            Contraseña maestra
            <input
              style={styles.input}
              type="password"
              value={password}
              autoComplete="off"
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </label>

          <label style={styles.label}>
            PIN maestro
            <input
              style={styles.input}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              autoComplete="off"
              onChange={(event) => setPin(event.target.value)}
              disabled={loading}
            />
          </label>

          {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Validando..." : "Ingresar al panel maestro"}
          </button>
        </form>
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
    padding: 24,
    background:
      "radial-gradient(circle at top left, rgba(20, 184, 166, 0.24), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 540,
    borderRadius: 34,
    padding: 36,
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))",
    border: "1px solid rgba(94, 234, 212, 0.28)",
    boxShadow:
      "0 30px 90px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginBottom: 28,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
    color: "#042f2e",
    fontSize: "2rem",
    fontWeight: 1000,
    boxShadow: "0 18px 40px rgba(20, 184, 166, 0.32)",
  },

  kicker: {
    display: "block",
    color: "#5eead4",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.82rem",
    fontWeight: 1000,
    marginBottom: 4,
  },

  title: {
    margin: 0,
    fontSize: "2.1rem",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontWeight: 1000,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "0.95rem",
    fontWeight: 800,
  },

  form: {
    display: "grid",
    gap: 16,
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

  errorBox: {
    padding: "14px 16px",
    borderRadius: 18,
    background: "rgba(239, 68, 68, 0.20)",
    border: "1px solid rgba(248, 113, 113, 0.45)",
    color: "#fecaca",
    fontWeight: 900,
  },

  button: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    padding: "16px 18px",
    marginTop: 4,
    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
    color: "#042f2e",
    fontSize: "1rem",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 18px 38px rgba(20, 184, 166, 0.25)",
  },
};