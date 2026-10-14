import express from "express";

import {
  getAdminSettings,
  updateAdminSettings,
} from "../controllers/adminSettingsController.js";

import {
  deleteBusinessLogo,
  uploadBusinessLogo,
} from "../controllers/adminMediaController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

import {
  uploadSingleImage,
} from "../middleware/imageUpload.js";

const router =
  express.Router();

router.use(
  requireAdmin
);

/*
 * Business settings
 */
router.get(
  "/",
  getAdminSettings
);

router.put(
  "/",
  updateAdminSettings
);

/*
 * Business logo
 */
router.post(
  "/logo",
  uploadSingleImage,
  uploadBusinessLogo
);

router.delete(
  "/logo",
  deleteBusinessLogo
);

export default router;