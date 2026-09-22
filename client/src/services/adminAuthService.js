import api from "./api";

export async function loginAdmin(
  credentials
) {
  const response =
    await api.post(
      "/admin/auth/login",
      credentials
    );

  return response.data.admin;
}

export async function getCurrentAdmin() {
  const response =
    await api.get(
      "/admin/auth/me"
    );

  return response.data.admin;
}

export async function logoutAdmin() {
  await api.post(
    "/admin/auth/logout"
  );
}