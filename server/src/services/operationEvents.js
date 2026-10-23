import { randomUUID } from "node:crypto";
import { normalizedEmail } from "./emailConfiguration.js";

export const operationalError = (message, statusCode = 409) =>
  Object.assign(new Error(message), { statusCode, expose: true });

// Only explicitly selected metadata enters the audit; never copy req.body or errors.
export function operationEvent(
  action,
  summary,
  { admin, metadata = {}, notification, eventId, actorType } = {},
) {
  const allowed = [
    "fromStatus",
    "toStatus",
    "fromPayment",
    "toPayment",
    "staffId",
    "previousStaffId",
    "noteId",
    "fields",
    "notificationId",
    "template",
    "provider",
    "generation",
    "failureCode",
  ];
  return {
    eventId: eventId || randomUUID(),
    action,
    summary,
    actorType: admin ? "admin" : actorType || "system",
    actorId: admin?._id || null,
    actorName: admin?.name || "",
    metadata: Object.fromEntries(
      allowed
        .filter((key) => metadata[key] !== undefined)
        .map((key) => [key, metadata[key]]),
    ),
    ...(notification ? { notification } : {}),
    createdAt: new Date(),
  };
}

export function customerNotification(
  entityType,
  record,
  status = record.status,
) {
  const recipient = normalizedEmail(record.customer?.email);
  if (!recipient) return undefined;
  const statuses =
    entityType === "order"
      ? [
          "pending",
          "confirmed",
          "ready",
          "out-for-delivery",
          "delivered",
          "cancelled",
        ]
      : [
          "pending",
          "confirmed",
          "technician-assigned",
          "in-progress",
          "completed",
          "cancelled",
        ];
  if (
    !statuses.includes(status) ||
    (entityType === "order" &&
      status === "ready" &&
      record.fulfillmentMethod !== "pickup")
  )
    return undefined;
  return {
    template: `${entityType}.${status}`,
    recipient,
    reference: record.orderNumber || record.bookingNumber,
  };
}
