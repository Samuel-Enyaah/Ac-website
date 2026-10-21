import { randomUUID } from "node:crypto";
import NotificationJob from "../models/NotificationJob.js";
import {
  configuredTransport,
  sanitizedNotificationError,
} from "./notificationTransports.js";
import { operationalError } from "./operationEvents.js";

export async function runNotifications({
  limit = 20,
  now,
  transport = configuredTransport(),
} = {}) {
  const clock = () => now || new Date();
  const startedAt = clock();
  await NotificationJob.updateMany(
    {
      status: "processing",
      leaseUntil: { $lte: startedAt },
      $expr: { $gte: ["$cycleAttempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "failed",
        failedAt: startedAt,
        leaseToken: "",
        leaseUntil: null,
        lastError:
          "Delivery remains unconfirmed after an interrupted final attempt. Retry uses the same event key.",
      },
    },
  );
  let processed = 0;
  for (; processed < limit; processed++) {
    const token = randomUUID();
    const claimedAt = clock();
    const job = await NotificationJob.findOneAndUpdate(
      {
        $or: [
          { status: "pending", nextRetryAt: { $lte: claimedAt } },
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
        $inc: { attempts: 1, cycleAttempts: 1 },
      },
      { returnDocument: "after", sort: { nextRetryAt: 1, _id: 1 } },
    );
    if (!job) break;
    const fence = { _id: job._id, status: "processing", leaseToken: token };
    let timer;
    try {
      if (!transport.supportsIdempotency)
        throw Object.assign(new Error(), {
          notificationCode: "unsupported",
          permanent: true,
        });
      const abort = new AbortController();
      const result = await Promise.race([
        transport.send({
          channel: job.channel,
          recipient: job.recipient,
          payload: job.toObject().payload,
          idempotencyKey: job.eventKey,
          signal: abort.signal,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            abort.abort();
            reject(new Error("Transport timeout"));
          }, 30000);
        }),
      ]);
      if (!result?.accepted)
        throw new Error("Provider did not accept the notification.");
      await NotificationJob.updateOne(fence, {
        $set: {
          status: result.simulated ? "simulated" : "sent",
          sentAt: result.simulated ? null : new Date(),
          simulatedAt: result.simulated ? new Date() : null,
          failedAt: null,
          lastError: "",
          leaseToken: "",
          leaseUntil: null,
          transport: transport.name,
        },
      });
    } catch (error) {
      const failedAt = clock();
      const terminal = error.permanent || job.cycleAttempts >= job.maxAttempts;
      await NotificationJob.updateOne(fence, {
        $set: {
          status: terminal ? "failed" : "pending",
          lastError: sanitizedNotificationError(error),
          failedAt: terminal ? failedAt : null,
          nextRetryAt: new Date(
            failedAt.getTime() +
              Math.min(86400000, 30000 * 2 ** (job.cycleAttempts - 1)),
          ),
          leaseToken: "",
          leaseUntil: null,
          transport: transport.name,
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }
  return processed;
}

export async function retryNotification(id, admin) {
  const job = await NotificationJob.findOneAndUpdate(
    { _id: id, status: "failed" },
    {
      $set: {
        status: "pending",
        nextRetryAt: new Date(),
        cycleAttempts: 0,
        failedAt: null,
        lastRetriedBy: admin._id,
      },
      $inc: { retryCount: 1 },
    },
    { returnDocument: "after" },
  );
  if (!job)
    throw operationalError(
      "Only a failed notification can be retried. Refresh its current status.",
    );
  return job;
}
