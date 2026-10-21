import mongoose from "mongoose";
import { outboxFields } from "./operationsFields.js";
export const staffRoles = [
  "Administrator",
  "Operations",
  "Technician",
  "Customer Support",
];
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    role: { type: String, enum: staffRoles, required: true },
    active: { type: Boolean, default: true },
    skills: { type: [String], default: [] },
    notes: { type: String, default: "", maxlength: 2000 },
    assignmentVersion: { type: Number, default: 0, select: false },
    ...outboxFields,
  },
  { timestamps: true },
);
schema.index({ active: 1, role: 1, name: 1 });
schema.index({ "eventOutbox.createdAt": 1 });
export default mongoose.model("Staff", schema);
