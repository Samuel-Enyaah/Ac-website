import api from "./api";

export async function getAdminOrders(
  params = {}
) {
  const response =
    await api.get(
      "/admin/orders",
      {
        params,
      }
    );

  return response.data;
}

export async function getAdminOrder(
  orderId
) {
  const response =
    await api.get(
      `/admin/orders/${orderId}`
    );

  return response.data.order;
}

export async function updateAdminOrder(
  orderId,
  updates
) {
  const response =
    await api.patch(
      `/admin/orders/${orderId}`,
      updates
    );

  return response.data.order;
}