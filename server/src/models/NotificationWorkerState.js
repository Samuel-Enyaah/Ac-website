import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "email" },
    startedAt: Date,
    completedAt: Date,
    progressedAt: Date,
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);
export default mongoose.model("NotificationWorkerState", schema);
