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

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PublicWinnerBanner({ winner }) {
  if (!winner) {
    return null;
  }

  return (
    <section className="public-winner-banner">
      <div className="public-winner-badge">🎉 Ganador seleccionado</div>

      <div className="public-winner-content">
        <span>{formatDrawReason(winner.drawReason)}</span>

        <h2>{winner.customerName}</h2>

        <div className="public-winner-details">
          <strong>{winner.totalPoints} pts</strong>

          {winner.customerRut && <strong>RUT: {winner.customerRut}</strong>}

          {winner.selectedAt && <strong>{formatDate(winner.selectedAt)}</strong>}
        </div>
      </div>
    </section>
  );
}