import { useEffect, useState } from "react";

import { getAdminWinner } from "../../services/adminApi";

function formatDrawReason(reason) {
  if (reason === "auto_end_date") {
    return "Sorteo automático al finalizar el contador";
  }

  if (reason === "auto_target_points") {
    return "Sorteo automático";
  }

  if (reason === "manual") {
    return "Sorteo interno";
  }

  return "Pendiente";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminWinnerBox() {
  const [winner, setWinner] = useState(null);
  const [loadingWinner, setLoadingWinner] = useState(true);
  const [error, setError] = useState("");

  async function loadWinner() {
    try {
      setLoadingWinner(true);

      const currentWinner = await getAdminWinner();

      setWinner(currentWinner);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el ganador.");
    } finally {
      setLoadingWinner(false);
    }
  }

  useEffect(() => {
    loadWinner();

    const intervalId = window.setInterval(loadWinner, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="admin-winner-box">
      <div className="admin-winner-header">
        <div>
          <span>Sorteo automático</span>
          <h3>Ganador del concurso</h3>
        </div>

        <div className="admin-winner-status">
          Solo al finalizar contador
        </div>
      </div>

      <div className="admin-winner-rules">
        <strong>Reglas del sorteo:</strong>

        <p>
          El ganador será seleccionado automáticamente por el sistema únicamente
          cuando el contador llegue a cero. El comercio no puede adelantar,
          repetir ni manipular el sorteo.
        </p>

        <p>
          Si el concurso tiene meta de puntos, al finalizar el contador
          participan solo los clientes que llegaron o superaron esa meta.
          Cada cliente participa una sola vez, sin ventaja por tener más puntos.
        </p>

        <p>
          Si el concurso no tiene meta de puntos, al finalizar el contador
          participan todos los clientes que tengan puntos en ese concurso.
        </p>
      </div>

      {loadingWinner && (
        <div className="admin-winner-message">Cargando ganador...</div>
      )}

      {error && <div className="admin-winner-message error">{error}</div>}

      {!loadingWinner && !winner && (
        <div className="admin-winner-empty">
          Todavía no hay ganador. El sistema lo seleccionará automáticamente
          cuando el contador llegue a cero.
        </div>
      )}

      {winner && (
        <div className="admin-winner-card">
          <div>
            <span>Ganador</span>
            <strong>{winner.customerName}</strong>
          </div>

          <div>
            <span>RUT</span>
            <strong>{winner.customerRut || "-"}</strong>
          </div>

          <div>
            <span>Puntos</span>
            <strong>{winner.totalPoints}</strong>
          </div>

          <div>
            <span>Motivo</span>
            <strong>{formatDrawReason(winner.drawReason)}</strong>
          </div>

          <div>
            <span>Fecha</span>
            <strong>{formatDate(winner.selectedAt)}</strong>
          </div>
        </div>
      )}
    </section>
  );
}