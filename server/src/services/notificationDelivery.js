import { randomUUID } from "node:crypto";
import NotificationJob from "../models/NotificationJob.js";
import NotificationAttempt from "../models/NotificationAttempt.js";
import NotificationWorkerState from "../models/NotificationWorkerState.js";
import { configuredTransport } from "./notificationTransports.js";
import {
  notificationError,
  sanitizedNotificationError,
  safeFailureCode,
} from "./notificationErrors.js";
import { validEmail } from "./emailConfiguration.js";
import {
  notificationEvent,
  flushNotificationAudit,
  recoverNotificationAudit,
} from "./notificationAudit.js";
import {
  ensureNotificationAttempt,
  recordAcceptance,
  projectAttempt,
  recipientHash,
  acceptedStates,
} from "./notificationAttempts.js";
import { operationalError } from "./operationEvents.js";
import { retryEligibility } from "./notificationState.js";

async function failJob(job, fence, error, now, transport, attempt) {
  const code = safeFailureCode(error);
  const terminal = Boolean(
    error.permanent || job.cycleAttempts >= job.maxAttempts,
  );
  const uncertain = Boolean(
    attempt?.uncertain ||
      error.uncertain ||
      (!error.notificationCode && !error.permanent),
  );
  const status = terminal ? "failed" : "retrying";
  const lastError = sanitizedNotificationError(error);
  if (attempt)
    await NotificationAttempt.updateOne(
      {
        _id: attempt._id,
        status: { $nin: acceptedStates },
        providerStatus: { $nin: ["email.failed", "email.suppressed"] },
      },
      {
        $set: {
          status,
          uncertain,
          lastError,
          failureCode: code,
          failedAt: now,
        },
        $inc: { __v: 1 },
      },
    );
  const delay = Math.max(
    error.retryAfterMs || 0,
    Math.min(86400000, 30000 * 2 ** (job.cycleAttempts - 1)),
  );
  const result = await NotificationJob.updateOne(fence, {
    $set: {
      status,
      lastError,
      failureCode: code,
      uncertain,
      retryBefore: attempt?.retryBefore || null,
      failedAt: now,
      nextRetryAt: new Date(now.getTime() + delay),
      leaseToken: "",
      leaseUntil: null,
      provider: transport.name,
      transport: transport.name,
    },
    $push: {
      eventOutbox: notificationEvent(
        job,
        terminal ? "failed" : "retrying",
        terminal
          ? "Email delivery attempt failed; administrator review is available."
          : "Email delivery could not be confirmed; a durable retry is scheduled.",
        { at: now, failureCode: code },
      ),
    },
    $inc: { __v: 1 },
  });
  if (result.modifiedCount) await flushNotificationAudit(job._id);
}

export async function runNotifications({
  limit = 20,
  now,
  transport = configuredTransport(),
} = {}) {
  const clock = () => now || new Date();
  const startedAt = clock();
  await NotificationWorkerState.updateOne(
    { key: "email" },
    { $set: { startedAt } },
    { upsert: true },
  );
  let processed = 0;
  try {
    // Acceptance is persisted on the delivery attempt before the job projection.
    // Repair a crash in that gap without another provider request.
    for (const attempt of await NotificationAttempt.find({
      projectionPending: true,
    })
      .sort({ updatedAt: 1 })
      .limit(50)
      .lean()) {
      const job = await NotificationJob.findById(attempt.jobId).lean();
      if (!job) continue;
      await projectAttempt(job, attempt, {
        fence: {
          $or: [
            { status: { $ne: "processing" } },
            { leaseUntil: { $lte: startedAt } },
          ],
        },
        event: notificationEvent(
          job,
          attempt.status === "simulated" ? "simulated" : "accepted",
          attempt.status === "simulated"
            ? "Notification test simulated; no external message sent."
            : "Recovered persisted provider acceptance without sending another email.",
          {
            key: `notification:${job._id}:delivery:${attempt.generation}:${attempt.status === "simulated" ? "simulated" : "accepted"}`,
            at: attempt.acceptedAt || attempt.simulatedAt || startedAt,
          },
        ),
      });
    }
    // Interrupted final attempts remain reviewable; do not silently discard them.
    for (const job of await NotificationJob.find({
      status: "processing",
      leaseUntil: { $lte: startedAt },
      $expr: { $gte: ["$cycleAttempts", "$maxAttempts"] },
    })
      .select("+leaseToken")
      .limit(limit)) {
      const attempt = await NotificationAttempt.findOne({
        jobId: job._id,
        generation: job.deliveryGeneration || 0,
      }).lean();
      const fence = {
        _id: job._id,
        status: "processing",
        leaseToken: job.leaseToken,
        leaseUntil: { $lte: startedAt },
      };
      if (attempt && acceptedStates.includes(attempt.status))
        await projectAttempt(job, attempt, { fence });
      else
        await failJob(
          job,
          fence,
          notificationError("interrupted", {
            permanent: true,
            uncertain: true,
          }),
          startedAt,
          transport,
          attempt,
        );
    }
    for (; processed < limit; processed++) {
      const token = randomUUID();
      const claimedAt = clock();
      const job = await NotificationJob.findOneAndUpdate(
        {
          $or: [
            {
              status: { $in: ["pending", "retrying"] },
              nextRetryAt: { $lte: claimedAt },
            },
            { status: "processing", leaseUntil: { $lte: claimedAt } },
          ],
          $expr: { $lt: ["$cycleAttempts", "$maxAttempts"] },
        },
        {
          $set: {
            status: "processing",
            leaseToken: token,
            leaseUntil: new Date(claimedAt.getTime() + 120000),
          },
          $inc: { attempts: 1, cycleAttempts: 1, __v: 1 },
        },
        { returnDocument: "after", sort: { nextRetryAt: 1, _id: 1 } },
      );
      if (!job) break;
      const fence = { _id: job._id, status: "processing", leaseToken: token };
      let attempt, timer;
      try {
        if (!transport.supportsIdempotency)
          throw notificationError("unsupported", { permanent: true });
        if (!validEmail(job.recipient))
          throw notificationError("recipient", { permanent: true });
        attempt = await ensureNotificationAttempt(job, transport);
        if (acceptedStates.includes(attempt.status)) {
          await projectAttempt(job, attempt, { fence });
          continue;
        }
        if (attempt.provider !== transport.name)
          throw notificationError("configuration", {
            permanent: true,
            uncertain: attempt.uncertain,
          });
        if (
          await NotificationAttempt.exists({
            recipientHash: recipientHash(job.recipient),
            $or: [
              { status: { $in: ["bounced", "complained"] } },
              { failureCode: "suppressed" },
            ],
          })
        )
          throw notificationError("suppressed", { permanent: true });
        if (
          attempt.firstDispatchAt &&
          attempt.retryBefore &&
          new Date(attempt.retryBefore) <= clock()
        )
          throw notificationError(
            attempt.uncertain ? "window_expired" : "exhausted",
            { permanent: true, uncertain: attempt.uncertain },
          );
        // Persist uncertainty BEFORE any network request. A crash after this write
        // must not manufacture a new provider key or renew its retention window.
        if (!attempt.firstDispatchAt) {
          const dispatchAt = clock();
          const windowMs = transport.idempotencyWindowMs || 23 * 3600000;
          await NotificationAttempt.updateOne(
            { _id: attempt._id, firstDispatchAt: { $exists: false } },
            {
              $set: {
                firstDispatchAt: dispatchAt,
                retryBefore: new Date(dispatchAt.getTime() + windowMs),
              },
              $inc: { __v: 1 },
            },
          );
          attempt = await NotificationAttempt.findById(attempt._id)
            .select("+sender +idempotencyKey")
            .lean();
        }
        const previousUncertainty = attempt.uncertain;
        await NotificationAttempt.updateOne(
          { _id: attempt._id, status: { $nin: acceptedStates } },
          { $set: { uncertain: true }, $inc: { __v: 1 } },
        );
        const abort = new AbortController();
        let result;
        try {
          result = await Promise.race([
            transport.send({
              channel: job.channel,
              recipient: job.recipient,
              payload: job.toObject().payload,
              sender: attempt.sender,
              idempotencyKey: attempt.idempotencyKey,
              signal: abort.signal,
            }),
            new Promise((_, reject) => {
              timer = setTimeout(() => {
                abort.abort();
                reject(notificationError("timeout", { uncertain: true }));
              }, 30000);
            }),
          ]);
        } catch (error) {
          // A definitive rejection cannot erase uncertainty from an earlier call.
          attempt.uncertain =
            previousUncertainty ||
            Boolean(
              error.uncertain || (!error.notificationCode && !error.permanent),
            );
          throw error;
        }
        if (
          !result?.accepted ||
          (!result.simulated && !result.providerMessageId)
        )
          throw notificationError("invalid_response", { uncertain: true });
        await recordAcceptance(job, attempt, result, clock(), fence);
      } catch (error) {
        await failJob(job, fence, error, clock(), transport, attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    await recoverNotificationAudit();
    await NotificationWorkerState.updateOne(
      { key: "email" },
      {
        $set: {
          completedAt: clock(),
          lastError: "",
          ...(processed ? { progressedAt: clock() } : {}),
        },
      },
    );
    return processed;
  } catch {
    await NotificationWorkerState.updateOne(
      { key: "email" },
      {
        $set: {
          lastError:
            "Notification worker pass interrupted. Durable jobs remain queued.",
        },
      },
    ).catch(() => {});
    throw new Error("Notification worker pass interrupted.");
  }
}

export async function retryNotification(id, admin, now = new Date()) {
  const current = await NotificationJob.findById(id);
  if (!current) throw operationalError("Notification not found.", 404);
  const eligible = retryEligibility(current, now);
  if (!eligible.canRetry) throw operationalError(eligible.retryReason);
  const previous = await NotificationAttempt.findOne({
    jobId: id,
    generation: current.deliveryGeneration || 0,
  }).lean();
  if (previous && acceptedStates.includes(previous.status)) {
    await projectAttempt(current, previous);
    throw operationalError(
      "The provider has already accepted or resolved this notification. Refresh its status.",
    );
  }
  // Unknown outcomes replay the SAME attempt within its retained window. A
  // proven rejection creates a fresh generation and preserves prior attempts.
  const replay = Boolean(current.uncertain || previous?.uncertain);
  if (
    replay &&
    (!previous?.retryBefore || new Date(previous.retryBefore) <= now)
  )
    throw operationalError(
      "Acceptance is unconfirmed outside the safe retry window. Reconcile before resend.",
    );
  if (
    !previous &&
    current.attempts > 0 &&
    !["", "unconfigured", "test"].includes(current.transport || "")
  )
    throw operationalError(
      "This legacy attempt requires provider reconciliation before resend.",
    );
  const job = await NotificationJob.findOneAndUpdate(
    { _id: id, status: "failed", __v: current.__v },
    {
      $set: {
        status: "retrying",
        nextRetryAt: now,
        cycleAttempts: 0,
        failedAt: null,
        lastRetriedBy: admin._id,
        ...(replay
          ? {}
          : {
              uncertain: false,
              projectedAttemptVersion: -1,
              retryBefore: null,
              providerMessageId: null,
              providerStatus: "",
              acceptedAt: null,
              deliveredAt: null,
              bouncedAt: null,
              complainedAt: null,
              lastProviderEventAt: null,
            }),
      },
      $inc: {
        retryCount: 1,
        __v: 1,
        ...(replay ? {} : { deliveryGeneration: 1 }),
      },
      $push: {
        eventOutbox: notificationEvent(
          current,
          "retry-requested",
          replay
            ? "Administrator requested a safe replay of the existing email delivery attempt."
            : "Administrator requested a new controlled email delivery attempt.",
          {
            admin,
            key: `notification:${id}:retry:${current.retryCount + 1}`,
            at: now,
          },
        ),
      },
    },
    { returnDocument: "after" },
  );
  if (!job)
    throw operationalError("Notification changed. Refresh its current status.");
  await flushNotificationAudit(id);
  return job;
}
