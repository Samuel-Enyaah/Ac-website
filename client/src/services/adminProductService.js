import api from "./api";

/*
 * PRODUCT LIST
 */
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

/*
 * SINGLE PRODUCT
 */
export async function getAdminProduct(
  productId
) {
  const response =
    await api.get(
      `/admin/products/${productId}`
    );

  return response.data.product;
}

/*
 * Backward-compatible alias
 * for older components.
 */
export async function getAdminProductById(
  productId
) {
  return getAdminProduct(
    productId
  );
}

/*
 * CREATE PRODUCT
 */
export async function createAdminProduct(
  payload
) {
  const response =
    await api.post(
      "/admin/products",
      payload
    );

  return response.data.product;
}

/*
 * UPDATE PRODUCT
 */
export async function updateAdminProduct(
  productId,
  payload
) {
  const response =
    await api.patch(
      `/admin/products/${productId}`,
      payload
    );

  return response.data.product;
}

/*
 * INVENTORY
 */
export async function adjustProductInventory(
  productId,
  payload
) {
  const response =
    await api.patch(
      `/admin/products/${productId}/inventory`,
      payload
    );

  return response.data;
}

/*
 * IMPORTANT:
 * Existing AdminInventory.jsx uses
 * adjustAdminInventory.
 *
 * Keep this alias so we do not break
 * the inventory system.
 */
export async function adjustAdminInventory(
  productId,
  payload
) {
  const result = await adjustProductInventory(
    productId,
    payload
  );
  return result.product;
}

/*
 * CLOUDINARY PRODUCT IMAGES
 */
export async function uploadAdminProductImages(
  productId,
  files, onUploadProgress
) {
  const formData =
    new FormData();

  files.forEach((file) => {
    formData.append(
      "images",
      file
    );
  });

  /*
   * Do not manually set
   * Content-Type.
   * The browser automatically adds
   * the multipart boundary.
   */
  const response =
    await api.post(
      `/admin/products/${productId}/images`,
      formData, { timeout: 120000, onUploadProgress }
    );

  return response.data;
}

/*
 * DELETE CLOUDINARY PRODUCT IMAGE
 */
export async function deleteAdminProductImage(
  productId,
  publicId, imageId
) {
  const response =
    await api.delete(
      `/admin/products/${productId}/images`,
      {
        data: {
          publicId, imageId,
        },
      }
    );

  return response.data;
}
export async function reorderAdminProductImages(productId, imageIds) {
  const response = await api.patch(`/admin/products/${productId}/images/order`, { imageIds });
  return response.data;
}
