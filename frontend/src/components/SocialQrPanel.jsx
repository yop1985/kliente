import { QRCodeCanvas } from "qrcode.react";

const fallbackSocialLinks = [
  {
    name: "WhatsApp",
    label: "Escanea",
    url: "https://wa.me/56912345678",
  },
  {
    name: "Instagram",
    label: "Síguenos",
    url: "https://instagram.com/tu_negocio",
  },
  {
    name: "Facebook",
    label: "Visítanos",
    url: "https://facebook.com/tu_negocio",
  },
];

export default function SocialQrPanel({ socialLinks = [] }) {
  const links = socialLinks.length > 0 ? socialLinks : fallbackSocialLinks;

  return (
    <section className="social-qr-panel">
      <div className="social-qr-header">
        <span>Conecta con nosotros</span>
        <h2>Redes sociales</h2>
      </div>

      <div className="social-qr-list">
        {links.slice(0, 3).map((item) => (
          <article className="social-qr-card" key={item.id || item.name}>
            <QRCodeCanvas
              value={item.url}
              size={64}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
              includeMargin={true}
            />

            <div className="social-qr-info">
              <strong>{item.name}</strong>
              <small>{item.label}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}