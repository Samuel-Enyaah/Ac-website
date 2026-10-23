import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { Webhook } from "svix";
import {
  createResendTransport,
  RESEND_REPLAY_WINDOW_MS,
} from "../src/services/resendTransport.js";
import { emailConfiguration } from "../src/services/emailConfiguration.js";
import { verifyResendWebhook } from "../src/services/notificationWebhooks.js";
import {
  notificationSummary,
  retryEligibility,
} from "../src/services/notificationState.js";
import {
  notificationTemplates,
  renderNotification,
} from "../src/services/notificationTemplates.js";
import { evidenceStatus } from "../src/services/notificationAttempts.js";
import { notificationFilter } from "../src/services/notificationReads.js";

const env = {
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "qa-placeholder-not-a-real-key",
  EMAIL_FROM_NAME: "R&J AC",
  EMAIL_FROM_ADDRESS: "updates@example.invalid",
  EMAIL_REPLY_TO: "support@example.invalid",
};
const message = {
  channel: "email",
  recipient: "developer@example.invalid",
  payload: { subject: "QA", text: "Plain text", html: "<p>HTML</p>" },
  idempotencyKey: "stable-event-1",
};
test("Resend acceptance validates message ID, stable key and configured sender", async () => {
  const id = randomUUID();
  let captured;
  const adapter = createResendTransport({
    env,
    fetchImpl: async (url, request) => {
      captured = { url, request };
      return Response.json({ id });
    },
  });
  const result = await adapter.send(message);
  assert.equal(result.providerMessageId, id);
  assert.equal(result.accepted, true);
  assert.equal(result.delivered, undefined);
  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(
    captured.request.headers["Idempotency-Key"],
    message.idempotencyKey,
  );
  const body = JSON.parse(captured.request.body);
  assert.match(body.from, /updates@example.invalid/);
  assert.equal(body.reply_to, env.EMAIL_REPLY_TO);
  assert.deepEqual(body.to, [message.recipient]);
  assert.equal(body.html, message.payload.html);
  assert.equal(body.text, message.payload.text);
  assert.ok(RESEND_REPLAY_WINDOW_MS < 24 * 3600000);
});
for (const [status, body, code, permanent] of [
  [429, {}, "rate_limit", false],
  [503, {}, "unavailable", false],
  [401, { message: "private API key secret" }, "authentication", true],
  [403, { message: "sender domain not verified" }, "sender", true],
  [
    422,
    { message: "invalid recipient secret@example.invalid" },
    "recipient",
    true,
  ],
  [409, { name: "invalid_idempotent_request" }, "conflict", true],
  [409, { name: "concurrent_idempotent_requests" }, "unavailable", false],
])
  test(`Resend HTTP ${status}/${code} is classified without leaking response content`, async () => {
    const adapter = createResendTransport({
      env,
      fetchImpl: async () =>
        Response.json(body, { status, headers: { "Retry-After": "60" } }),
    });
    await assert.rejects(adapter.send(message), (error) => {
      assert.equal(error.notificationCode, code);
      assert.equal(error.permanent, permanent);
      assert.ok(!error.message.includes("secret"));
      if (status === 429) assert.equal(error.retryAfterMs, 60000);
      return true;
    });
  });
test("Resend timeout and network failure remain uncertain and retryable", async () => {
  const timeout = createResendTransport({
    env,
    timeoutMs: 10,
    fetchImpl: (_url, request) =>
      new Promise((_, reject) =>
        request.signal.addEventListener(
          "abort",
          () => reject(new Error("secret")),
          { once: true },
        ),
      ),
  });
  await assert.rejects(timeout.send(message), {
    notificationCode: "timeout",
    uncertain: true,
    permanent: false,
  });
  await assert.rejects(
    createResendTransport({
      env,
      fetchImpl: async () => {
        throw new Error("network secret");
      },
    }).send(message),
    { notificationCode: "network", uncertain: true },
  );
});
test("invalid config/recipient never starts network IO; incomplete acceptance is uncertain", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return Response.json({});
  };
  await assert.rejects(
    createResendTransport({ env: {}, fetchImpl }).send(message),
    { notificationCode: "unconfigured" },
  );
  await assert.rejects(
    createResendTransport({ env, fetchImpl }).send({
      ...message,
      recipient: "invalid",
    }),
    { notificationCode: "recipient" },
  );
  assert.equal(calls, 0);
  await assert.rejects(
    createResendTransport({ env, fetchImpl }).send(message),
    { notificationCode: "invalid_response", uncertain: true },
  );
  assert.equal(
    emailConfiguration({ ...env, EMAIL_FROM_NAME: "header\ninjection" }).ready,
    false,
  );
});
test("Svix verification rejects missing, forged, altered and stale signed requests", () => {
  const secret = `whsec_${randomBytes(32).toString("base64")}`;
  const signer = new Webhook(secret);
  const now = new Date();
  const payload = JSON.stringify({
    type: "email.delivered",
    created_at: now.toISOString(),
    data: {
      email_id: randomUUID(),
      to: ["private@example.invalid"],
      secret: "not-retained",
    },
  });
  const id = "msg_test_1";
  const headers = {
    "svix-id": id,
    "svix-timestamp": String(Math.floor(now.getTime() / 1000)),
    "svix-signature": signer.sign(id, now, payload),
  };
  const evidence = verifyResendWebhook(Buffer.from(payload), headers, secret);
  assert.deepEqual(
    Object.keys(evidence).sort(),
    ["eventId", "occurredAt", "provider", "providerMessageId", "type"].sort(),
  );
  for (const h of [
    {},
    { ...headers, "svix-signature": "v1,bad" },
    { ...headers, "svix-timestamp": "1" },
  ])
    assert.throws(() => verifyResendWebhook(payload, h, secret), {
      statusCode: 401,
    });
  assert.throws(() => verifyResendWebhook(payload + " ", headers, secret), {
    statusCode: 401,
  });
  assert.throws(() => verifyResendWebhook(payload, headers, ""), {
    statusCode: 503,
  });
});
test("notification evidence never regresses delivery, bounce or complaint to acceptance", () => {
  const now = new Date();
  assert.equal(
    evidenceStatus({ acceptedAt: now, status: "processing" }),
    "accepted",
  );
  assert.equal(
    evidenceStatus({
      acceptedAt: now,
      deliveredAt: now,
      providerFailedAt: now,
    }),
    "delivered",
  );
  assert.equal(evidenceStatus({ deliveredAt: now, bouncedAt: now }), "bounced");
  assert.equal(
    evidenceStatus({ deliveredAt: now, bouncedAt: now, complainedAt: now }),
    "complained",
  );
});
test("all branded HTML templates escape customer-facing settings and retain useful text", () => {
  for (const template of notificationTemplates) {
    const result = renderNotification(template, "RJ-ORD-TEST", {
      businessName: "R&J <script>alert(1)</script>",
      primaryPhone: "0201234567",
      email: "team@example.invalid",
      whatsapp: "0201234567",
      address: "Test street",
    });
    assert.match(result.html, /role="presentation"/);
    assert.match(result.html, /viewport/);
    assert.match(result.html, /https:\/\/wa.me\/233201234567/);
    assert.ok(!result.html.includes("<script>"));
    assert.match(result.html, /&lt;script&gt;/);
    assert.ok(result.text.includes("Test street"));
    assert.ok(result.subject.includes("RJ-ORD-TEST"));
    assert.ok(!result.html.includes("internalNotes"));
  }
});
test("legacy jobs read as accepted and summaries omit sensitive worker/payload fields", () => {
  const summary = notificationSummary({
    status: "sent",
    sentAt: new Date(),
    payload: { reference: "RJ-ORD-1", html: "PRIVATE BODY" },
    leaseToken: "SECRET",
    eventOutbox: ["PRIVATE"],
  });
  assert.equal(summary.status, "accepted");
  assert.equal(summary.reference, "RJ-ORD-1");
  assert.ok(summary.acceptedAt);
  assert.ok(!JSON.stringify(summary).includes("PRIVATE"));
  assert.equal(summary.leaseToken, undefined);
  assert.equal(
    retryEligibility({
      status: "failed",
      uncertain: true,
      retryBefore: new Date(0),
    }).canRetry,
    false,
  );
  assert.equal(retryEligibility({ status: "bounced" }).canRetry, false);
});
test("notification filters escape regex and validate dates/status without widening invalid queries", () => {
  const query = notificationFilter({
    recipient: "a+b@example.invalid",
    reference: "RJ-ORD-123",
    status: "accepted",
    from: "2026-10-21",
    to: "2026-10-22",
  });
  assert.ok(query.recipient.test("a+b@example.invalid"));
  assert.ok(!query.recipient.test("aaab@example.invalid"));
  assert.deepEqual(query.status, { $in: ["accepted", "sent"] });
  for (const input of [
    { status: "invented" },
    { from: "2026-02-30" },
    { from: "2026-10-22", to: "2026-10-21" },
  ])
    assert.throws(() => notificationFilter(input), { statusCode: 400 });
});
