import mongoose from "mongoose";
// Only authenticated, allowlisted evidence. Never store the raw provider payload.
const schema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, immutable: true },
    provider: { type: String, default: "resend", immutable: true },
    providerMessageId: { type: String, required: true, immutable: true },
    type: { type: String, required: true, immutable: true },
    occurredAt: { type: Date, required: true, immutable: true },
    processedAt: { type: Date, default: null },
    nextAttemptAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 86400000),
    },
  },
  { timestamps: true },
);
schema.index({ processedAt: 1, nextAttemptAt: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("NotificationWebhookEvent", schema);
