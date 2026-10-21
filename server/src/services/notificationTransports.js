// Adapters must honor the stable idempotencyKey across timeouts, restarts and
// manual retries. A provider without durable idempotency needs reconciliation
// before it can safely implement this interface. Never log provider responses.
export function configuredTransport() {
  return {
    name: "unconfigured",
    supportsIdempotency: true,
    async send() {
      throw Object.assign(new Error("No notification provider configured."), {
        notificationCode: "unconfigured",
        permanent: true,
      });
    },
  };
}

// Explicit injection only: no environment variable can enable fake production
// delivery. Simulations are stored as 'simulated', never as sent/delivered.
export function createTestTransport({ fail } = {}) {
  const receipts = new Map();
  return {
    name: "test",
    supportsIdempotency: true,
    receipts,
    async send(message) {
      if (receipts.has(message.idempotencyKey))
        return receipts.get(message.idempotencyKey);
      if (fail) await fail(message);
      const receipt = { accepted: true, simulated: true };
      receipts.set(message.idempotencyKey, receipt);
      return receipt;
    },
  };
}

export function sanitizedNotificationError(error) {
  if (error?.notificationCode === "unconfigured")
    return "Delivery unavailable: no provider is configured. Use the customer contact links or configure an approved adapter before retrying.";
  if (error?.notificationCode === "unsupported")
    return "The transport cannot safely deduplicate deliveries. Provider reconciliation is required.";
  if (error?.permanent)
    return "The provider rejected this notification. Review provider configuration and the stored recipient before retrying.";
  return "Delivery could not be confirmed. A retry with the same event key is scheduled until the attempt limit is reached.";
}
