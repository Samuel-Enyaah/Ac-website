import api from "./api";

export async function getAdminProducts(
  params = {}
) {
  const response =
    await api.get(
      "/admin/products",
      {
        params,
      }
    );

  return response.data;
}

export async function getAdminProduct(
  productId
) {
  const response =
    await api.get(
      `/admin/products/${productId}`
    );

  return response.data.product;
}

export async function createAdminProduct(
  data
) {
  const response =
    await api.post(
      "/admin/products",
      data
    );

  return response.data.product;
}

export async function updateAdminProduct(
  productId,
  data
) {
  const response =
    await api.patch(
      `/admin/products/${productId}`,
      data
    );

  return response.data.product;
}

export async function adjustAdminInventory(
  productId,
  data
) {
  const response =
    await api.patch(
      `/admin/products/${productId}/inventory`,
      data
    );

  return response.data.product;
}