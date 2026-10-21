import mongoose from "mongoose";
const schema = new mongoose.Schema({
  provider: { type: String, default: "cloudinary", enum: ["cloudinary"] },
  publicId: { type: String, required: true, unique: true },
  resourceType: { type: String, default: "image", enum: ["image"] },
  operation: { type: String, default: "destroy" },
  contextType: { type: String, enum: ["product", "settings"], required: true },
  contextId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: String,
  status: { type: String, enum: ["pending", "processing", "completed"], default: "pending" },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
  nextRetryAt: { type: Date, default: Date.now },
  leaseUntil: Date,
  leaseToken: String,
  completedAt: Date,
}, { timestamps: true });
schema.index({ status: 1, nextRetryAt: 1, leaseUntil: 1 });
export default mongoose.model("MediaCleanupJob", schema);
