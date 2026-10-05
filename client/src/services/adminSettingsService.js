import api from "./api";

export async function getAdminSettings() {
  const response =
    await api.get(
      "/admin/settings"
    );

  return response.data.settings;
}

export async function updateAdminSettings(
  settings
) {
  const response =
    await api.put(
      "/admin/settings",
      settings
    );

  return response.data.settings;
}