import { createHash } from "node:crypto";
import NotificationAttempt from "../models/NotificationAttempt.js";
import NotificationJob from "../models/NotificationJob.js";
import {
  notificationEvent,
  flushNotificationAudit,
} from "./notificationAudit.js";
import { notificationError } from "./notificationErrors.js";

export const recipientHash = (recipient) =>
  createHash("sha256").update(recipient.trim().toLowerCase()).digest("hex");
export async function ensureNotificationAttempt(job, transport) {
  const query = { jobId: job._id, generation: job.deliveryGeneration || 0 };
  try {
    await NotificationAttempt.updateOne(
      query,
      {
        $setOnInsert: {
          ...query,
          provider: transport.name,
          recipientHash: recipientHash(job.recipient),
          idempotencyKey: `${job.eventKey}:delivery:${query.generation}`,
          sender: transport.sender || {},
        },
      },
      { upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return NotificationAttempt.findOne(query)
    .select("+sender +idempotencyKey")
    .lean();
}
export const acceptedStates = [
  "accepted",
  "delivered",
  "bounced",
  "complained",
  "simulated",
];
export function evidenceStatus(attempt) {
  if (attempt.complainedAt) return "complained";
  if (attempt.bouncedAt) return "bounced";
  if (attempt.deliveredAt) return "delivered";
  if (attempt.providerFailedAt) return "failed";
  if (attempt.acceptedAt) return "accepted";
  return attempt.status;
}
export async function reviseAttempt(id, change) {
  for (let n = 0; n < 8; n++) {
    const current = await NotificationAttempt.findById(id).lean();
    if (!current) return null;
    const next = change(current);
    const updated = await NotificationAttempt.findOneAndUpdate(
      { _id: id, __v: current.__v },
      { $set: { ...next, projectionPending: true }, $inc: { __v: 1 } },
      { returnDocument: "after" },
    ).lean();
    if (updated) return updated;
  }
  throw new Error("Notification attempt changed concurrently.");
}
export async function projectAttempt(job, attempt, { fence = {}, event } = {}) {
  const fields = [
    "provider",
    "providerMessageId",
    "providerStatus",
    "acceptedAt",
    "deliveredAt",
    "bouncedAt",
    "complainedAt",
    "failedAt",
    "simulatedAt",
    "lastProviderEventAt",
    "lastError",
    "failureCode",
    "retryBefore",
    "uncertain",
  ];
  const set = Object.fromEntries(
    fields.map((k) => [
      k,
      attempt[k] ??
        (k.endsWith("At") || k === "retryBefore"
          ? null
          : k === "uncertain"
            ? false
            : ""),
    ]),
  );
  const update = {
    $set: {
      ...set,
      projectedAttemptVersion: attempt.__v,
      status: evidenceStatus(attempt),
      leaseToken: "",
      leaseUntil: null,
      transport: attempt.provider,
    },
    $inc: { __v: 1 },
  };
  if (event) update.$push = { eventOutbox: event };
  const result = await NotificationJob.updateOne(
    {
      _id: job._id,
      $expr: {
        $and: [
          {
            $eq: [{ $ifNull: ["$deliveryGeneration", 0] }, attempt.generation],
          },
          {
            $lte: [{ $ifNull: ["$projectedAttemptVersion", -1] }, attempt.__v],
          },
        ],
      },
      ...fence,
    },
    update,
  );
  if (result.modifiedCount && event) await flushNotificationAudit(job._id);
  if (
    result.modifiedCount ||
    (job.deliveryGeneration || 0) > attempt.generation
  )
    await NotificationAttempt.updateOne(
      { _id: attempt._id, __v: attempt.__v },
      { $set: { projectionPending: false } },
    );
  return result.modifiedCount;
}
export async function recordAcceptance(job, attempt, result, now, fence) {
  // Retain acceptance activity before projecting attempt/job state. A webhook
  // may resolve the lease before our projection; that must not lose this audit.
  const action = result.simulated ? "simulated" : "accepted";
  const event = notificationEvent(
    {
      ...(job.toObject?.() || job),
      provider: result.provider || attempt.provider,
    },
    action,
    result.simulated
      ? "Notification test simulated; no external message sent."
      : "Email provider accepted the message. Recipient-server delivery is not yet confirmed.",
    {
      key: `notification:${job._id}:delivery:${attempt.generation}:${action}`,
      at: now,
    },
  );
  await NotificationJob.updateOne(
    { _id: job._id, "eventOutbox.eventId": { $ne: event.eventId } },
    { $push: { eventOutbox: event } },
  );
  const updated = await reviseAttempt(attempt._id, (current) => {
    if (
      current.providerMessageId &&
      current.providerMessageId !== result.providerMessageId
    )
      throw notificationError("conflict", { permanent: true, uncertain: true });
    const next = {
      ...current,
      status: result.simulated ? "simulated" : "accepted",
      uncertain: false,
      lastError: "",
      failureCode: "",
    };
    if (result.providerMessageId)
      next.providerMessageId = result.providerMessageId;
    if (result.simulated) next.simulatedAt = now;
    else next.acceptedAt = current.acceptedAt || now;
    next.status = evidenceStatus(next);
    // Never erase a concurrent authenticated bounce/complaint/failure.
    if (["failed", "bounced", "complained"].includes(next.status)) {
      next.lastError = current.lastError;
      next.failureCode = current.failureCode;
    }
    const { _id, __v, createdAt, updatedAt, ...fields } = next;
    return fields;
  });
  await projectAttempt(job, updated, { fence });
  await flushNotificationAudit(job._id);
  return updated;
}
