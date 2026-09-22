import express from "express";

import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
} from "../controllers/adminAuthController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.post(
  "/login",
  adminLogin
);

router.post(
  "/logout",
  requireAdmin,
  adminLogout
);

router.get(
  "/me",
  requireAdmin,
  getCurrentAdmin
);

export default router;