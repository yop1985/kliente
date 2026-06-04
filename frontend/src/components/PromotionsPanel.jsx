export default function PromotionsPanel({ promotions = [] }) {
  const visiblePromotions = promotions.slice(0, 5);

  return (
    <section className="promotions-panel">
      <div className="promotions-panel-header">
        <div>
          <h2>Promociones Activas</h2>
        </div>
      </div>

      <div className="promotions-list">
        {visiblePromotions.map((promotion, index) => (
          <article className="promotion-card" key={promotion.id || index}>
            <span className="promotion-number">{index + 1}</span>

            <div className="promotion-content">
              {promotion.tag && (
                <span className="promotion-tag">{promotion.tag}</span>
              )}

              <h3>{promotion.title}</h3>

              {promotion.description && <p>{promotion.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}