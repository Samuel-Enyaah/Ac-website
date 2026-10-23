// Isolated database and injected provider HTTP only. Never sends external email.
import dotenv from "dotenv";
import mongoose from "mongoose";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { Webhook } from "svix";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import ServiceBooking from "../src/models/ServiceBooking.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
import ActivityLog from "../src/models/ActivityLog.js";
import NotificationJob from "../src/models/NotificationJob.js";
import NotificationAttempt from "../src/models/NotificationAttempt.js";
import NotificationWebhookEvent from "../src/models/NotificationWebhookEvent.js";
import NotificationWorkerState from "../src/models/NotificationWorkerState.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
import {
  runNotifications,
  retryNotification,
} from "../src/services/notifications.js";
import { createResendTransport } from "../src/services/resendTransport.js";
import { recoverNotificationWebhooks } from "../src/services/notificationWebhooks.js";
import { recoverNotificationAudit } from "../src/services/notificationAudit.js";
import { renderNotification } from "../src/services/notificationTemplates.js";
import {
  projectAttempt,
  reviseAttempt,
} from "../src/services/notificationAttempts.js";
import { notificationHealth } from "../src/services/notificationReads.js";

dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
process.env.EMAIL_PROVIDER = "";
process.env.NODE_ENV = "test";
if (process.env.RUN_ISOLATED_QA !== "1")
  throw new Error("Explicit isolated QA opt-in required.");
const dbName = `rj_phase7d_notifications_${Date.now()}_${process.pid}`;
const secret = `whsec_${randomBytes(32).toString("base64")}`;
process.env.RESEND_WEBHOOK_SECRET = secret;
const signer = new Webhook(secret);
const providerEnv = {
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "qa-injected-placeholder",
  EMAIL_FROM_NAME: "R&J QA",
  EMAIL_FROM_ADDRESS: "qa@example.invalid",
  EMAIL_REPLY_TO: "support@example.invalid",
};
let server;
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName,
    serverSelectionTimeoutMS: 15000,
  });
  assert.equal(mongoose.connection.name, dbName);
  await Promise.all(
    [
      Order,
      ServiceBooking,
      ReservationAttempt,
      ActivityLog,
      NotificationJob,
      NotificationAttempt,
      NotificationWebhookEvent,
      NotificationWorkerState,
    ].map((Model) => Model.init()),
  );
  const { default: app } = await import("../src/app.js");
  const admin = await Admin.create({
    name: "Notification QA Admin",
    email: "admin@example.invalid",
    passwordHash: "qa-only",
    active: true,
  });
  const cookie = `${ADMIN_COOKIE}=${jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "30m" })}`;
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const request = async (
    path,
    {
      method = "GET",
      body,
      status = 200,
      anonymous = false,
      headers = {},
    } = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(!anonymous ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      status,
      `${method} ${path}: ${data.message || "Unexpected status"}`,
    );
    return data;
  };
  const webhook = async (
    id,
    type,
    {
      eventId = `msg_${randomUUID().replaceAll("-", "")}`,
      at = new Date(),
      status = 202,
      headers = {},
      body: supplied,
    } = {},
  ) => {
    const body =
      supplied ||
      JSON.stringify({
        type,
        created_at: at.toISOString(),
        data: {
          email_id: id,
          to: ["PRIVATE@example.invalid"],
          subject: "PRIVATE BODY",
          secret: "NEVER_RETAIN_THIS",
        },
      });
    const signedAt = new Date();
    await request("/webhooks/resend", {
      method: "POST",
      body,
      status,
      anonymous: true,
      headers: {
        "svix-id": eventId,
        "svix-timestamp": String(Math.floor(signedAt.getTime() / 1000)),
        "svix-signature": signer.sign(eventId, signedAt, body),
        ...headers,
      },
    });
    return eventId;
  };
  const receipts = new Map();
  let providerCalls = 0;
  const accepted = createResendTransport({
    env: providerEnv,
    fetchImpl: async (_url, request) => {
      providerCalls++;
      const key = request.headers["Idempotency-Key"];
      if (!receipts.has(key))
        receipts.set(key, { id: randomUUID(), body: request.body });
      else assert.equal(receipts.get(key).body, request.body);
      return Response.json({ id: receipts.get(key).id });
    },
  });
  const entityId = new mongoose.Types.ObjectId();
  const makeJob = (fields = {}) =>
    NotificationJob.create({
      eventKey: randomUUID(),
      channel: "email",
      template: "booking.pending",
      recipient: `qa-${randomUUID()}@example.invalid`,
      entityType: "booking",
      entityId,
      reference: "RJ-SVC-QA",
      payload: renderNotification("booking.pending", "RJ-SVC-QA", {
        businessName: "R&J QA",
        email: "support@example.invalid",
      }),
      ...fields,
    });
  const sendJob = async (fields) => {
    const job = await makeJob(fields);
    await runNotifications({ transport: accepted });
    return NotificationJob.findById(job._id);
  };

  await test("orders, booking receipts and stock remain valid when the provider is unavailable", async () => {
    const product = await Product.create({
      name: "Notification QA product",
      slug: "notification-qa",
      description: "Test product",
      category: "Accessories",
      price: 100,
      stock: 10,
      active: true,
    });
    const order = await request("/orders", {
      method: "POST",
      status: 201,
      anonymous: true,
      headers: { "Idempotency-Key": randomUUID() },
      body: {
        customer: {
          fullName: "QA Customer",
          phone: "0201234567",
          email: "qa-order@example.invalid",
        },
        items: [{ product: String(product._id), quantity: 2 }],
        fulfillmentMethod: "pickup",
        paymentMethod: "pay-on-delivery",
      },
    });
    const bookingBody = {
      customer: {
        name: "QA Customer",
        phone: "0201234567",
        email: "qa-booking@example.invalid",
      },
      serviceType: "maintenance",
      description: "QA service",
      preferredDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      preferredTime: "morning",
      units: 1,
      location: "QA",
    };
    const booking = await request("/service-bookings", {
      method: "POST",
      status: 201,
      anonymous: true,
      body: bookingBody,
    });
    await runNotifications();
    assert.equal(await NotificationJob.countDocuments({ status: "failed" }), 2);
    assert.equal((await Product.findById(product._id)).stock, 8);
    assert.equal((await Order.findById(order.order.id)).status, "pending");
    assert.equal(
      (await ServiceBooking.findById(booking.booking.id)).status,
      "pending",
    );
    assert.ok(
      !/notification|eventOutbox|internalNotes/.test(
        JSON.stringify({ order, booking }),
      ),
    );
    const count = await NotificationJob.countDocuments();
    delete bookingBody.customer.email;
    await request("/service-bookings", {
      method: "POST",
      status: 201,
      anonymous: true,
      body: bookingBody,
    });
    assert.equal(await NotificationJob.countDocuments(), count);
    await request("/service-bookings", {
      method: "POST",
      status: 400,
      anonymous: true,
      body: {
        ...bookingBody,
        customer: { ...bookingBody.customer, email: "invalid" },
      },
    });
  });
  let delivered;
  await test("real adapter contract persists provider ID and acceptance without claiming delivery", async () => {
    delivered = await sendJob();
    assert.equal(delivered.status, "accepted");
    assert.ok(delivered.providerMessageId);
    assert.ok(delivered.acceptedAt);
    assert.equal(delivered.deliveredAt, null);
    assert.equal(delivered.sentAt, null);
    const attempts = await NotificationAttempt.find({ jobId: delivered._id });
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].providerMessageId, delivered.providerMessageId);
  });
  await test("webhook rejects missing/invalid signatures and malformed authenticated payloads", async () => {
    await request("/webhooks/resend", {
      method: "POST",
      body: { type: "email.delivered" },
      anonymous: true,
      status: 401,
    });
    await webhook(delivered.providerMessageId, "email.delivered", {
      headers: { "svix-signature": "v1,invalid" },
      status: 401,
    });
    await webhook(delivered.providerMessageId, "email.delivered", {
      body: JSON.stringify({
        type: "email.delivered",
        created_at: new Date().toISOString(),
        data: { email_id: "invalid", jobId: String(delivered._id) },
      }),
      status: 400,
    });
    assert.equal(await NotificationWebhookEvent.countDocuments(), 0);
  });
  await test("duplicate signed delivery events update once and store no raw sensitive payload", async () => {
    const eventId = `msg_${randomUUID().replaceAll("-", "")}`;
    await Promise.all(
      Array.from({ length: 6 }, () =>
        webhook(delivered.providerMessageId, "email.delivered", { eventId }),
      ),
    );
    await Promise.all([
      recoverNotificationWebhooks(),
      recoverNotificationWebhooks(),
    ]);
    const job = await NotificationJob.findById(delivered._id);
    assert.equal(job.status, "delivered");
    assert.ok(job.deliveredAt);
    assert.equal(await NotificationWebhookEvent.countDocuments({ eventId }), 1);
    assert.equal(
      await ActivityLog.countDocuments({
        eventId: `resend-webhook:${eventId}`,
      }),
      1,
    );
    const stored = await NotificationWebhookEvent.findOne({ eventId }).lean();
    assert.ok(!JSON.stringify(stored).includes("NEVER_RETAIN_THIS"));
    assert.equal(stored.data, undefined);
  });
  await test("older acceptance never regresses delivery and unknown message IDs cannot target jobs", async () => {
    await webhook(delivered.providerMessageId, "email.sent", {
      at: new Date(Date.now() - 60000),
    });
    await webhook(randomUUID(), "email.delivered");
    await recoverNotificationWebhooks();
    assert.equal(
      (await NotificationJob.findById(delivered._id)).status,
      "delivered",
    );
    assert.equal(
      await NotificationWebhookEvent.countDocuments({ processedAt: null }),
      1,
    );
  });
  await test("a webhook arriving before the send response is recovered by trusted provider message ID", async () => {
    const job = await makeJob();
    const id = randomUUID();
    const early = createResendTransport({
      env: providerEnv,
      fetchImpl: async () => {
        await webhook(id, "email.delivered");
        await recoverNotificationWebhooks();
        return Response.json({ id });
      },
    });
    await runNotifications({ transport: early });
    await recoverNotificationWebhooks({ now: new Date(Date.now() + 61000) });
    assert.equal((await NotificationJob.findById(job._id)).status, "delivered");
  });
  await test("bounce and complaint remain terminal, block retry and suppress later automated mail", async () => {
    const job = await sendJob();
    await webhook(job.providerMessageId, "email.complained");
    await webhook(job.providerMessageId, "email.bounced", {
      at: new Date(Date.now() - 1000),
    });
    await recoverNotificationWebhooks();
    assert.equal(
      (await NotificationJob.findById(job._id)).status,
      "complained",
    );
    await request(`/admin/operations/notifications/${job._id}/retry`, {
      method: "POST",
      body: {},
      status: 409,
    });
    const future = await makeJob({ recipient: job.recipient });
    const calls = providerCalls;
    await runNotifications({ transport: accepted });
    assert.equal(providerCalls, calls);
    assert.equal(
      (await NotificationJob.findById(future._id)).failureCode,
      "suppressed",
    );
    const bounced = await sendJob();
    await webhook(bounced.providerMessageId, "email.bounced");
    await recoverNotificationWebhooks();
    assert.equal(
      (await NotificationJob.findById(bounced._id)).status,
      "bounced",
    );
  });
  await test("provider failure permits controlled fresh attempts while preserving old history", async () => {
    const job = await sendJob();
    await webhook(job.providerMessageId, "email.failed");
    await recoverNotificationWebhooks();
    assert.equal((await NotificationJob.findById(job._id)).status, "failed");
    await request(`/admin/operations/notifications/${job._id}/retry`, {
      method: "POST",
      body: { recipient: "override@example.invalid" },
      status: 400,
    });
    await request(`/admin/operations/notifications/${job._id}/retry`, {
      method: "POST",
      body: {},
      anonymous: true,
      status: 401,
    });
    await retryNotification(job._id, admin);
    await runNotifications({ transport: accepted });
    const latest = await NotificationJob.findById(job._id);
    assert.equal(latest.status, "accepted");
    assert.equal(latest.deliveryGeneration, 1);
    assert.equal(latest.recipient, job.recipient);
    assert.notEqual(latest.providerMessageId, job.providerMessageId);
    assert.equal(
      await NotificationAttempt.countDocuments({ jobId: job._id }),
      2,
    );
    await webhook(job.providerMessageId, "email.failed");
    await recoverNotificationWebhooks();
    assert.equal(
      (await NotificationJob.findById(job._id)).providerMessageId,
      latest.providerMessageId,
    );
  });
  await test("429 retry freezes sender/body and reuses the original delivery key", async () => {
    const job = await makeJob();
    const requests = [];
    const now = new Date();
    const adapter = createResendTransport({
      env: providerEnv,
      fetchImpl: async (_url, request) => {
        requests.push(request);
        return requests.length === 1
          ? Response.json({}, { status: 429, headers: { "Retry-After": "60" } })
          : Response.json({ id: randomUUID() });
      },
    });
    await runNotifications({ transport: adapter, now });
    let stored = await NotificationJob.findById(job._id);
    assert.equal(stored.status, "retrying");
    assert.ok(stored.nextRetryAt >= new Date(now.getTime() + 60000));
    const changed = createResendTransport({
      env: { ...providerEnv, EMAIL_FROM_ADDRESS: "new-sender@example.invalid" },
      fetchImpl: async (_url, request) => {
        requests.push(request);
        return Response.json({ id: randomUUID() });
      },
    });
    await runNotifications({
      transport: changed,
      now: new Date(now.getTime() + 61000),
    });
    assert.equal(
      requests[0].headers["Idempotency-Key"],
      requests[1].headers["Idempotency-Key"],
    );
    assert.equal(requests[0].body, requests[1].body);
    assert.equal((await NotificationJob.findById(job._id)).status, "accepted");
  });
  await test("uncertain timeout outside provider retention blocks automatic and manual resend", async () => {
    const job = await makeJob();
    const now = new Date();
    let calls = 0;
    const adapter = createResendTransport({
      env: providerEnv,
      fetchImpl: async () => {
        calls++;
        throw new Error("SECRET_PROVIDER_NETWORK_ERROR");
      },
    });
    await runNotifications({ transport: adapter, now });
    let stored = await NotificationJob.findById(job._id);
    assert.equal(stored.status, "retrying");
    assert.equal(stored.uncertain, true);
    assert.ok(!stored.lastError.includes("SECRET"));
    await runNotifications({
      transport: adapter,
      now: new Date(now.getTime() + 24 * 3600000),
    });
    stored = await NotificationJob.findById(job._id);
    assert.equal(stored.status, "failed");
    assert.equal(stored.failureCode, "window_expired");
    assert.equal(calls, 1);
    await assert.rejects(
      retryNotification(job._id, admin, new Date(now.getTime() + 24 * 3600000)),
      { statusCode: 409 },
    );
  });
  await test("manual retry of an uncertain outcome inside its window replays without a new key", async () => {
    const job = await makeJob({ maxAttempts: 1 });
    let first;
    const failing = createResendTransport({
      env: providerEnv,
      fetchImpl: async (_url, request) => {
        first = request;
        return Response.json({}, { status: 503 });
      },
    });
    await runNotifications({ transport: failing });
    await retryNotification(job._id, admin);
    const replay = createResendTransport({
      env: providerEnv,
      fetchImpl: async (_url, request) => {
        assert.equal(
          request.headers["Idempotency-Key"],
          first.headers["Idempotency-Key"],
        );
        return Response.json({ id: randomUUID() });
      },
    });
    await runNotifications({ transport: replay });
    const stored = await NotificationJob.findById(job._id);
    assert.equal(stored.status, "accepted");
    assert.equal(stored.deliveryGeneration, 0);
    assert.equal(stored.retryCount, 1);
  });
  await test("acceptance survives a job projection interruption without another provider call", async () => {
    const job = await makeJob();
    const original = NotificationJob.updateOne;
    let injected = false;
    NotificationJob.updateOne = function (query, update, ...rest) {
      if (
        String(query._id) === String(job._id) &&
        update.$set?.status === "accepted" &&
        !injected
      ) {
        injected = true;
        throw new Error("Injected persistence interruption");
      }
      return original.call(this, query, update, ...rest);
    };
    try {
      await runNotifications({ transport: accepted });
    } finally {
      NotificationJob.updateOne = original;
    }
    const calls = providerCalls;
    await runNotifications({ transport: accepted });
    assert.equal(providerCalls, calls);
    assert.equal((await NotificationJob.findById(job._id)).status, "accepted");
    assert.equal(
      await ActivityLog.countDocuments({
        eventId: `notification:${job._id}:delivery:0:accepted`,
      }),
      1,
    );
  });
  await test("stale projection cannot regress delivery and the trusted email body is immutable", async () => {
    const job = await sendJob();
    const original = await NotificationAttempt.findOne({
      jobId: job._id,
    }).lean();
    await NotificationJob.updateOne(
      { _id: job._id },
      { $set: { "payload.text": "UNTRUSTED REPLACEMENT" } },
    );
    assert.notEqual(
      (await NotificationJob.findById(job._id)).payload.text,
      "UNTRUSTED REPLACEMENT",
    );
    await webhook(job.providerMessageId, "email.delivered");
    await recoverNotificationWebhooks();
    assert.equal(await projectAttempt(job, original), 0);
    assert.equal((await NotificationJob.findById(job._id)).status, "delivered");
    // A late concurrent projection must remain discoverable even behind many failures.
    for (let n = 0; n < 55; n++) await makeJob({ status: "failed" });
    await reviseAttempt(original._id, () => ({
      status: "complained",
      complainedAt: new Date(),
    }));
    const calls = providerCalls;
    await runNotifications({ transport: accepted });
    assert.equal(providerCalls, calls);
    assert.equal(
      (await NotificationJob.findById(job._id)).status,
      "complained",
    );
  });
  await test("delivery webhook racing acceptance projection preserves both activity events", async () => {
    const job = await makeJob();
    const original = NotificationJob.updateOne;
    let injected = false;
    NotificationJob.updateOne = async function (query, update, ...rest) {
      if (
        String(query._id) === String(job._id) &&
        query.leaseToken &&
        update.$set?.status === "accepted" &&
        !injected
      ) {
        injected = true;
        await webhook(update.$set.providerMessageId, "email.delivered");
        await recoverNotificationWebhooks();
      }
      return original.call(this, query, update, ...rest);
    };
    try {
      await runNotifications({ transport: accepted });
    } finally {
      NotificationJob.updateOne = original;
    }
    assert.equal((await NotificationJob.findById(job._id)).status, "delivered");
    assert.equal(
      await ActivityLog.countDocuments({
        eventId: `notification:${job._id}:delivery:0:accepted`,
      }),
      1,
    );
    assert.equal(
      await ActivityLog.countDocuments({
        "metadata.notificationId": String(job._id),
        action: "notification-delivered",
      }),
      1,
    );
  });
  await test("notification audit interruption retains an outbox and replays only once", async () => {
    const job = await makeJob();
    const original = ActivityLog.updateOne;
    ActivityLog.updateOne = async () => {
      throw new Error("Injected audit interruption");
    };
    try {
      await runNotifications({ transport: accepted });
    } finally {
      ActivityLog.updateOne = original;
    }
    assert.ok(
      (await NotificationJob.findById(job._id).select("+eventOutbox"))
        .eventOutbox.length,
    );
    await Promise.all([recoverNotificationAudit(), recoverNotificationAudit()]);
    assert.equal(
      await ActivityLog.countDocuments({
        eventId: `notification:${job._id}:delivery:0:accepted`,
      }),
      1,
    );
  });
  await test("transparent health rules expose authentication failures and stale worker progress", async () => {
    const auth = createResendTransport({
      env: providerEnv,
      fetchImpl: async () =>
        Response.json({ message: "secret API key invalid" }, { status: 401 }),
    });
    for (let n = 0; n < 5; n++) await makeJob();
    await runNotifications({ transport: auth });
    await makeJob({ nextRetryAt: new Date(Date.now() - 20 * 60000) });
    await NotificationWorkerState.updateOne(
      { key: "email" },
      { $set: { progressedAt: new Date(Date.now() - 20 * 60000) } },
    );
    const health = await notificationHealth();
    assert.ok(health.alerts.some((a) => a.code === "authentication"));
    assert.ok(health.alerts.some((a) => a.code === "failures"));
    assert.ok(health.alerts.some((a) => a.code === "worker"));
    assert.ok(health.alerts.some((a) => a.code === "configuration"));
    await runNotifications();
  });
  await test("admin filters, sort, pagination, auth and privacy remain explicit", async () => {
    for (let n = 0; n < 28; n++)
      await makeJob({
        reference: `RJ-SVC-FILTER-${String(n).padStart(2, "0")}`,
        recipient: "filters@example.invalid",
        status: "failed",
        failureCode: "configuration",
      });
    const first = await request(
      "/admin/operations/notifications?status=failed&channel=email&entityType=booking&template=booking.pending&reference=FILTER&recipient=filters%40example.invalid&sort=oldest",
    );
    assert.equal(first.pagination.total, 28);
    assert.equal(first.notifications.length, 25);
    const last = await request(
      "/admin/operations/notifications?reference=FILTER&page=2&sort=oldest",
    );
    assert.equal(last.notifications.length, 3);
    assert.ok(!JSON.stringify(first).includes("<!doctype"));
    assert.ok(!JSON.stringify(first).includes("leaseToken"));
    assert.ok(!JSON.stringify(first).includes("idempotencyKey"));
    await request("/admin/operations/notifications/health", {
      anonymous: true,
      status: 401,
    });
    await request("/admin/operations/notifications?status=invalid", {
      status: 400,
    });
    const activity = await ActivityLog.find().lean();
    const audit = JSON.stringify(activity);
    assert.ok(!audit.includes("NEVER_RETAIN_THIS"));
    assert.ok(!audit.includes("PRIVATE BODY"));
    assert.ok(!audit.includes("qa-injected-placeholder"));
    assert.ok(!audit.includes("<!doctype"));
    assert.ok(activity.some((a) => a.action === "notification-created"));
    assert.ok(
      activity.some(
        (a) =>
          a.action === "notification-retry-requested" &&
          String(a.actorId) === String(admin._id),
      ),
    );
  });
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === dbName &&
    /^rj_phase7d_notifications_\d+_\d+$/.test(dbName)
  ) {
    await mongoose.connection.dropDatabase();
    console.log(
      "Isolated notification QA database cleaned. No external email sent.",
    );
  }
  await mongoose.disconnect();
}
