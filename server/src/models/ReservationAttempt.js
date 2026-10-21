import mongoose from "mongoose";
const schema = new mongoose.Schema({
  keyHash: { type: String, required: true, unique: true },
  requestHash: { type: String, required: true },
  orderNumber: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  state: { type: String, enum: ["reserving", "committing", "completed", "compensating", "failed"], default: "reserving", index: true },
  lastError: { type: String, default: "" },
}, { timestamps: true });
export default mongoose.model("ReservationAttempt", schema);
