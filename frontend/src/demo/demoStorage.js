import { demoInitialData } from "./demoSeed";

const STORAGE_KEY = "kliente_demo_local_data";

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

export function getDefaultDemoData() {
  const data = cloneData(demoInitialData);

  if (!data.contest.drawDate) {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    nextMonth.setHours(20, 0, 0, 0);
    data.contest.drawDate = nextMonth.toISOString().slice(0, 16);
  }

  return data;
}

export function loadDemoData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const defaultData = getDefaultDemoData();
      saveDemoData(defaultData);
      return defaultData;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error("Error cargando demo local:", error);
    const defaultData = getDefaultDemoData();
    saveDemoData(defaultData);
    return defaultData;
  }
}

export function saveDemoData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetDemoData() {
  const defaultData = getDefaultDemoData();
  saveDemoData(defaultData);
  return defaultData;
}

export function getRanking(customers) {
  return [...customers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
    .slice(0, 10);
}

export function pickWinner(customers) {
  const validCustomers = customers.filter((customer) => Number(customer.points || 0) > 0);

  if (validCustomers.length === 0) {
    return null;
  }

  const totalPoints = validCustomers.reduce(
    (total, customer) => total + Number(customer.points || 0),
    0
  );

  let random = Math.random() * totalPoints;

  for (const customer of validCustomers) {
    random -= Number(customer.points || 0);

    if (random <= 0) {
      return customer;
    }
  }

  return validCustomers[0];
}

export function formatDateTime(value) {
  if (!value) {
    return "Sin fecha configurada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCountdown(drawDate) {
  if (!drawDate) {
    return {
      expired: false,
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const target = new Date(drawDate).getTime();
  const now = Date.now();
  const distance = target - now;

  if (distance <= 0) {
    return {
      expired: true,
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return {
    expired: false,
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}