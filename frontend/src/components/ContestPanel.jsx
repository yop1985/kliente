import Countdown from "./Countdown";

export default function ContestPanel({ contest, winner }) {
  const title = contest?.title || "Concurso del Mes";

  const description =
    contest?.description ||
    "Participa comprando en el local durante el periodo del concurso.";

  const prizeTitle = contest?.prizeTitle || "Premio del concurso";

  const endDate = contest?.endDate || contest?.end_date || null;

  if (winner) {
    return (
      <article className="contest-panel">
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.34)",
              borderRadius: "22px",
              padding: "24px 18px",
              boxShadow: "0 18px 38px rgba(120, 53, 15, 0.18)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: "fit-content",
                background: "rgba(69, 26, 3, 0.22)",
                color: "#ffffff",
                borderRadius: "999px",
                padding: "7px 14px",
                fontSize: "0.76rem",
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "18px",
              }}
            >
              Sorteo finalizado
            </span>

            <strong
              style={{
                display: "block",
                color: "#ffffff",
                fontSize: "1.18rem",
                lineHeight: 1.12,
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                textShadow: "0 2px 8px rgba(69, 26, 3, 0.35)",
                marginBottom: "12px",
              }}
            >
              ATENTOS AL PRÓXIMO SORTEO
            </strong>

            <small
              style={{
                display: "block",
                color: "#ffffff",
                fontSize: "0.92rem",
                lineHeight: 1.25,
                fontWeight: 950,
                textTransform: "uppercase",
                textShadow: "0 2px 8px rgba(69, 26, 3, 0.35)",
              }}
            >
              EL PRÓXIMO GANADOR PODRÍAS SER TÚ
            </small>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="contest-panel">
      <div className="contest-content">
        <h1>{title}</h1>

        <p>{description}</p>

        <div className="contest-prize-box">
          <span>Premio:</span>
          <strong>{prizeTitle}</strong>
        </div>
      </div>

      <div className="contest-countdown-box">
        <span>Cuenta regresiva del sorteo</span>
        <Countdown targetDate={endDate} />
      </div>
    </article>
  );
}