import { useEffect, useState } from "react";

function Countdown() {
  const targetDate = new Date("2026-05-30T20:00:00").getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        finished: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      finished: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft.finished) {
    return (
      <div
        style={{
          background: "#0d0d0f",
          color: "#e8b84b",
          padding: "16px",
          borderRadius: "16px",
          textAlign: "center",
          fontWeight: "800",
          fontSize: "20px",
        }}
      >
        Sorteo finalizado — el sistema elegirá ganador
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(13,13,15,0.18)",
        padding: "16px",
        borderRadius: "16px",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          fontWeight: "700",
          marginBottom: "12px",
        }}
      >
        Cuenta regresiva del sorteo
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
        }}
      >
        <TimeBox value={timeLeft.days} label="Días" />
        <TimeBox value={timeLeft.hours} label="Horas" />
        <TimeBox value={timeLeft.minutes} label="Min" />
        <TimeBox value={timeLeft.seconds} label="Seg" />
      </div>
    </div>
  );
}

function TimeBox({ value, label }) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#0d0d0f",
        borderRadius: "12px",
        padding: "10px 6px",
        textAlign: "center",
      }}
    >
      <strong
        style={{
          display: "block",
          fontSize: "24px",
          color: "#c9942a",
          lineHeight: "1",
        }}
      >
        {String(value).padStart(2, "0")}
      </strong>

      <span
        style={{
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default Countdown;