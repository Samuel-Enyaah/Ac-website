import express from "express";

import {
  getAdminDashboard,
} from "../controllers/adminDashboardController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.get(
  "/",
  requireAdmin,
  getAdminDashboard
);

export default router;