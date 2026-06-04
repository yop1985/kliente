import { useEffect, useMemo, useRef, useState } from "react";

import {
  autoDrawPublicWinner,
  buildPublicStaticUrl,
  getPublicDashboard,
  getPublicWinner,
  registerPublicVisit,
} from "../../services/publicApi";

const fallbackDashboard = {
  business: {
    name: "Kliente",
    logoUrl: "",
  },
  contest: {
    id: "",
    title: "Concurso del Mes",
    description: "Participa comprando en el local durante el periodo del sorteo.",
    prizeTitle: "Premio del concurso",
    prizeDescription: "",
    endDate: "",
    status: "active",
    winnerSelected: false,
  },
  promotions: [
    {
      title: "2x1 en hallullas todos los lunes",
      description: "Promoción válida durante todo el día lunes.",
    },
    {
      title: "Marraquetas con descuento desde las 18:00 hrs",
      description: "Descuento especial en productos seleccionados.",
    },
    {
      title: "Compra sobre $5.000 y suma doble puntaje",
      description: "Acumula más puntos para participar en el sorteo.",
    },
    {
      title: "Pan amasado especial de fin de semana",
      description: "Disponible sábado y domingo hasta agotar stock.",
    },
    {
      title: "Promoción familiar: lleva más y paga menos",
      description: "Pack familiar disponible en caja.",
    },
  ],
  ranking: [
    { name: "Juan Pérez", rut: "", points: 125 },
    { name: "María González", rut: "", points: 110 },
    { name: "Pedro Soto", rut: "", points: 95 },
    { name: "Camila Rojas", rut: "", points: 88 },
    { name: "Luis Herrera", rut: "", points: 81 },
    { name: "Ana Torres", rut: "", points: 74 },
    { name: "Diego Muñoz", rut: "", points: 69 },
    { name: "Sofía Vera", rut: "", points: 63 },
    { name: "Carlos Díaz", rut: "", points: 55 },
    { name: "Valentina Silva", rut: "", points: 49 },
  ],
  socialLinks: [],
  visits: {
    total: 0,
  },
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatTwoDigits(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getCountdown(endDate) {
  if (!endDate) {
    return {
      finished: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (Number.isNaN(end)) {
    return {
      finished: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const diff = end - now;

  if (diff <= 0) {
    return {
      finished: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);

  return {
    finished: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function getQrUrl(url) {
  if (!url) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    url
  )}`;
}

function normalizeWinner(rawWinner) {
  if (!rawWinner) {
    return null;
  }

  return {
    customerName:
      rawWinner.customerName ||
      rawWinner.name ||
      rawWinner.customer_name ||
      "Ganador seleccionado",
    customerRut: rawWinner.customerRut || rawWinner.rut || rawWinner.customer_rut || "",
    totalPoints:
      rawWinner.totalPoints ||
      rawWinner.points ||
      rawWinner.total_points ||
      rawWinner.pointsGenerated ||
      0,
  };
}

function getRankingName(item) {
  return item.customerName || item.name || item.customer_name || "Cliente";
}

function getRankingRut(item) {
  return item.customerRut || item.rut || item.customer_rut || "";
}

function getRankingPoints(item) {
  return item.points || item.totalPoints || item.total_points || item.currentContestPoints || 0;
}

function getServiceModeFromError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  if (code === "BUSINESS_CANCELLED" || message.includes("cancelado")) {
    return "cancelled";
  }

  if (
    code === "BUSINESS_SUSPENDED" ||
    message.includes("suspendido") ||
    message.includes("temporalmente no disponible")
  ) {
    return "suspended";
  }

  return "";
}

function ServiceUnavailableScreen({ mode }) {
  const isCancelled = mode === "cancelled";

  return (
    <main style={styles.servicePage}>
      <section style={styles.serviceCard}>
        <div style={styles.serviceLogo}>K</div>

        <span style={styles.serviceBadge}>
          {isCancelled ? "Servicio cancelado" : "Servicio temporalmente no disponible"}
        </span>

        <h1 style={styles.serviceTitle}>
          {isCancelled
            ? "Este comercio no se encuentra disponible"
            : "Este comercio está temporalmente suspendido"}
        </h1>

        <p style={styles.serviceText}>
          {isCancelled
            ? "El servicio KLIENTE de este comercio fue cancelado. Para más información, contactar a Mitnick Connect."
            : "El servicio KLIENTE de este comercio se encuentra temporalmente suspendido. Para regularizar el acceso, contactar a Mitnick Connect."}
        </p>

        <div style={styles.serviceSupport}>
          <strong>Soporte Mitnick Connect</strong>
          <span>mitnickconnect@gmail.com</span>
          <span>+56 9 4969 1796</span>
        </div>

        <div style={styles.serviceCredit}>© by Mitnick-Connect</div>
      </section>
    </main>
  );
}

export default function PublicHomePage() {
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [loadingMode, setLoadingMode] = useState("loading");
  const [countdown, setCountdown] = useState(getCountdown(""));
  const [winner, setWinner] = useState(null);
  const [drawingWinner, setDrawingWinner] = useState(false);

  const drawStartedRef = useRef(false);

  const business = dashboard.business || fallbackDashboard.business;
  const contest = dashboard.contest || fallbackDashboard.contest;

  const promotions = safeArray(dashboard.promotions).length
    ? safeArray(dashboard.promotions).slice(0, 5)
    : fallbackDashboard.promotions;

  const ranking = safeArray(dashboard.ranking).length
    ? safeArray(dashboard.ranking).slice(0, 10)
    : fallbackDashboard.ranking;

  const socialLinks = safeArray(dashboard.socialLinks).filter((item) => item?.url);

  const logoUrl = useMemo(() => {
    return buildPublicStaticUrl(business.logoUrl || "");
  }, [business.logoUrl]);

  const hasWinner = Boolean(winner || contest.winnerSelected || contest.status === "finished");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const data = await getPublicDashboard();

        if (!mounted) return;

        setDashboard({
          ...fallbackDashboard,
          ...data,
          business: {
            ...fallbackDashboard.business,
            ...(data.business || {}),
          },
          contest: {
            ...fallbackDashboard.contest,
            ...(data.contest || {}),
          },
          promotions: safeArray(data.promotions),
          ranking: safeArray(data.ranking),
          socialLinks: safeArray(data.socialLinks),
          visits: data.visits || fallbackDashboard.visits,
        });

        setLoadingMode("online");

        try {
          const currentWinner = await getPublicWinner();
          if (mounted) {
            setWinner(normalizeWinner(currentWinner));
          }
        } catch (error) {
          setWinner(null);
        }

        try {
          await registerPublicVisit();
        } catch (error) {
          // La visita no debe romper la pantalla pública.
        }
      } catch (error) {
        if (!mounted) return;

        const serviceMode = getServiceModeFromError(error);

        if (serviceMode) {
          setLoadingMode(serviceMode);
          setDashboard(fallbackDashboard);
          return;
        }

        setLoadingMode("local");
        setDashboard(fallbackDashboard);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(getCountdown(contest.endDate));
    }, 1000);

    setCountdown(getCountdown(contest.endDate));

    return () => {
      window.clearInterval(interval);
    };
  }, [contest.endDate]);

  useEffect(() => {
    async function drawWinnerWhenFinished() {
      if (!countdown.finished) return;
      if (drawStartedRef.current) return;
      if (hasWinner) return;
      if (!contest.id) return;
      if (loadingMode === "suspended" || loadingMode === "cancelled") return;

      drawStartedRef.current = true;
      setDrawingWinner(true);

      window.setTimeout(async () => {
        try {
          const result = await autoDrawPublicWinner();
          const selectedWinner = normalizeWinner(result?.winner || result);

          setWinner(selectedWinner);

          const refreshed = await getPublicDashboard();

          setDashboard((current) => ({
            ...current,
            ...refreshed,
            business: {
              ...current.business,
              ...(refreshed.business || {}),
            },
            contest: {
              ...current.contest,
              ...(refreshed.contest || {}),
            },
            promotions: safeArray(refreshed.promotions),
            ranking: safeArray(refreshed.ranking),
            socialLinks: safeArray(refreshed.socialLinks),
            visits: refreshed.visits || current.visits,
          }));
        } catch (error) {
          drawStartedRef.current = false;
        } finally {
          setDrawingWinner(false);
        }
      }, 15000);
    }

    drawWinnerWhenFinished();
  }, [countdown.finished, contest.id, hasWinner, loadingMode]);

  if (loadingMode === "suspended" || loadingMode === "cancelled") {
    return <ServiceUnavailableScreen mode={loadingMode} />;
  }

  const pageStyle = hasWinner
    ? {
        ...styles.page,
        paddingTop: 92,
      }
    : styles.page;

  return (
    <main style={pageStyle}>
      {loadingMode === "local" && (
        <div style={styles.backendBadge}>
          USANDO DATOS LOCALES. BACKEND NO DISPONIBLE.
        </div>
      )}

      <div style={styles.credit}>© by Mitnick-Connect</div>

      {drawingWinner && (
        <section style={styles.drawOverlay}>
          <div style={styles.tombola}>
            <div style={styles.tombolaBallOne} />
            <div style={styles.tombolaBallTwo} />
            <div style={styles.tombolaBallThree} />
            <div style={styles.tombolaBallFour} />
            <div style={styles.tombolaBallFive} />
          </div>

          <span style={styles.drawBadge}>Sorteo automático</span>
          <h2 style={styles.drawTitle}>Girando tómbola...</h2>
          <p style={styles.drawText}>
            El sistema está seleccionando al ganador de forma aleatoria, neutral e imparcial.
          </p>
          <p style={styles.drawText}>
            Todos los clientes habilitados participan con una sola oportunidad.
          </p>
        </section>
      )}

      {winner && !drawingWinner && (
        <section style={styles.winnerBanner}>
          <div style={styles.winnerPill}>🎉 GANADOR SELECCIONADO</div>

          <div style={styles.winnerInfo}>
            <span style={styles.winnerLabel}>GANADOR POR FECHA FINAL</span>
            <strong style={styles.winnerName}>{winner.customerName}</strong>

            <div style={styles.winnerMeta}>
              <span>{winner.totalPoints} pts</span>
              {winner.customerRut && <span>RUT: {winner.customerRut}</span>}
            </div>
          </div>
        </section>
      )}

      <section style={styles.layout}>
        <aside style={styles.leftColumn}>
          <article style={styles.businessCard}>
            <div style={styles.logo}>
              {logoUrl ? <img src={logoUrl} alt="Logo negocio" style={styles.logoImage} /> : "K"}
            </div>

            <div>
              <span style={styles.kicker}>Negocio</span>
              <h1 style={styles.businessName}>{business.name || "Kliente"}</h1>
            </div>
          </article>

          <article style={styles.contestCard}>
            <h2 style={styles.contestTitle}>{contest.title || "Concurso del Mes"}</h2>

            <p style={styles.contestDescription}>
              {contest.description ||
                "Participa comprando en el local durante el periodo del sorteo."}
            </p>

            <div style={styles.prizeBox}>
              <span>Premio</span>
              <strong>{contest.prizeTitle || "Premio del concurso"}</strong>
              {contest.prizeDescription && <p>{contest.prizeDescription}</p>}
            </div>

            {hasWinner ? (
              <div style={styles.finishedBox}>
                <strong>SORTEO FINALIZADO</strong>
                <span>
                  ATENTOS AL PRÓXIMO SORTEO
                  <br />
                  EL PRÓXIMO GANADOR PODRÍAS SER TÚ
                </span>
              </div>
            ) : (
              <div style={styles.countdownBox}>
                <h3>Cuenta regresiva del sorteo</h3>

                <div style={styles.countdownGrid}>
                  <div style={styles.countdownItem}>
                    <strong>{formatTwoDigits(countdown.days)}</strong>
                    <span>Días</span>
                  </div>

                  <div style={styles.countdownItem}>
                    <strong>{formatTwoDigits(countdown.hours)}</strong>
                    <span>Horas</span>
                  </div>

                  <div style={styles.countdownItem}>
                    <strong>{formatTwoDigits(countdown.minutes)}</strong>
                    <span>Min</span>
                  </div>

                  <div style={styles.countdownItem}>
                    <strong>{formatTwoDigits(countdown.seconds)}</strong>
                    <span>Seg</span>
                  </div>
                </div>
              </div>
            )}
          </article>

          <article style={styles.socialCard}>
            <span style={styles.socialBadge}>Conecta con nosotros</span>
            <h3 style={styles.socialTitle}>Redes sociales</h3>

            <div style={styles.socialGrid}>
              {socialLinks.length ? (
                socialLinks.slice(0, 3).map((social, index) => (
                  <div style={styles.qrCard} key={social.id || index}>
                    <img
                      src={getQrUrl(social.url)}
                      alt={social.name || "QR"}
                      style={styles.qrImage}
                    />
                    <strong style={styles.qrTitle}>{social.name || "Red social"}</strong>
                    <small style={styles.qrSmall}>{social.label || "Escanea"}</small>
                  </div>
                ))
              ) : (
                <>
                  <div style={styles.qrCard}>
                    <div style={styles.qrPlaceholder}>QR</div>
                    <strong style={styles.qrTitle}>WhatsApp</strong>
                    <small style={styles.qrSmall}>Escanea</small>
                  </div>

                  <div style={styles.qrCard}>
                    <div style={styles.qrPlaceholder}>QR</div>
                    <strong style={styles.qrTitle}>Instagram</strong>
                    <small style={styles.qrSmall}>Síguenos</small>
                  </div>

                  <div style={styles.qrCard}>
                    <div style={styles.qrPlaceholder}>QR</div>
                    <strong style={styles.qrTitle}>Facebook</strong>
                    <small style={styles.qrSmall}>Visítanos</small>
                  </div>
                </>
              )}
            </div>
          </article>
        </aside>

        <section style={styles.centerColumn}>
          <article style={styles.promotionsCard}>
            <h2 style={styles.sectionTitle}>Promociones Activas</h2>

            <div style={styles.promotionsList}>
              {promotions.map((promotion, index) => (
                <div style={styles.promotionItem} key={promotion.id || index}>
                  <div style={styles.promotionNumber}>{index + 1}</div>

                  <div>
                    <h3>{promotion.title || `Promoción ${index + 1}`}</h3>
                    <p>{promotion.description || "Promoción disponible en caja."}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <aside style={styles.rightColumn}>
          <article style={styles.rankingCard}>
            <h2 style={styles.rankingTitle}>Ranking TOP 10</h2>

            <div style={styles.rankingList}>
              {ranking.map((item, index) => (
                <div style={styles.rankingItem} key={item.id || index}>
                  <div style={styles.rankingPosition}>{index + 1}</div>

                  <div>
                    <strong>{getRankingName(item)}</strong>
                    {getRankingRut(item) && <small>{getRankingRut(item)}</small>}
                  </div>

                  <span>{getRankingPoints(item)} pts</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <footer style={styles.ticker}>
        <div style={styles.tickerContent}>
          VISITAS AL SITIO: {dashboard.visits?.total || 0} &nbsp;&nbsp; • &nbsp;&nbsp;
          PARTICIPA COMPRANDO EN EL LOCAL &nbsp;&nbsp; • &nbsp;&nbsp;
          ESCANEA EL QR Y SÍGUENOS EN REDES SOCIALES &nbsp;&nbsp; • &nbsp;&nbsp;
          LOS 10 MEJORES CLIENTES APARECEN EN PANTALLA &nbsp;&nbsp; • &nbsp;&nbsp;
          EL GANADOR SE SELECCIONARÁ AUTOMÁTICAMENTE AL FINALIZAR EL CONTADOR
        </div>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    padding: "18px 18px 58px",
    overflow: "hidden",
    position: "relative",
    color: "#ffffff",
    background:
      "radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.14), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  servicePage: {
    minHeight: "100vh",
    width: "100vw",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background:
      "radial-gradient(circle at top left, rgba(245, 158, 11, 0.22), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 52%, #111827 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  serviceCard: {
    width: "100%",
    maxWidth: 620,
    borderRadius: 34,
    padding: 38,
    textAlign: "center",
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))",
    border: "1px solid rgba(251, 191, 36, 0.32)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
  },

  serviceLogo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    margin: "0 auto 18px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #f59e0b, #fde047)",
    color: "#713f12",
    fontSize: "2.4rem",
    fontWeight: 1000,
  },

  serviceBadge: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(245, 158, 11, 0.18)",
    border: "1px solid rgba(251, 191, 36, 0.42)",
    color: "#fef3c7",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontSize: "0.75rem",
    fontWeight: 1000,
  },

  serviceTitle: {
    margin: "18px 0 12px",
    fontSize: "2rem",
    lineHeight: 1,
    letterSpacing: "-0.05em",
    fontWeight: 1000,
  },

  serviceText: {
    margin: "0 auto 20px",
    maxWidth: 520,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.5,
    fontWeight: 800,
  },

  serviceSupport: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: 20,
    background: "rgba(15, 23, 42, 0.68)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.88)",
    fontWeight: 900,
  },

  serviceCredit: {
    marginTop: 18,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 900,
    fontSize: "0.82rem",
  },

  backendBadge: {
    position: "fixed",
    top: 10,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 80,
    borderRadius: 999,
    padding: "8px 18px",
    background: "rgba(239, 68, 68, 0.14)",
    border: "1px solid rgba(248, 113, 113, 0.48)",
    color: "#fecaca",
    fontWeight: 1000,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "0.78rem",
  },

  credit: {
    position: "fixed",
    top: 10,
    right: 16,
    zIndex: 70,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 900,
    fontSize: "0.74rem",
  },

  layout: {
    width: "100%",
    minHeight: "calc(100vh - 76px)",
    display: "grid",
    gridTemplateColumns: "0.96fr 1.38fr 0.86fr",
    gap: 18,
  },

  leftColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  centerColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  rightColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  businessCard: {
    minHeight: 104,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 28,
    background: "rgba(15, 23, 42, 0.86)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
  },

  logo: {
    width: 74,
    height: 74,
    flex: "0 0 74px",
    borderRadius: 23,
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 32% 20%, rgba(255,255,255,0.42), transparent 28%), linear-gradient(135deg, #0ea5e9, #14b8a6 52%, #22c55e)",
    color: "#ecfeff",
    fontWeight: 1000,
    fontSize: "1.9rem",
    border: "1px solid rgba(94,234,212,0.38)",
    boxShadow: "0 18px 44px rgba(14,165,233,0.28)",
    animation: "klienteLogoFloat 4.2s ease-in-out infinite",
    overflow: "hidden",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  kicker: {
    display: "block",
    color: "#5eead4",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 1000,
    fontSize: "0.76rem",
  },

  businessName: {
    margin: "6px 0 0",
    fontSize: "1.55rem",
    fontWeight: 1000,
    letterSpacing: "-0.04em",
  },

  contestCard: {
    flex: 1,
    minHeight: 350,
    padding: 24,
    borderRadius: 30,
    background:
      "radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 28%), linear-gradient(135deg, #f59e0b, #facc15)",
    color: "#ffffff",
    boxShadow: "0 24px 80px rgba(245,158,11,0.22)",
  },

  contestTitle: {
    margin: "0 0 12px",
    fontSize: "clamp(1.8rem, 3.3vw, 3rem)",
    lineHeight: 1,
    letterSpacing: "-0.06em",
    fontWeight: 1000,
  },

  contestDescription: {
    margin: "0 0 16px",
    fontWeight: 900,
    lineHeight: 1.35,
    fontSize: "0.96rem",
  },

  prizeBox: {
    padding: 15,
    borderRadius: 20,
    background: "rgba(255,255,255,0.24)",
    marginBottom: 16,
  },

  countdownBox: {
    padding: 17,
    borderRadius: 24,
    background: "rgba(113,63,18,0.16)",
    textAlign: "center",
  },

  countdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },

  countdownItem: {
    padding: "13px 9px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.92)",
    color: "#334155",
  },

  finishedBox: {
    minHeight: 112,
    borderRadius: 24,
    background: "rgba(255,255,255,0.20)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 18,
    fontWeight: 1000,
    fontSize: "1.18rem",
    lineHeight: 1.2,
  },

  socialCard: {
    padding: 18,
    borderRadius: 28,
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(148,163,184,0.25)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
  },

  socialBadge: {
    display: "inline-flex",
    padding: "6px 11px",
    borderRadius: 999,
    background: "rgba(20,184,166,0.25)",
    color: "#99f6e4",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.66rem",
    fontWeight: 1000,
  },

  socialTitle: {
    margin: "8px 0 12px",
    fontSize: "1.35rem",
    fontWeight: 1000,
  },

  socialGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  qrCard: {
    minWidth: 0,
    padding: 8,
    borderRadius: 16,
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(148,163,184,0.22)",
    textAlign: "center",
    overflow: "hidden",
  },

  qrImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    background: "#ffffff",
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
  },

  qrPlaceholder: {
    width: 76,
    height: 76,
    margin: "0 auto",
    borderRadius: 10,
    background: "#ffffff",
    color: "#0f172a",
    display: "grid",
    placeItems: "center",
    fontWeight: 1000,
  },

  qrTitle: {
    display: "block",
    marginTop: 6,
    fontSize: "0.68rem",
    fontWeight: 1000,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  qrSmall: {
    display: "block",
    color: "rgba(255,255,255,0.68)",
    fontWeight: 800,
    fontSize: "0.62rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  promotionsCard: {
    flex: 1,
    padding: 28,
    borderRadius: 30,
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(148,163,184,0.25)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
  },

  sectionTitle: {
    margin: "0 0 20px",
    fontSize: "clamp(1.9rem, 2.6vw, 2.55rem)",
    fontWeight: 1000,
    letterSpacing: "-0.05em",
  },

  promotionsList: {
    display: "grid",
    gap: 13,
  },

  promotionItem: {
    display: "grid",
    gridTemplateColumns: "52px 1fr",
    gap: 13,
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    background: "rgba(30,64,175,0.35)",
    border: "1px solid rgba(251,191,36,0.28)",
  },

  promotionNumber: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #f59e0b, #facc15)",
    color: "#713f12",
    fontWeight: 1000,
  },

  rankingCard: {
    flex: 1,
    padding: 22,
    borderRadius: 30,
    background: "rgba(255,255,255,0.94)",
    color: "#0f172a",
    boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
  },

  rankingTitle: {
    margin: "0 0 18px",
    fontSize: "1.6rem",
    fontWeight: 1000,
  },

  rankingList: {
    display: "grid",
    gap: 8,
  },

  rankingItem: {
    display: "grid",
    gridTemplateColumns: "36px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: 11,
    borderRadius: 16,
    background: "rgba(15,23,42,0.06)",
  },

  rankingPosition: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#475569",
    color: "#ffffff",
    fontWeight: 1000,
    fontSize: "0.78rem",
  },

  ticker: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 42,
    background: "linear-gradient(90deg, #10b981, #a3e635)",
    color: "#064e3b",
    fontWeight: 1000,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 20,
  },

  tickerContent: {
    whiteSpace: "nowrap",
    animation: "klienteTickerMove 26s linear infinite",
  },

  winnerBanner: {
    position: "fixed",
    left: 18,
    right: 18,
    top: 10,
    zIndex: 45,
    height: 72,
    padding: "10px 18px",
    display: "grid",
    gridTemplateColumns: "0.72fr 1.28fr",
    gap: 18,
    alignItems: "center",
    borderRadius: 26,
    background:
      "radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 24%), linear-gradient(90deg, #10b981, #a3e635)",
    color: "#052e16",
    boxShadow: "0 14px 48px rgba(0,0,0,0.28)",
  },

  winnerPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 0,
    background: "transparent",
    color: "#083344",
    fontSize: "1.16rem",
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "none",
    border: "none",
  },

  winnerInfo: {
    minWidth: 0,
  },

  winnerLabel: {
    display: "block",
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
    lineHeight: 1,
  },

  winnerName: {
    display: "block",
    marginTop: 3,
    fontSize: "clamp(1.45rem, 3.2vw, 2.8rem)",
    lineHeight: 0.95,
    fontWeight: 1000,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  winnerMeta: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 5,
    fontWeight: 1000,
    fontSize: "0.78rem",
  },

  drawOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    padding: 30,
    background:
      "radial-gradient(circle at center, rgba(30,64,175,0.70), rgba(2,6,23,0.98))",
  },

  tombola: {
    position: "relative",
    width: 210,
    height: 210,
    borderRadius: "50%",
    border: "18px solid rgba(250,204,21,0.85)",
    background: "rgba(245,158,11,0.30)",
    animation: "klienteSpin 0.75s linear infinite",
    boxShadow: "0 0 70px rgba(250,204,21,0.34)",
  },

  tombolaBallOne: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#ffffff",
    top: 36,
    left: 58,
  },

  tombolaBallTwo: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#ffffff",
    top: 70,
    right: 34,
  },

  tombolaBallThree: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#ffffff",
    bottom: 44,
    left: 46,
  },

  tombolaBallFour: {
    position: "absolute",
    width: 25,
    height: 25,
    borderRadius: "50%",
    background: "#ffffff",
    bottom: 48,
    right: 54,
  },

  tombolaBallFive: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ffffff",
    top: 34,
    right: 78,
  },

  drawBadge: {
    marginTop: 28,
    display: "inline-flex",
    borderRadius: 999,
    padding: "8px 18px",
    background: "rgba(20,184,166,0.45)",
    color: "#ccfbf1",
    fontWeight: 1000,
    textTransform: "uppercase",
  },

  drawTitle: {
    margin: "18px 0 8px",
    fontSize: "3rem",
    fontWeight: 1000,
  },

  drawText: {
    margin: "6px 0",
    maxWidth: 720,
    fontWeight: 900,
    color: "rgba(255,255,255,0.86)",
  },
};