import { useEffect, useState } from "react";
import {
  loadDemoData,
  pickWinner,
  resetDemoData,
  saveDemoData,
} from "./demoStorage";
import "./demo.css";

function createEmptyCustomer() {
  return {
    id: Date.now(),
    name: "Nuevo cliente",
    phone: "+56 9",
    points: 10,
  };
}

export default function DemoLocalAdmin() {
  const [data, setData] = useState(() => loadDemoData());
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    saveDemoData(data);
  }, [data]);

  function showSavedMessage(message) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(""), 2200);
  }

  function updateBusiness(field, value) {
    setData((current) => ({
      ...current,
      business: {
        ...current.business,
        [field]: value,
      },
    }));
  }

  function updateContest(field, value) {
    setData((current) => ({
      ...current,
      contest: {
        ...current.contest,
        [field]: value,
      },
    }));
  }

  function updatePromotion(index, field, value) {
    setData((current) => {
      const promotions = [...current.promotions];
      promotions[index] = {
        ...promotions[index],
        [field]: value,
      };

      return {
        ...current,
        promotions,
      };
    });
  }

  function updateCustomer(index, field, value) {
    setData((current) => {
      const customers = [...current.customers];
      customers[index] = {
        ...customers[index],
        [field]: field === "points" ? Number(value || 0) : value,
      };

      return {
        ...current,
        customers,
      };
    });
  }

  function addCustomer() {
    setData((current) => ({
      ...current,
      customers: [...current.customers, createEmptyCustomer()],
    }));
  }

  function removeCustomer(customerId) {
    setData((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== customerId),
    }));
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateBusiness("logo", reader.result);
    };

    reader.readAsDataURL(file);
  }

  function executeDraw() {
    const winner = pickWinner(data.customers);

    if (!winner) {
      alert("No hay clientes con puntos para realizar el sorteo.");
      return;
    }

    setData((current) => ({
      ...current,
      contest: {
        ...current.contest,
        winner: {
          id: winner.id,
          name: winner.name,
          phone: winner.phone,
          points: winner.points,
          selectedAt: new Date().toISOString(),
        },
      },
    }));

    showSavedMessage(`Ganador seleccionado: ${winner.name}`);
  }

  function resetDemo() {
    const confirmReset = window.confirm(
      "¿Seguro que quieres reiniciar la demo local? Se perderán los cambios guardados en este dispositivo."
    );

    if (!confirmReset) {
      return;
    }

    const newData = resetDemoData();
    setData(newData);
    showSavedMessage("Demo reiniciada correctamente.");
  }

  function openPublicScreen() {
    window.location.href = "/demo-public";
  }

  function saveNow() {
    saveDemoData(data);
    showSavedMessage("Demo guardada correctamente.");
  }

  return (
    <main className="demo-page">
      <div className="demo-admin-layout">
        <header className="demo-header">
          <div>
            <h1 className="demo-title">KLIENTE DEMO LOCAL</h1>
            <p className="demo-subtitle">
              Panel para vendedores. Todo funciona localmente en este dispositivo.
            </p>
            {savedMessage ? <p className="demo-note">{savedMessage}</p> : null}
          </div>

          <div className="demo-actions">
            <button className="demo-button" type="button" onClick={saveNow}>
              Guardar
            </button>
            <button className="demo-button secondary" type="button" onClick={openPublicScreen}>
              Ver pantalla pública
            </button>
            <button className="demo-button" type="button" onClick={executeDraw}>
              Ejecutar sorteo
            </button>
            <button className="demo-button danger" type="button" onClick={resetDemo}>
              Reiniciar demo
            </button>
          </div>
        </header>

        <section className="demo-grid">
          <div className="demo-card">
            <h2>Comercio demo</h2>

            <div className="demo-form-grid">
              <div className="demo-field">
                <label>Nombre del comercio</label>
                <input
                  value={data.business.name}
                  onChange={(event) => updateBusiness("name", event.target.value)}
                />
              </div>

              <div className="demo-field">
                <label>Slogan</label>
                <input
                  value={data.business.slogan}
                  onChange={(event) => updateBusiness("slogan", event.target.value)}
                />
              </div>

              <div className="demo-field">
                <label>Color principal</label>
                <input
                  type="color"
                  value={data.business.primaryColor}
                  onChange={(event) => updateBusiness("primaryColor", event.target.value)}
                />
              </div>

              <div className="demo-field">
                <label>Color secundario</label>
                <input
                  type="color"
                  value={data.business.secondaryColor}
                  onChange={(event) => updateBusiness("secondaryColor", event.target.value)}
                />
              </div>

              <div className="demo-field">
                <label>Instagram</label>
                <input
                  value={data.business.instagram}
                  onChange={(event) => updateBusiness("instagram", event.target.value)}
                />
              </div>

              <div className="demo-field">
                <label>WhatsApp</label>
                <input
                  value={data.business.whatsapp}
                  onChange={(event) => updateBusiness("whatsapp", event.target.value)}
                />
              </div>

              <div className="demo-field full">
                <label>Texto QR</label>
                <input
                  value={data.business.qrText}
                  onChange={(event) => updateBusiness("qrText", event.target.value)}
                />
              </div>

              <div className="demo-field full">
                <label>Logo demo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
              </div>

              <div className="demo-field full">
                <div className="demo-logo-preview">
                  {data.business.logo ? (
                    <img src={data.business.logo} alt="Logo demo" />
                  ) : (
                    <span>K</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h2>Concurso</h2>

            <div className="demo-form-grid">
              <div className="demo-field full">
                <label>Nombre del concurso</label>
                <input
                  value={data.contest.title}
                  onChange={(event) => updateContest("title", event.target.value)}
                />
              </div>

              <div className="demo-field full">
                <label>Premio</label>
                <input
                  value={data.contest.prize}
                  onChange={(event) => updateContest("prize", event.target.value)}
                />
              </div>

              <div className="demo-field full">
                <label>Descripción</label>
                <textarea
                  value={data.contest.description}
                  onChange={(event) => updateContest("description", event.target.value)}
                />
              </div>

              <div className="demo-field full">
                <label>Fecha y hora del sorteo</label>
                <input
                  type="datetime-local"
                  value={data.contest.drawDate}
                  onChange={(event) => updateContest("drawDate", event.target.value)}
                />
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
            ) : (
              <p className="demo-note">Todavía no hay ganador seleccionado.</p>
            )}
          </div>
        </section>

        <section className="demo-grid" style={{ marginTop: 18 }}>
          <div className="demo-card">
            <h2>5 promociones de pantalla pública</h2>

            <div className="demo-list">
              {data.promotions.map((promotion, index) => (
                <div className="demo-promotion-row" key={promotion.id}>
                  <div className="demo-field">
                    <label>Título</label>
                    <input
                      value={promotion.title}
                      onChange={(event) =>
                        updatePromotion(index, "title", event.target.value)
                      }
                    />
                  </div>

                  <div className="demo-field">
                    <label>Descripción</label>
                    <input
                      value={promotion.description}
                      onChange={(event) =>
                        updatePromotion(index, "description", event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="demo-card">
            <div className="demo-header" style={{ marginBottom: 14 }}>
              <div>
                <h2>Clientes y puntos demo</h2>
                <p className="demo-note">Estos datos generan el ranking y el sorteo.</p>
              </div>

              <button className="demo-button secondary" type="button" onClick={addCustomer}>
                Agregar cliente
              </button>
            </div>

            <div className="demo-list">
              {data.customers.map((customer, index) => (
                <div className="demo-customer-row" key={customer.id}>
                  <div className="demo-field">
                    <label>Nombre</label>
                    <input
                      value={customer.name}
                      onChange={(event) => updateCustomer(index, "name", event.target.value)}
                    />
                  </div>

                  <div className="demo-field">
                    <label>Teléfono</label>
                    <input
                      value={customer.phone}
                      onChange={(event) => updateCustomer(index, "phone", event.target.value)}
                    />
                  </div>

                  <div className="demo-field">
                    <label>Puntos</label>
                    <input
                      type="number"
                      min="0"
                      value={customer.points}
                      onChange={(event) =>
                        updateCustomer(index, "points", event.target.value)
                      }
                    />
                  </div>

                  <button
                    className="demo-button danger"
                    type="button"
                    onClick={() => removeCustomer(customer.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="demo-footer-mark">
          Demo local para vendedores · Creado por Mitnick Connect
        </p>
      </div>
    </main>
  );
}
