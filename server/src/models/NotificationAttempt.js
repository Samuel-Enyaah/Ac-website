import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationJob",
      required: true,
      immutable: true,
    },
    generation: { type: Number, required: true, immutable: true },
    provider: { type: String, required: true, immutable: true },
    recipientHash: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },
    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },
    sender: {
      type: new mongoose.Schema(
        { from: String, replyTo: String },
        { _id: false },
      ),
      immutable: true,
      select: false,
    },
    status: { type: String, default: "processing" },
    firstDispatchAt: Date,
    retryBefore: Date,
    uncertain: { type: Boolean, default: false },
    projectionPending: { type: Boolean, default: false },
    providerMessageId: String,
    providerStatus: { type: String, default: "" },
    acceptedAt: Date,
    deliveredAt: Date,
    bouncedAt: Date,
    complainedAt: Date,
    failedAt: Date,
    providerFailedAt: Date,
    simulatedAt: Date,
    lastProviderEventAt: Date,
    failureCode: { type: String, default: "" },
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);
schema.index({ jobId: 1, generation: 1 }, { unique: true });
schema.index(
  { provider: 1, providerMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { providerMessageId: { $type: "string" } },
  },
);
schema.index({ recipientHash: 1, status: 1 });
schema.index({ projectionPending: 1, updatedAt: 1 });
export default mongoose.model("NotificationAttempt", schema);
