import api from "./api";

export async function getAdminCustomers(
  params = {}
) {
  const response =
    await api.get(
      "/admin/customers",
      {
        params,
      }
    );

  return response.data;
}

export async function getAdminCustomer(
  customerKey
) {
  const response =
    await api.get(
      `/admin/customers/${customerKey}`
    );

  return response.data;
}