import { z } from "zod";
import { Webhook } from "svix";
import NotificationWebhookEvent from "../models/NotificationWebhookEvent.js";
import NotificationAttempt from "../models/NotificationAttempt.js";
import NotificationJob from "../models/NotificationJob.js";
import {
  reviseAttempt,
  evidenceStatus,
  projectAttempt,
} from "./notificationAttempts.js";
import {
  notificationEvent,
  flushNotificationAudit,
} from "./notificationAudit.js";
import {
  notificationError,
  sanitizedNotificationError,
} from "./notificationErrors.js";

export const providerEventTypes = [
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
  "email.delivery_delayed",
];
const payloadSchema = z.object({
  type: z.enum(providerEventTypes),
  created_at: z.string().datetime({ offset: true }),
  data: z.object({ email_id: z.uuid() }),
});
export function verifyResendWebhook(
  rawBody,
  headers,
  secret,
  now = new Date(),
) {
  if (!secret?.startsWith("whsec_"))
    throw Object.assign(new Error("Webhook is not configured."), {
      statusCode: 503,
    });
  let payload;
  try {
    new Webhook(secret).verify(rawBody, headers);
  } catch {
    throw Object.assign(new Error("Invalid webhook authentication."), {
      statusCode: 401,
    });
  }
  // Svix 2 verifies bytes without parsing. Parse only after authentication.
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    throw Object.assign(new Error("Invalid webhook event."), {
      statusCode: 400,
    });
  }
  const parsed = payloadSchema.safeParse(payload);
  const eventId = headers["svix-id"];
  if (
    !parsed.success ||
    typeof eventId !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(eventId) ||
    Date.parse(parsed.data.created_at) > now.getTime() + 300000
  )
    throw Object.assign(new Error("Invalid webhook event."), {
      statusCode: 400,
    });
  return {
    eventId,
    provider: "resend",
    providerMessageId: parsed.data.data.email_id,
    type: parsed.data.type,
    occurredAt: new Date(parsed.data.created_at),
  };
}

export async function retainWebhook(evidence) {
  try {
    await NotificationWebhookEvent.updateOne(
      { eventId: evidence.eventId },
      { $setOnInsert: evidence },
      { upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}
const earliest = (a, b) => (a && new Date(a) < b ? a : b);
const latest = (a, b) => (a && new Date(a) > b ? a : b);
export async function processWebhookEvent(event, now = new Date()) {
  const attempt = await NotificationAttempt.findOne({
    provider: "resend",
    providerMessageId: event.providerMessageId,
  }).lean();
  if (!attempt) {
    // Webhooks can beat the send response. Keep only minimal authenticated
    // evidence; a later pass resolves it by server-persisted provider message ID.
    await NotificationWebhookEvent.updateOne(
      { _id: event._id, processedAt: null },
      { $set: { nextAttemptAt: new Date(now.getTime() + 60000) } },
    );
    return false;
  }
  const job = await NotificationJob.findById(attempt.jobId).lean();
  if (!job) return false;
  const at = new Date(event.occurredAt);
  const updated = await reviseAttempt(attempt._id, (current) => {
    const next = {
      ...current,
      uncertain: false,
      lastProviderEventAt: latest(current.lastProviderEventAt, at),
    };
    // All these events establish provider acceptance, never inbox placement.
    next.acceptedAt = earliest(current.acceptedAt, at);
    if (event.type === "email.delivered")
      next.deliveredAt = earliest(current.deliveredAt, at);
    if (event.type === "email.bounced")
      next.bouncedAt = earliest(current.bouncedAt, at);
    if (event.type === "email.complained")
      next.complainedAt = earliest(current.complainedAt, at);
    // Evidence precedence is monotonic: complaint > bounce > delivered > failed
    // > accepted. An older accepted event never regresses a terminal result.
    if (["email.failed", "email.suppressed"].includes(event.type)) {
      next.providerFailedAt = earliest(current.providerFailedAt, at);
      next.failedAt = earliest(current.failedAt, at);
    }
    if (
      !current.lastProviderEventAt ||
      at >= new Date(current.lastProviderEventAt)
    )
      next.providerStatus = event.type;
    next.status = evidenceStatus(next);
    const code =
      next.status === "bounced"
        ? "bounced"
        : next.status === "complained"
          ? "complained"
          : next.status === "failed"
            ? event.type === "email.suppressed" ||
              current.failureCode === "suppressed"
              ? "suppressed"
              : "provider_failed"
            : "";
    next.failureCode = code;
    next.lastError = code
      ? sanitizedNotificationError(notificationError(code))
      : "";
    const { _id, __v, createdAt, updatedAt, ...fields } = next;
    return fields;
  });
  const action = {
    "email.sent": "accepted",
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.failed": "failed",
    "email.suppressed": "suppressed",
    "email.delivery_delayed": "delayed",
  }[event.type];
  const summary = {
    accepted:
      "Authenticated provider event confirmed email acceptance; delivery is not confirmed.",
    delivered:
      "Authenticated provider event confirmed delivery to the recipient's mail server. Inbox placement and reading are not verified.",
    bounced: "Authenticated provider event reported a permanent email bounce.",
    complained:
      "Authenticated provider event reported a spam complaint. Automated email to this recipient is blocked.",
    failed: "Authenticated provider event reported email delivery failure.",
    suppressed: "Authenticated provider event reported email suppression.",
    delayed:
      "The provider reported a delivery delay and is managing delivery. No second email is queued.",
  }[action];
  const audit = notificationEvent(
    { ...job, deliveryGeneration: attempt.generation, provider: "resend" },
    action,
    summary,
    {
      key: `resend-webhook:${event.eventId}`,
      at,
      failureCode: updated.failureCode,
    },
  );
  const projected = await projectAttempt(job, updated, { event: audit });
  if (!projected) {
    // Preserve late history from a previous controlled attempt without replacing
    // the status of the current generation.
    await NotificationJob.updateOne(
      { _id: job._id, "eventOutbox.eventId": { $ne: audit.eventId } },
      { $push: { eventOutbox: audit } },
    );
    await flushNotificationAudit(job._id);
  }
  await NotificationWebhookEvent.updateOne(
    { _id: event._id },
    { $set: { processedAt: now } },
  );
  return true;
}
export async function recoverNotificationWebhooks({
  limit = 50,
  now = new Date(),
} = {}) {
  for (const event of await NotificationWebhookEvent.find({
    processedAt: null,
    nextAttemptAt: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean())
    await processWebhookEvent(event, now);
}
