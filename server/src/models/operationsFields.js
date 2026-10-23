import mongoose from "mongoose";

const id = mongoose.Schema.Types.ObjectId;
export const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    action: { type: String, required: true },
    actorType: {
      type: String,
      enum: ["admin", "customer", "system"],
      required: true,
    },
    actorId: { type: id, default: null },
    actorName: { type: String, default: "" },
    summary: { type: String, required: true },
    metadata: {
      fromStatus: String,
      toStatus: String,
      fromPayment: String,
      toPayment: String,
      staffId: id,
      previousStaffId: id,
      noteId: String,
      fields: [String],
      notificationId: id,
      template: String,
      provider: String,
      generation: Number,
      failureCode: String,
    },
    notification: { template: String, recipient: String, reference: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const outboxFields = {
  eventOutbox: { type: [eventSchema], default: [], select: false },
};

export const operationsFields = {
  ...outboxFields,
  assignedStaff: { type: id, ref: "Staff", default: null },
  assignedStaffName: { type: String, default: "" },
  assignedAt: { type: Date, default: null },
  assignmentHistory: {
    type: [
      {
        staffId: { type: id, ref: "Staff" },
        name: String,
        role: String,
        previousStaffId: id,
        assignedAt: Date,
        actorId: { type: id, ref: "Admin" },
        actorName: String,
        note: { type: String, maxlength: 1000 },
      },
    ],
    default: [],
  },
  internalNotes: {
    type: [
      {
        noteId: String,
        text: { type: String, maxlength: 2000 },
        authorId: { type: id, ref: "Admin" },
        authorName: String,
        createdAt: Date,
      },
    ],
    default: [],
  },
  lastActivity: { summary: String, at: Date },
};
