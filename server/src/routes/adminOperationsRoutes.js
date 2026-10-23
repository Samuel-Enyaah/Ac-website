import express from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  assignOperation,
  appendOperationNote,
  operationalDetail,
  validId,
} from "../services/operations.js";
import { retryNotification } from "../services/notifications.js";
import {
  listNotifications,
  notificationHealth,
} from "../services/notificationReads.js";
import { notificationSummary } from "../services/notificationState.js";
import { operationalError } from "../services/operationEvents.js";
const router = express.Router();
router.use(requireAdmin);
const mutationLimit = rateLimit({
  windowMs: 60000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
router.get("/notifications", async (req, res, next) => {
  try {
    res.json({ success: true, ...(await listNotifications(req.query)) });
  } catch (error) {
    next(error);
  }
});
router.get("/notifications/health", async (req, res, next) => {
  try {
    res.json({ success: true, health: await notificationHealth() });
  } catch (error) {
    next(error);
  }
});
router.post(
  "/notifications/:notificationId/retry",
  mutationLimit,
  async (req, res, next) => {
    try {
      validId(req.params.notificationId);
      if (Object.keys(req.body || {}).length)
        throw operationalError(
          "Retry accepts no recipient, payload or delivery overrides.",
          400,
        );
      const notification = await retryNotification(
        req.params.notificationId,
        req.admin,
      );
      res.json({
        success: true,
        notification: notificationSummary(notification.toObject()),
      });
    } catch (error) {
      next(error);
    }
  },
);
for (const [path, type] of [
  ["orders", "order"],
  ["bookings", "booking"],
]) {
  for (const [action, fn] of [
    ["assignment", assignOperation],
    ["notes", appendOperationNote],
  ]) {
    router.post(
      `/${path}/:id/${action}`,
      mutationLimit,
      async (req, res, next) => {
        try {
          const record = await fn(type, req.params.id, req.body, req.admin);
          res.json({
            success: true,
            [type]: await operationalDetail(type, record),
          });
        } catch (error) {
          next(error);
        }
      },
    );
  }
}
export default router;
