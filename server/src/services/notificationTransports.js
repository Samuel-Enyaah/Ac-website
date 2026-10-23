import { createResendTransport } from "./resendTransport.js";
import { emailConfiguration } from "./emailConfiguration.js";
import { notificationError } from "./notificationErrors.js";
export { sanitizedNotificationError } from "./notificationErrors.js";

export function configuredTransport(env = process.env) {
  const config = emailConfiguration(env);
  if (config.provider === "resend") return createResendTransport({ env });
  return {
    name: "unconfigured",
    supportsIdempotency: true,
    async send() {
      throw notificationError(config.failureCode, { permanent: true });
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
