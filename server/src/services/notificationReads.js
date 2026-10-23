import NotificationJob from "../models/NotificationJob.js";
import NotificationAttempt from "../models/NotificationAttempt.js";
import NotificationWorkerState from "../models/NotificationWorkerState.js";
import {
  notificationSummary,
  notificationStatuses,
} from "./notificationState.js";
import { notificationTemplates } from "./notificationTemplates.js";
import { emailConfiguration } from "./emailConfiguration.js";
import { operationalError } from "./operationEvents.js";

const escaped = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function notificationFilter(input) {
  const query = {};
  const clauses = [];
  for (const [key, values] of [
    ["channel", ["email", "sms", "whatsapp"]],
    ["entityType", ["order", "booking"]],
    ["template", notificationTemplates],
  ]) {
    if (input[key]) {
      if (!values.includes(input[key]))
        throw operationalError("Invalid notification filter.", 400);
      query[key] = input[key];
    }
  }
  if (input.status) {
    if (input.status === "accepted")
      query.status = { $in: ["accepted", "sent"] };
    else if (input.status === "retrying")
      clauses.push({
        $or: [
          { status: "retrying" },
          { status: "pending", cycleAttempts: { $gt: 0 } },
        ],
      });
    else if (notificationStatuses.includes(input.status)) {
      query.status = input.status;
      if (input.status === "pending")
        clauses.push({
          $or: [{ cycleAttempts: 0 }, { cycleAttempts: { $exists: false } }],
        });
    } else throw operationalError("Invalid notification status.", 400);
  }
  for (const key of ["reference", "recipient"])
    if (input[key]) {
      if (typeof input[key] !== "string" || input[key].length > 254)
        throw operationalError("Search is too long.", 400);
      const pattern = new RegExp(escaped(input[key].trim()), "i");
      if (key === "reference")
        clauses.push({
          $or: [{ reference: pattern }, { "payload.reference": pattern }],
        });
      else query.recipient = pattern;
    }
  if (input.from || input.to) {
    query.createdAt = {};
    for (const key of ["from", "to"])
      if (input[key]) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input[key]))
          throw operationalError("Use a valid date filter.", 400);
        const date = new Date(`${input[key]}T00:00:00.000Z`);
        if (
          !Number.isFinite(date.getTime()) ||
          date.toISOString().slice(0, 10) !== input[key]
        )
          throw operationalError("Use a valid date filter.", 400);
        query.createdAt[key === "from" ? "$gte" : "$lt"] = new Date(
          date.getTime() + (key === "to" ? 86400000 : 0),
        );
      }
    if (query.createdAt.$gte >= query.createdAt.$lt)
      throw operationalError(
        "The end date must not precede the start date.",
        400,
      );
  }
  if (clauses.length) query.$and = clauses;
  return query;
}
export async function notificationSummaries(jobs, { history = true } = {}) {
  const attempts =
    history && jobs.length
      ? await NotificationAttempt.find({
          jobId: { $in: jobs.map((j) => j._id) },
        })
          .sort({ generation: -1 })
          .limit(jobs.length * 26)
          .lean()
      : [];
  return jobs.map((job) => ({
    ...notificationSummary(job),
    ...(history
      ? {
          attemptHistory: attempts
            .filter((a) => String(a.jobId) === String(job._id))
            .map((a) => ({
              generation: a.generation,
              provider: a.provider,
              providerMessageId: a.providerMessageId,
              status: a.status,
              createdAt: a.createdAt,
              acceptedAt: a.acceptedAt,
              deliveredAt: a.deliveredAt,
              bouncedAt: a.bouncedAt,
              complainedAt: a.complainedAt,
              failedAt: a.failedAt,
              lastError: a.lastError,
            })),
        }
      : {}),
  }));
}
export async function notificationHealth({
  now = new Date(),
  env = process.env,
} = {}) {
  const [
    groups,
    worker,
    oldest,
    failures,
    authenticationFailures,
    permanentFailures,
  ] = await Promise.all([
    NotificationJob.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$status", "sent"] },
              "accepted",
              {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "pending"] },
                      { $gt: ["$cycleAttempts", 0] },
                    ],
                  },
                  "retrying",
                  "$status",
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]),
    NotificationWorkerState.findOne({ key: "email" }).lean(),
    NotificationJob.findOne({
      status: { $in: ["pending", "retrying", "processing"] },
      nextRetryAt: { $lt: new Date(now.getTime() - 15 * 60000) },
    })
      .sort({ nextRetryAt: 1 })
      .select("_id nextRetryAt")
      .lean(),
    NotificationJob.find({
      status: { $in: ["failed", "bounced", "complained"] },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    NotificationAttempt.countDocuments({
      failureCode: { $in: ["authentication", "sender", "configuration"] },
      failedAt: { $gte: new Date(now.getTime() - 15 * 60000) },
    }),
    NotificationAttempt.countDocuments({
      status: "failed",
      failedAt: { $gte: new Date(now.getTime() - 3600000) },
    }),
  ]);
  const counts = Object.fromEntries(
    notificationStatuses.map((s) => [
      s,
      groups.find((g) => g._id === s)?.count || 0,
    ]),
  );
  const config = emailConfiguration(env);
  const alerts = [];
  if (!config.ready)
    alerts.push({
      code: "configuration",
      severity: "warning",
      message:
        "Email delivery is not configured. Orders and service requests remain available; use manual contact links.",
    });
  else if (!config.webhookConfigured)
    alerts.push({
      code: "webhook",
      severity: "warning",
      message:
        "Delivery confirmation is unavailable until the signed provider webhook is configured.",
    });
  if (authenticationFailures >= 3)
    alerts.push({
      code: "authentication",
      severity: "critical",
      message: `${authenticationFailures} sender or authentication failures in the last 15 minutes. Review provider configuration.`,
    });
  if (permanentFailures >= 5)
    alerts.push({
      code: "failures",
      severity: "warning",
      message: `${permanentFailures} failed delivery attempts in the last hour. Review recent problems before retrying.`,
    });
  if (
    oldest &&
    (!worker?.progressedAt ||
      new Date(worker.progressedAt) < new Date(now.getTime() - 15 * 60000))
  )
    alerts.push({
      code: "worker",
      severity: "critical",
      message:
        "Due notification work is over 15 minutes old and the worker has recorded no progress in that time. Check the backend worker.",
    });
  return {
    counts,
    alerts,
    provider: config.provider,
    configured: config.ready,
    webhookConfigured: config.webhookConfigured,
    worker: worker
      ? {
          startedAt: worker.startedAt,
          completedAt: worker.completedAt,
          progressedAt: worker.progressedAt,
          lastError: worker.lastError,
        }
      : null,
    problems: await notificationSummaries(failures, { history: false }),
  };
}
export async function listNotifications(input) {
  const query = notificationFilter(input);
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(input.page, 10) || 1),
  );
  const direction = input.sort === "oldest" ? 1 : -1;
  const [jobs, total] = await Promise.all([
    NotificationJob.find(query)
      .sort({ createdAt: direction, _id: direction })
      .skip((page - 1) * 25)
      .limit(25)
      .lean(),
    NotificationJob.countDocuments(query),
  ]);
  return {
    notifications: await notificationSummaries(jobs),
    pagination: { page, pages: Math.max(1, Math.ceil(total / 25)), total },
  };
}
