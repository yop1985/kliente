import { useEffect, useState } from "react";
import {
  formatDateTime,
  getCountdown,
  getRanking,
  loadDemoData,
} from "./demoStorage";
import "./demo.css";

export default function DemoPublicScreen() {
  const [data, setData] = useState(() => loadDemoData());
  const [countdown, setCountdown] = useState(() => getCountdown(data.contest.drawDate));

  useEffect(() => {
    const reloadData = () => {
      const updatedData = loadDemoData();
      setData(updatedData);
      setCountdown(getCountdown(updatedData.contest.drawDate));
    };

    reloadData();

    const interval = window.setInterval(reloadData, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const ranking = getRanking(data.customers);

  const backgroundStyle = {
    background: `
      radial-gradient(circle at top left, ${data.business.primaryColor}55, transparent 35%),
      radial-gradient(circle at top right, ${data.business.secondaryColor}44, transparent 35%),
      #070717
    `,
  };

  return (
    <main className="demo-page" style={backgroundStyle}>
      <div className="demo-public-shell">
        <section className="demo-public-top">
          <div className="demo-public-card demo-brand-card">
            <div className="demo-logo-preview">
              {data.business.logo ? (
                <img src={data.business.logo} alt="Logo comercio" />
              ) : (
                <span>{data.business.name?.charAt(0) || "K"}</span>
              )}
            </div>

            <div>
              <h1 className="demo-brand-name">{data.business.name}</h1>
              <p className="demo-brand-slogan">{data.business.slogan}</p>
              <p className="demo-note">
                Demo comercial local · No requiere internet
              </p>
            </div>
          </div>

          <div className="demo-public-card">
            <h2 style={{ marginTop: 0 }}>Redes y contacto</h2>
            <p>
              <strong>Instagram:</strong> {data.business.instagram}
            </p>
            <p>
              <strong>WhatsApp:</strong> {data.business.whatsapp}
            </p>
            <div className="demo-qr-box">{data.business.qrText}</div>
          </div>
        </section>

        <section className="demo-public-layout">
          <article className="demo-public-card">
            <h2 className="demo-contest-title">{data.contest.title}</h2>
            <p className="demo-prize">{data.contest.prize}</p>
            <p>{data.contest.description}</p>
            <p className="demo-note">
              Fecha sorteo: {formatDateTime(data.contest.drawDate)}
            </p>

            <div className="demo-countdown">
              <div className="demo-time-box">
                <span className="demo-time-value">{countdown.days}</span>
                <span className="demo-time-label">Días</span>
              </div>

              <div className="demo-time-box">
                <span className="demo-time-value">{countdown.hours}</span>
                <span className="demo-time-label">Horas</span>
              </div>

              <div className="demo-time-box">
                <span className="demo-time-value">{countdown.minutes}</span>
                <span className="demo-time-label">Min</span>
              </div>

              <div className="demo-time-box">
                <span className="demo-time-value">{countdown.seconds}</span>
                <span className="demo-time-label">Seg</span>
              </div>
            </div>

            {data.contest.winner ? (
              <div className="demo-winner-box">
                <p className="demo-winner-label">Ganador seleccionado</p>
                <p className="demo-winner-name">{data.contest.winner.name}</p>
                <p className="demo-note">
                  {data.contest.winner.phone} · {data.contest.winner.points} puntos
                </p>
              </div>
            ) : null}
          </article>

          <article className="demo-public-card">
            <h2 style={{ marginTop: 0 }}>Ranking TOP 10</h2>

            <div className="demo-ranking-list">
              {ranking.map((customer, index) => (
                <div className="demo-ranking-item" key={customer.id}>
                  <div className="demo-ranking-position">{index + 1}</div>

                  <div>
                    <div className="demo-ranking-name">{customer.name}</div>
                    <div className="demo-ranking-phone">{customer.phone}</div>
                  </div>

                  <div className="demo-ranking-points">{customer.points} pts</div>
                </div>
              ))}
            </div>
          </article>

          <article className="demo-public-card">
            <h2 style={{ marginTop: 0 }}>Promociones activas</h2>

            <div className="demo-promotions-grid">
              {data.promotions.slice(0, 5).map((promotion) => (
                <div className="demo-promo-public" key={promotion.id}>
                  <h3>{promotion.title}</h3>
                  <p>{promotion.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <p className="demo-footer-mark">
          KLIENTE Demo Local · Creado por Mitnick Connect
        </p>
      </div>
    </main>
  );
}