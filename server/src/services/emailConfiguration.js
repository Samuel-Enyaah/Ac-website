import { z } from "zod";
const email = z.email().max(254);
export const validEmail = (value) =>
  typeof value === "string" && email.safeParse(value.trim()).success;
export const normalizedEmail = (value) =>
  validEmail(value) ? value.trim().toLowerCase() : "";

export function emailConfiguration(env = process.env) {
  const provider = (env.EMAIL_PROVIDER || "").trim().toLowerCase();
  const name = (env.EMAIL_FROM_NAME || "").trim();
  const address = normalizedEmail(env.EMAIL_FROM_ADDRESS);
  const replyTo = (env.EMAIL_REPLY_TO || "").trim();
  const key = (env.RESEND_API_KEY || "").trim();
  const valid =
    provider === "resend" &&
    key &&
    !/[\r\n]/.test(key) &&
    address &&
    name &&
    name.length <= 120 &&
    !/[\r\n<>]/.test(name) &&
    (!replyTo || validEmail(replyTo));
  return {
    provider: provider === "resend" ? "resend" : "unconfigured",
    ready: Boolean(valid),
    failureCode: !provider ? "unconfigured" : "configuration",
    sender: valid
      ? {
          from: `"${name.replace(/["\\]/g, "\\$&")}" <${address}>`,
          ...(replyTo ? { replyTo: normalizedEmail(replyTo) } : {}),
        }
      : {},
    webhookConfigured: Boolean(env.RESEND_WEBHOOK_SECRET?.startsWith("whsec_")),
    timeoutMs: Math.min(
      25000,
      Math.max(1000, Number(env.EMAIL_TIMEOUT_MS) || 15000),
    ),
  };
}
