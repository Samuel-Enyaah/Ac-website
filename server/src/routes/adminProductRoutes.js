import express from "express";

import {
  reorderAdminProductImages,
  adjustProductInventory,
  createAdminProduct,
  deleteAdminProductImage,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct,
  uploadAdminProductImages,
} from "../controllers/adminProductController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

import {
  uploadProductImages,
} from "../middleware/imageUpload.js";

const router =
  express.Router();

router.use(
  requireAdmin
);

router.get(
  "/",
  getAdminProducts
);

router.post(
  "/",
  createAdminProduct
);

/*
 * Product-specific routes
 */
router.get(
  "/:productId",
  getAdminProductById
);

router.patch(
  "/:productId",
  updateAdminProduct
);

/*
 * Inventory management
 */
router.patch(
  "/:productId/inventory",
  adjustProductInventory
);

/*
 * Cloudinary image management
 */
router.post(
  "/:productId/images",
  uploadProductImages,
  uploadAdminProductImages
);

router.delete(
  "/:productId/images",
  deleteAdminProductImage
);

router.patch("/:productId/images/order", reorderAdminProductImages);

export default router;
