export const notificationStatuses = [
  "pending",
  "processing",
  "retrying",
  "accepted",
  "delivered",
  "bounced",
  "complained",
  "failed",
  "simulated",
];
export function normalizedNotificationStatus(job) {
  if (job.status === "sent") return "accepted";
  if (job.status === "pending" && job.cycleAttempts > 0) return "retrying";
  return job.status;
}
export function retryEligibility(job, now = new Date()) {
  if (job.status !== "failed")
    return {
      canRetry: false,
      retryReason: "Only failed notifications are eligible for retry.",
    };
  if ((job.retryCount || 0) >= 25)
    return {
      canRetry: false,
      retryReason: "Manual retry limit reached. Review delivery history.",
    };
  if (
    [
      "recipient",
      "suppressed",
      "bounced",
      "complained",
      "conflict",
      "unsupported",
    ].includes(job.failureCode)
  )
    return { canRetry: false, retryReason: job.lastError };
  if (job.uncertain && (!job.retryBefore || new Date(job.retryBefore) <= now))
    return {
      canRetry: false,
      retryReason:
        "Acceptance remains unconfirmed outside the safe retry window. Reconciliation is required before resend.",
    };
  return {
    canRetry: true,
    retryReason: job.uncertain
      ? "Retry reuses the original delivery key while its safe window remains open."
      : "Retry starts a controlled delivery attempt using the stored recipient and message.",
  };
}
export function notificationSummary(job, now) {
  const allowed = [
    "_id",
    "channel",
    "template",
    "recipient",
    "entityType",
    "entityId",
    "createdAt",
    "updatedAt",
    "attempts",
    "cycleAttempts",
    "maxAttempts",
    "retryCount",
    "deliveryGeneration",
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
    "nextRetryAt",
    "retryBefore",
    "uncertain",
  ];
  return {
    ...Object.fromEntries(
      allowed.filter((k) => job[k] !== undefined).map((k) => [k, job[k]]),
    ),
    reference: job.reference || job.payload?.reference || "",
    status: normalizedNotificationStatus(job),
    acceptedAt: job.acceptedAt || job.sentAt || null,
    ...retryEligibility(job, now),
  };
}
