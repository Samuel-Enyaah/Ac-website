import api from "./api";

export async function getProducts(params = {}) {
  const response = await api.get("/products", {
    params,
  });

  return response.data.products;
}

export async function getProductBySlug(slug) {
  const response = await api.get(
    `/products/${slug}`
  );

  return response.data.product;
}