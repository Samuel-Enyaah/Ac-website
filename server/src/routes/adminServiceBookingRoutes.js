import express from "express";

import {
  getAdminServiceBookingById,
  getAdminServiceBookings,
  updateAdminServiceBooking,
} from "../controllers/adminServiceBookingController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.use(
  requireAdmin
);

router.get(
  "/",
  getAdminServiceBookings
);

router.get(
  "/:bookingId",
  getAdminServiceBookingById
);

router.patch(
  "/:bookingId",
  updateAdminServiceBooking
);

export default router;