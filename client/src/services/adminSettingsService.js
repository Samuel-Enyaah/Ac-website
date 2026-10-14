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

export async function uploadBusinessLogo(
  file
) {
  const formData =
    new FormData();

  formData.append(
    "image",
    file
  );

  const response =
    await api.post(
      "/admin/settings/logo",
      formData
    );

  return response.data;
}

export async function deleteBusinessLogo() {
  const response =
    await api.delete(
      "/admin/settings/logo"
    );

  return response.data;
}