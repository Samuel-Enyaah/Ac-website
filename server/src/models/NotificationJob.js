import mongoose from "mongoose";
import { outboxFields } from "./operationsFields.js";
const schema = new mongoose.Schema(
  {
    ...outboxFields,
    eventKey: { type: String, required: true, unique: true, immutable: true },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      required: true,
      immutable: true,
    },
    template: { type: String, required: true, immutable: true },
    recipient: { type: String, required: true, immutable: true },
    entityType: {
      type: String,
      enum: ["order", "booking"],
      required: true,
      immutable: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },
    reference: { type: String, default: "" },
    payload: {
      type: new mongoose.Schema(
        Object.fromEntries(
          ["reference", "subject", "text", "html"].map((key) => [
            key,
            { type: String, immutable: true },
          ]),
        ),
        { _id: false },
      ),
      immutable: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "retrying",
        "processing",
        "accepted",
        "delivered",
        "bounced",
        "complained",
        "sent",
        "failed",
        "simulated",
      ],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    cycleAttempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    retryCount: { type: Number, default: 0 },
    deliveryGeneration: { type: Number, default: 0 },
    projectedAttemptVersion: { type: Number, default: -1 },
    failureCode: { type: String, default: "" },
    provider: { type: String, default: "" },
    providerMessageId: String,
    providerStatus: { type: String, default: "" },
    acceptedAt: Date,
    deliveredAt: Date,
    bouncedAt: Date,
    complainedAt: Date,
    lastProviderEventAt: Date,
    retryBefore: Date,
    uncertain: { type: Boolean, default: false },
    lastError: { type: String, default: "" },
    nextRetryAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
    simulatedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    leaseToken: { type: String, default: "", select: false },
    leaseUntil: { type: Date, default: null },
    transport: { type: String, default: "" },
    lastRetriedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true },
);
schema.index({ status: 1, nextRetryAt: 1, leaseUntil: 1 });
schema.index({ entityType: 1, entityId: 1, createdAt: -1 });
schema.index({ reference: 1, createdAt: -1 });
schema.index({ provider: 1, providerMessageId: 1 });
schema.index({ status: 1, createdAt: -1 });
export default mongoose.model("NotificationJob", schema);
