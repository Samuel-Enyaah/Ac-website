import api from "./api";

export async function getPublicSettings() {
  const response = await api.get("/settings");

  return response.data.settings;
}