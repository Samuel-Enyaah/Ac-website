import express from "express";
import rateLimit from "express-rate-limit";
import {
  verifyResendWebhook,
  retainWebhook,
} from "../services/notificationWebhooks.js";
const router = express.Router();
router.post(
  "/",
  rateLimit({
    windowMs: 60000,
    limit: 600,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  express.raw({ type: "application/json", limit: "128kb" }),
  async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body))
        return res
          .status(400)
          .json({ success: false, message: "Invalid webhook request." });
      const evidence = verifyResendWebhook(
        req.body,
        req.headers,
        process.env.RESEND_WEBHOOK_SECRET,
      );
      // Acknowledge only after durable storage. Worker handles processing/replay.
      await retainWebhook(evidence);
      return res.status(202).json({ success: true });
    } catch (error) {
      const status = [400, 401, 503].includes(error.statusCode)
        ? error.statusCode
        : 503;
      return res
        .status(status)
        .json({
          success: false,
          message:
            status === 503
              ? "Webhook processing unavailable."
              : "Invalid webhook request.",
        });
    }
  },
);
export default router;
