import express from "express";

import {
  adjustProductInventory,
  createAdminProduct,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct,
} from "../controllers/adminProductController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.use(requireAdmin);

router.get(
  "/",
  getAdminProducts
);

router.post(
  "/",
  createAdminProduct
);

router.get(
  "/:productId",
  getAdminProductById
);

router.patch(
  "/:productId",
  updateAdminProduct
);

router.patch(
  "/:productId/inventory",
  adjustProductInventory
);

export default router;