import express from "express";

import {
  getAdminSettings,
  updateAdminSettings,
} from "../controllers/adminSettingsController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.use(requireAdmin);

router.get(
  "/",
  getAdminSettings
);

router.put(
  "/",
  updateAdminSettings
);

export default router;