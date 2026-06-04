const API_BASE_URL = "http://localhost:4000/api";

export async function getPublicDashboard() {
  const response = await fetch(`${API_BASE_URL}/public/dashboard`);

  if (!response.ok) {
    throw new Error("No se pudo cargar la información pública");
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.message || "Respuesta inválida del servidor");
  }

  return result.data;
}