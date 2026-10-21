import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";
import Staff from "../models/Staff.js";
import {
  operationEvent,
  operationalError,
  customerNotification,
} from "./operationEvents.js";
import {
  assertTransition,
  allowedTransitions,
  orderTransitions,
  bookingTransitions,
} from "./operationWorkflows.js";
import { operationHistory, flushOperations } from "./operationsOutbox.js";

const models = { order: Order, booking: ServiceBooking };
export function validId(id) {
  if (!mongoose.isValidObjectId(id))
    throw operationalError("Invalid record identifier.", 400);
}
export async function operationalDetail(type, record) {
  const data = record.toObject ? record.toObject() : record;
  delete data.eventOutbox;
  delete data.keyHash;
  delete data.requestHash;
  delete data.receipt;
  const staff = data.assignedStaff
    ? await Staff.findById(data.assignedStaff).select("name active role").lean()
    : null;
  return {
    ...data,
    assignedStaffActive: staff?.active ?? null,
    allowedTransitions: allowedTransitions(type, data),
    ...(await operationHistory(type, data._id)),
  };
}

export async function changeOperation(type, id, input, admin) {
  validId(id);
  const schema = z
    .object({
      status: z
        .enum(
          Object.keys(type === "order" ? orderTransitions : bookingTransitions),
        )
        .optional(),
      ...(type === "order"
        ? {
            paymentStatus: z
              .enum(["pending", "paid", "failed", "refunded"])
              .optional(),
          }
        : {}),
    })
    .strict()
    .refine((data) => Object.keys(data).length);
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw operationalError("Invalid operational update.", 400);
  const Model = models[type];
  for (let n = 0; n < 5; n++) {
    const current = await Model.findById(id);
    if (!current) throw operationalError("Record not found.", 404);
    assertTransition(type, current, parsed.data.status);
    const events = [];
    const status = parsed.data.status;
    if (status && status !== current.status)
      events.push(
        operationEvent(
          status === "cancelled"
            ? "cancelled"
            : status === "completed"
              ? "completed"
              : "status-changed",
          `Status changed from ${current.status} to ${status}.`,
          {
            admin,
            metadata: { fromStatus: current.status, toStatus: status },
            notification: customerNotification(type, current, status),
          },
        ),
      );
    if (
      parsed.data.paymentStatus &&
      parsed.data.paymentStatus !== current.paymentStatus
    )
      events.push(
        operationEvent(
          "payment-status-changed",
          `Payment record changed from ${current.paymentStatus} to ${parsed.data.paymentStatus}.`,
          {
            admin,
            metadata: {
              fromPayment: current.paymentStatus,
              toPayment: parsed.data.paymentStatus,
            },
          },
        ),
      );
    if (!events.length) return current;
    const latest = events.at(-1);
    const updated = await Model.findOneAndUpdate(
      { _id: id, __v: current.__v },
      {
        $set: {
          ...parsed.data,
          lastActivity: { summary: latest.summary, at: latest.createdAt },
        },
        $inc: { __v: 1 },
        $push: { eventOutbox: { $each: events } },
      },
      { returnDocument: "after", runValidators: true },
    );
    if (updated) {
      await flushOperations(type, id);
      return updated;
    }
  }
  throw operationalError("This record changed. Refresh and try again.");
}

export async function assignOperation(type, id, input, admin) {
  validId(id);
  const parsed = z
    .object({
      staffId: z.string(),
      note: z.string().trim().max(1000).default(""),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success)
    throw operationalError(
      "Choose a staff member and an assignment note of at most 1000 characters.",
      400,
    );
  validId(parsed.data.staffId);
  // Linearization point for eligibility: deactivation serialized before this
  // claim prevents assignment; deactivation afterward retains the history.
  const staff = await Staff.findOneAndUpdate(
    { _id: parsed.data.staffId, active: true },
    { $inc: { assignmentVersion: 1 } },
    { returnDocument: "after", timestamps: false },
  );
  if (!staff)
    throw operationalError(
      "Staff member is missing or inactive. Choose an active staff member.",
      400,
    );
  const Model = models[type];
  for (let n = 0; n < 5; n++) {
    const current = await Model.findById(id);
    if (!current) throw operationalError("Record not found.", 404);
    if (["cancelled", "completed", "delivered"].includes(current.status))
      throw operationalError("A closed record cannot be reassigned.");
    if (String(current.assignedStaff) === String(staff._id)) return current;
    if (current.assignmentHistory.length >= 500)
      throw operationalError(
        "Assignment history limit reached. Contact an administrator.",
      );
    const at = new Date();
    const event = operationEvent(
      current.assignedStaff ? "reassigned" : "assigned",
      `${current.assignedStaff ? "Responsibility reassigned" : "Responsibility assigned"} to ${staff.name}.`,
      {
        admin,
        metadata: {
          staffId: staff._id,
          previousStaffId: current.assignedStaff,
        },
      },
    );
    const history = {
      staffId: staff._id,
      name: staff.name,
      role: staff.role,
      previousStaffId: current.assignedStaff,
      assignedAt: at,
      actorId: admin._id,
      actorName: admin.name,
      note: parsed.data.note,
    };
    const updated = await Model.findOneAndUpdate(
      { _id: id, __v: current.__v },
      {
        $set: {
          assignedStaff: staff._id,
          assignedStaffName: staff.name,
          assignedAt: at,
          lastActivity: { summary: event.summary, at },
        },
        $inc: { __v: 1 },
        $push: { assignmentHistory: history, eventOutbox: event },
      },
      { returnDocument: "after", runValidators: true },
    );
    if (updated) {
      await flushOperations(type, id);
      return updated;
    }
  }
  throw operationalError("This record changed. Refresh and try again.");
}

export async function appendOperationNote(type, id, input, admin) {
  validId(id);
  const parsed = z
    .object({
      text: z.string().trim().min(1).max(2000),
      noteId: z.uuid().optional(),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success)
    throw operationalError("Enter an internal note of 1-2000 characters.", 400);
  const noteId = parsed.data.noteId || randomUUID();
  const note = {
    noteId,
    text: parsed.data.text,
    authorId: admin._id,
    authorName: admin.name,
    createdAt: new Date(),
  };
  const event = operationEvent(
    "internal-note-added",
    "Internal operational note added.",
    { admin, metadata: { noteId } },
  );
  const Model = models[type];
  const updated = await Model.findOneAndUpdate(
    {
      _id: id,
      "internalNotes.noteId": { $ne: noteId },
      "internalNotes.499": { $exists: false },
    },
    {
      $push: { internalNotes: note, eventOutbox: event },
      $set: { lastActivity: { summary: event.summary, at: note.createdAt } },
      $inc: { __v: 1 },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (updated) {
    await flushOperations(type, id);
    return updated;
  }
  const existing = await Model.findById(id);
  if (!existing) throw operationalError("Record not found.", 404);
  const previous = existing.internalNotes.find((n) => n.noteId === noteId);
  if (
    previous &&
    previous.text === note.text &&
    String(previous.authorId) === String(admin._id)
  )
    return existing;
  throw operationalError(
    "Note was already used for different content or the history limit was reached.",
  );
}
