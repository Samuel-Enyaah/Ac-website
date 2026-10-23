import NotificationJob from "../models/NotificationJob.js";
import ActivityLog from "../models/ActivityLog.js";
import { operationEvent } from "./operationEvents.js";

export function notificationEvent(
  job,
  action,
  summary,
  { admin, key, at = new Date(), failureCode = "" } = {},
) {
  return {
    ...operationEvent(`notification-${action}`, summary, {
      admin,
      eventId:
        key ||
        `notification:${job._id}:${action}:${job.attempts}:${job.retryCount}`,
      metadata: {
        notificationId: job._id,
        template: job.template,
        provider: job.provider || job.transport || "",
        generation: job.deliveryGeneration || 0,
        failureCode,
      },
    }),
    createdAt: at,
  };
}
export async function flushNotificationAudit(id) {
  try {
    const job = await NotificationJob.findById(id)
      .select("+eventOutbox")
      .lean();
    for (const event of job?.eventOutbox || []) {
      try {
        await ActivityLog.updateOne(
          { eventId: event.eventId },
          {
            $setOnInsert: {
              ...event,
              entityType: job.entityType,
              entityId: job.entityId,
            },
          },
          { upsert: true, runValidators: true },
        );
      } catch (error) {
        if (
          error.code !== 11000 ||
          !(await ActivityLog.exists({ eventId: event.eventId }))
        )
          throw error;
      }
      await NotificationJob.updateOne(
        { _id: id },
        { $pull: { eventOutbox: { eventId: event.eventId } } },
        { timestamps: false },
      );
    }
  } catch {
    console.error(
      "Notification activity projection deferred; durable event retained.",
    );
  }
}
export async function recoverNotificationAudit() {
  for (const job of await NotificationJob.find({
    "eventOutbox.0": { $exists: true },
  })
    .select("_id")
    .limit(50)
    .lean())
    await flushNotificationAudit(job._id);
}
