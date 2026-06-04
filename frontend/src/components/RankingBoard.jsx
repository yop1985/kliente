export default function RankingBoard({ ranking = [] }) {
  const safeRanking = Array.isArray(ranking) ? ranking.slice(0, 10) : [];

  return (
    <section className="ranking-board">
      <div className="ranking-board-header">
        <h2>Ranking TOP 10</h2>
      </div>

      {safeRanking.length === 0 ? (
        <div className="ranking-empty-state">
          <strong>Aún no hay participantes</strong>
          <span>Registra compras para comenzar el ranking de este sorteo.</span>
        </div>
      ) : (
        <div className="ranking-list">
          {safeRanking.map((customer, index) => (
            <article className="ranking-item" key={customer.id || index}>
              <div className="ranking-position">
                {customer.position || index + 1}
              </div>

              <div className="ranking-name">
                {customer.name || "Cliente sin nombre"}
              </div>

              <div className="ranking-points">
                {Number(customer.points || 0)} pts
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}