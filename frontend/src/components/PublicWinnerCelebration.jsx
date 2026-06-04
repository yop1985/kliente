import { useEffect, useRef, useState } from "react";

function formatDrawReason(reason) {
  if (reason === "auto_target_points") {
    return "Ganador por meta de puntos";
  }

  if (reason === "auto_end_date") {
    return "Ganador por fecha final";
  }

  return "Ganador del concurso";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const confettiItems = Array.from({ length: 28 }, (_, index) => index);

export default function PublicWinnerCelebration({ winner, visible, onClose }) {
  const [phase, setPhase] = useState("drawing");
  const activeWinnerKeyRef = useRef("");
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible || !winner) {
      activeWinnerKeyRef.current = "";
      setPhase("drawing");
      return undefined;
    }

    const winnerKey = [
      winner.id || "",
      winner.contestId || "",
      winner.customerName || "",
      winner.customerRut || "",
      winner.selectedAt || "",
    ].join("|");

    if (activeWinnerKeyRef.current === winnerKey) {
      return undefined;
    }

    activeWinnerKeyRef.current = winnerKey;
    setPhase("drawing");

    const revealTimer = window.setTimeout(() => {
      setPhase("winner");
    }, 15000);

    const closeTimer = window.setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, 26000);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(closeTimer);
    };
  }, [visible, winner]);

  if (!visible || !winner) {
    return null;
  }

  return (
    <div className="winner-celebration-overlay">
      <div className="winner-celebration-backdrop" />

      <div
        className={
          phase === "winner"
            ? "winner-celebration-shell is-winner"
            : "winner-celebration-shell"
        }
      >
        {phase === "winner" && (
          <div className="winner-confetti-layer">
            {confettiItems.map((item) => (
              <span
                key={item}
                className={`winner-confetti-piece confetti-${(item % 6) + 1}`}
                style={{
                  left: `${(item * 13) % 100}%`,
                  animationDelay: `${(item % 8) * 0.18}s`,
                  animationDuration: `${3 + (item % 4)}s`,
                }}
              />
            ))}
          </div>
        )}

        {phase === "drawing" && (
          <div className="winner-drum-stage">
            <div className="winner-drum-wrapper">
              <div className="winner-drum-side left" />

              <div className="winner-drum">
                <div className="winner-drum-inner" />
                <div className="winner-ball ball-1" />
                <div className="winner-ball ball-2" />
                <div className="winner-ball ball-3" />
                <div className="winner-ball ball-4" />
                <div className="winner-ball ball-5" />
              </div>

              <div className="winner-drum-side right" />
            </div>

            <div className="winner-drawing-copy">
              <span>Sorteo automático</span>

              <h2>Girando tómbola...</h2>

              <p>
                El sistema está seleccionando al ganador del concurso de forma
                aleatoria, neutral e imparcial.
              </p>

              <p>
                Todos los clientes habilitados participan con una sola
                oportunidad.
              </p>
            </div>
          </div>
        )}

        {phase === "winner" && (
          <div className="winner-reveal-stage">
            <div className="winner-reveal-icon">🏆</div>

            <span className="winner-reveal-badge">¡Tenemos ganador!</span>

            <h2 className="winner-reveal-title">{winner.customerName}</h2>

            <p className="winner-reveal-subtitle">
              {formatDrawReason(winner.drawReason)}
            </p>

            <div className="winner-reveal-details">
              <div>
                <span>Puntos</span>
                <strong>{winner.totalPoints}</strong>
              </div>

              <div>
                <span>RUT</span>
                <strong>{winner.customerRut || "-"}</strong>
              </div>

              <div>
                <span>Fecha</span>
                <strong>{formatDate(winner.selectedAt) || "-"}</strong>
              </div>
            </div>

            <div className="winner-reveal-footer">
              <strong>🎉 Felicitaciones al ganador 🎉</strong>

              <p>
                Gracias a todos por participar. El ganador fue seleccionado
                automáticamente por el sistema.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}