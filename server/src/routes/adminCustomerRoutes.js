import express from "express";

import {
  getAdminCustomerByKey,
  getAdminCustomers,
} from "../controllers/adminCustomerController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.use(requireAdmin);

router.get(
  "/",
  getAdminCustomers
);

router.get(
  "/:customerKey",
  getAdminCustomerByKey
);

export default router;