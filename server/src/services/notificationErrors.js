const messages = {
  unconfigured:
    "Delivery unavailable: no email provider is configured. Use the customer contact links or configure Resend before retrying.",
  configuration:
    "Email configuration is incomplete or invalid. Review the server sender and provider settings.",
  authentication:
    "The email provider rejected authentication. Review the server API credential and its permissions.",
  sender:
    "The provider rejected the sender. Verify the configured sending domain and address.",
  recipient:
    "The stored email recipient is invalid. Use the customer's other contact details; this recipient cannot be overridden by retry.",
  suppressed:
    "Email is blocked following a permanent bounce or spam complaint. Use another contact method.",
  rate_limit:
    "The email provider temporarily limited requests. A delayed retry is scheduled.",
  unavailable:
    "The email provider is temporarily unavailable. Delivery remains unconfirmed.",
  timeout:
    "The provider request timed out. Acceptance is unconfirmed; retries retain the same delivery key.",
  network:
    "The provider could not be reached. Acceptance is unconfirmed; retries retain the same delivery key.",
  invalid_response:
    "The provider response did not confirm a message ID. Reconciliation may be required.",
  conflict:
    "The provider could not replay this delivery request safely. Reconciliation is required.",
  window_expired:
    "The safe provider retry window has expired with acceptance unconfirmed. Automatic and manual resend are blocked pending reconciliation.",
  unsupported:
    "The transport cannot safely deduplicate deliveries. Provider reconciliation is required.",
  provider_failed:
    "The provider reported that this email failed. Review provider configuration before a controlled retry.",
  bounced:
    "The recipient's mail server permanently rejected the email. Automatic resend is blocked.",
  complained:
    "The recipient reported this email as spam. Further automated email to this recipient is blocked.",
  interrupted:
    "The final worker attempt was interrupted. Acceptance must be reconciled before an unsafe resend.",
  exhausted:
    "The delivery retry cycle is exhausted. Review the last attempt before retrying.",
  rejected:
    "The provider rejected this notification. Review sender configuration and the stored recipient.",
};
export function notificationError(
  code,
  { permanent = false, uncertain = false, retryAfterMs } = {},
) {
  return Object.assign(new Error(messages[code] || messages.unavailable), {
    notificationCode: code in messages ? code : "unavailable",
    permanent,
    uncertain,
    retryAfterMs,
  });
}
export function sanitizedNotificationError(error) {
  return (
    messages[error?.notificationCode] ||
    (error?.permanent ? messages.rejected : messages.unavailable)
  );
}
export const safeFailureCode = (error) =>
  error?.notificationCode in messages
    ? error.notificationCode
    : error?.permanent
      ? "rejected"
      : "unavailable";
