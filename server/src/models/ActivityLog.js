import mongoose from "mongoose";
import { eventSchema } from "./operationsFields.js";
const schema = eventSchema.clone();
schema.remove("notification");
schema.add({
  entityType: {
    type: String,
    enum: ["order", "booking", "staff", "settings"],
    required: true,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
});
schema.index({ eventId: 1 }, { unique: true });
schema.index({ entityType: 1, entityId: 1, createdAt: -1 });
schema.index({ createdAt: -1 });
export default mongoose.model("ActivityLog", schema);
