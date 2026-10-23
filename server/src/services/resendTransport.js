import { emailConfiguration, validEmail } from "./emailConfiguration.js";
import { notificationError } from "./notificationErrors.js";

// Resend retains keys for 24 hours. One hour of margin protects delayed requests
// and clock skew. The worker persists the first-dispatch deadline, never renews it.
export const RESEND_REPLAY_WINDOW_MS = 23 * 60 * 60 * 1000;
export function createResendTransport({
  env = process.env,
  fetchImpl = fetch,
  timeoutMs,
} = {}) {
  const config = emailConfiguration(env);
  return {
    name: "resend",
    supportsIdempotency: true,
    idempotencyWindowMs: RESEND_REPLAY_WINDOW_MS,
    sender: config.sender,
    async send({
      channel,
      recipient,
      payload,
      idempotencyKey,
      sender = config.sender,
      signal,
    }) {
      if (!config.ready)
        throw notificationError(config.failureCode, { permanent: true });
      if (channel !== "email")
        throw notificationError("unsupported", { permanent: true });
      if (!validEmail(recipient))
        throw notificationError("recipient", { permanent: true });
      if (!sender?.from || !payload?.subject || !payload?.text)
        throw notificationError("configuration", { permanent: true });
      const abort = new AbortController();
      const abortFromParent = () => abort.abort();
      signal?.addEventListener("abort", abortFromParent, { once: true });
      if (signal?.aborted) abort.abort();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        abort.abort();
      }, timeoutMs ?? config.timeoutMs);
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          redirect: "error",
          signal: abort.signal,
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            from: sender.from,
            to: [recipient],
            subject: payload.subject,
            text: payload.text,
            ...(payload.html ? { html: payload.html } : {}),
            ...(sender.replyTo ? { reply_to: sender.replyTo } : {}),
          }),
        });
        let body;
        try {
          body = await response.json();
        } catch {
          body = {};
        }
        if (response.ok) {
          if (typeof body.id !== "string" || !/^[a-f0-9-]{36}$/i.test(body.id))
            throw notificationError("invalid_response", { uncertain: true });
          return {
            accepted: true,
            provider: "resend",
            providerMessageId: body.id,
          };
        }
        const status = response.status;
        if (status === 429) {
          const header = response.headers.get("retry-after");
          const delay = /^\d+$/.test(header || "")
            ? Number(header) * 1000
            : Date.parse(header) - Date.now();
          throw notificationError("rate_limit", {
            retryAfterMs: Number.isFinite(delay)
              ? Math.min(86400000, Math.max(1000, delay))
              : 30000,
          });
        }
        if (status >= 500 || status === 408)
          throw notificationError("unavailable", { uncertain: true });
        if (status === 409) {
          if (body.name === "concurrent_idempotent_requests")
            throw notificationError("unavailable", { uncertain: true });
          throw notificationError("conflict", {
            permanent: true,
            uncertain: true,
          });
        }
        // Inspect only to select a fixed safe category; raw content is discarded.
        const hint =
          typeof body.message === "string" ? body.message.slice(0, 1000) : "";
        const code =
          status === 401 || /api.?key|authorization|authenticat/i.test(hint)
            ? "authentication"
            : /domain|sender|from.address/i.test(hint)
              ? "sender"
              : /recipient|invalid.*email|email.*invalid/i.test(hint)
                ? "recipient"
                : "rejected";
        throw notificationError(code, { permanent: true });
      } catch (error) {
        if (error.notificationCode) throw error;
        throw notificationError(
          timedOut || abort.signal.aborted ? "timeout" : "network",
          { uncertain: true },
        );
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abortFromParent);
      }
    },
  };
}
