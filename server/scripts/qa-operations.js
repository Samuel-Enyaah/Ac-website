// Explicit opt-in. Connection always overrides the URI database; cleanup checks
// the exact disposable name. Notification delivery is simulated, never emailed.
import dotenv from "dotenv";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import Order from "../src/models/Order.js";
import Product from "../src/models/Product.js";
import ServiceBooking from "../src/models/ServiceBooking.js";
import Staff from "../src/models/Staff.js";
import ActivityLog from "../src/models/ActivityLog.js";
import NotificationJob from "../src/models/NotificationJob.js";
import BusinessSettings from "../src/models/BusinessSettings.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
import {
  projectOperations,
  recoverOperations,
} from "../src/services/operationsOutbox.js";
import { runNotifications } from "../src/services/notifications.js";
import { createTestTransport } from "../src/services/notificationTransports.js";
import { createIdempotentBooking } from "../src/services/bookingRequests.js";

dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
if (process.env.RUN_ISOLATED_QA !== "1")
  throw new Error("Set RUN_ISOLATED_QA=1 to run isolated operations QA.");
const dbName = `rj_phase7c_qa_${Date.now()}_${process.pid}`;
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
      Staff,
      ActivityLog,
      NotificationJob,
      ReservationAttempt,
    ].map((Model) => Model.init()),
  );
  const { default: app } = await import("../src/app.js");
  const admin = await Admin.create({
    name: "Operations QA Admin",
    email: "qa-admin@example.invalid",
    passwordHash: "isolated-hash",
    active: true,
  });
  const cookie = `${ADMIN_COOKIE}=${jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "30m" })}`;
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const request = async (
    path,
    method = "GET",
    body,
    status = 200,
    { key, anonymous = false } = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(!anonymous ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      status,
      `${method} ${path}: ${data.message || "unexpected HTTP status"}`,
    );
    return data;
  };
  const bookingInput = {
    customer: {
      name: "QA Operations Customer",
      phone: "0201234567",
      email: "qa-customer@example.invalid",
    },
    serviceType: "maintenance",
    description: "Isolated operations service request",
    preferredDate: new Date(Date.now() + 86400000 * 7)
      .toISOString()
      .slice(0, 10),
    preferredTime: "morning",
    units: 1,
    location: "Isolated QA location",
  };
  const bookingKey = randomUUID();
  let booking, order, staffA, staffB, product;
  const assignment = (type, id, staffId, note = "") =>
    request(`/admin/operations/${type}/${id}/assignment`, "POST", {
      staffId,
      note,
    });
  const status = (type, id, state, expected = 200) =>
    request(`/admin/${type}/${id}`, "PATCH", { status: state }, expected);
  const simulation = createTestTransport();
  await BusinessSettings.create({
    key: "main",
    businessName: "Isolated R&J Operations QA",
    primaryPhone: "0200000000",
    email: "qa-business@example.invalid",
    whatsapp: "233200000000",
    address: "Isolated QA",
  });

  await test("anonymous booking same-key concurrency creates exactly one booking and immutable receipt", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request("/service-bookings", "POST", bookingInput, 201, {
          key: bookingKey,
          anonymous: true,
        }),
      ),
    );
    booking = responses[0].booking;
    for (const result of responses) assert.deepEqual(result.booking, booking);
    assert.equal(await ServiceBooking.countDocuments(), 1);
    assert.match(booking.bookingNumber, /^RJ-SVC-\d{4}-\d{6}$/);
    assert.equal(
      await NotificationJob.countDocuments({ entityId: booking.id }),
      1,
    );
  });
  await test("changed booking details conflict; canonical ordering and email case replay", async () => {
    await request(
      "/service-bookings",
      "POST",
      { ...bookingInput, location: "Different location" },
      409,
      { key: bookingKey },
    );
    const replay = await request(
      "/service-bookings",
      "POST",
      {
        ...bookingInput,
        customer: {
          email: "QA-CUSTOMER@example.invalid",
          phone: "0201234567",
          name: bookingInput.customer.name,
        },
      },
      201,
      { key: bookingKey },
    );
    assert.deepEqual(replay.booking, booking);
  });
  await test("lost receipt replays after status change and after requested date has passed", async () => {
    await status("bookings", booking.id, "confirmed");
    assert.deepEqual(
      (
        await request("/service-bookings", "POST", bookingInput, 201, {
          key: bookingKey,
        })
      ).booking,
      booking,
    );
    const key = randomUUID();
    const data = { ...bookingInput, preferredDate: "2001-01-01" };
    // A successful historical attempt fixture verifies replay precedes today's date check.
    const original = await createIdempotentBooking(bookingInput, key);
    const { createHash } = await import("node:crypto");
    const keyHash = createHash("sha256").update(key).digest("hex");
    const doc = await ServiceBooking.findOne({ keyHash }).select(
      "+requestHash",
    );
    const canonical = (v) =>
      v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, canonical(v[k])]),
          )
        : v;
    const normalized = {
      ...data,
      customer: { ...data.customer },
      acType: "",
      brand: "",
      units: 1,
      landmark: "",
      notes: "",
    };
    await ServiceBooking.collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          requestHash: createHash("sha256")
            .update(JSON.stringify(canonical(normalized)))
            .digest("hex"),
        },
      },
    );
    assert.deepEqual(await createIdempotentBooking(data, key), original);
  });
  await test("keyless bookings stay compatible and invalid keys/dates fail without creation", async () => {
    const one = await request("/service-bookings", "POST", bookingInput, 201);
    const two = await request("/service-bookings", "POST", bookingInput, 201);
    assert.notEqual(one.booking.id, two.booking.id);
    await request("/service-bookings", "POST", bookingInput, 400, {
      key: "short",
    });
    await request(
      "/service-bookings",
      "POST",
      { ...bookingInput, preferredDate: "2030-02-31" },
      400,
    );
  });
  await test("operational routes reject anonymous callers and Staff cannot create a login", async () => {
    for (const path of [
      "/admin/staff",
      "/admin/operations/notifications",
      `/admin/bookings/${booking.id}`,
    ])
      await request(path, "GET", undefined, 401, { anonymous: true });
    await request(
      `/admin/operations/bookings/${booking.id}/notes`,
      "POST",
      { text: "Unauthorized" },
      401,
      { anonymous: true },
    );
    await request(
      "/admin/staff",
      "POST",
      { name: "Unsafe staff", role: "Administrator", password: "not-accepted" },
      400,
    );
    staffA = (
      await request(
        "/admin/staff",
        "POST",
        {
          name: "QA Technician A",
          role: "Technician",
          phone: "0201111111",
          email: "qa-staff-a@example.invalid",
          skills: ["Maintenance"],
        },
        201,
      )
    ).staff;
    staffB = (
      await request(
        "/admin/staff",
        "POST",
        { name: "QA Operations B", role: "Operations", skills: ["Dispatch"] },
        201,
      )
    ).staff;
    assert.equal(await Admin.countDocuments(), 1);
    await request(`/admin/staff/${staffA._id}`, "DELETE", undefined, 404);
  });
  await test("booking workflow rejects missing assignment, missing staff and skipped states", async () => {
    await status("bookings", booking.id, "technician-assigned", 400);
    await status("bookings", booking.id, "completed", 400);
    await request(
      `/admin/operations/bookings/${booking.id}/assignment`,
      "POST",
      { staffId: String(new mongoose.Types.ObjectId()) },
      400,
    );
  });
  await test("active assignment, reassignment, deactivation and historical readability", async () => {
    await assignment("bookings", booking.id, staffA._id, "First visit owner");
    await assignment(
      "bookings",
      booking.id,
      staffB._id,
      "Reassigned for schedule",
    );
    await request(`/admin/staff/${staffB._id}`, "PATCH", { active: false });
    await request(`/admin/staff/${staffB._id}`, "PATCH", {
      phone: "0203334444",
    });
    const preserved = (await request(`/admin/staff/${staffB._id}`)).staff;
    assert.equal(preserved.active, false);
    assert.deepEqual(preserved.skills, ["Dispatch"]);
    assert.equal(preserved.name, staffB.name);
    await request(`/admin/staff/${staffB._id}`, "PATCH", {}, 400);
    const detail = (await request(`/admin/bookings/${booking.id}`)).booking;
    assert.equal(detail.assignmentHistory.length, 2);
    assert.equal(detail.assignedStaffActive, false);
    assert.equal(detail.assignmentHistory[0].name, staffA.name);
    assert.equal(detail.assignedStaffName, staffB.name);
    await request(
      `/admin/operations/bookings/${booking.id}/assignment`,
      "POST",
      { staffId: staffB._id },
      400,
    );
    await assignment("bookings", booking.id, staffA._id);
    await request(`/admin/staff/${staffB._id}`, "PATCH", { active: true });
    assert.equal(
      (
        await request(
          `/admin/staff?role=Technician&skill=Maintenance&active=true`,
        )
      ).staff.length,
      1,
    );
  });
  await test("booking progresses through assigned, in-progress and completed; terminal reopening fails", async () => {
    for (const state of ["technician-assigned", "in-progress", "completed"])
      await status("bookings", booking.id, state);
    await status("bookings", booking.id, "confirmed", 400);
    await request(
      `/admin/operations/bookings/${booking.id}/assignment`,
      "POST",
      { staffId: staffB._id },
      409,
    );
    assert.deepEqual(
      (
        await request("/service-bookings", "POST", bookingInput, 201, {
          key: bookingKey,
        })
      ).booking,
      booking,
    );
  });
  await test("append-only notes preserve authenticated authors, retry once and reject spoofed author", async () => {
    const noteId = randomUUID();
    const endpoint = `/admin/operations/bookings/${booking.id}/notes`;
    await Promise.all(
      Array.from({ length: 3 }, () =>
        request(endpoint, "POST", { text: "Private operational note", noteId }),
      ),
    );
    await request(endpoint, "POST", { text: "Second note" });
    await request(
      endpoint,
      "POST",
      { text: "Spoofed", authorId: staffA._id },
      400,
    );
    await request(endpoint, "POST", { text: "Changed content", noteId }, 409);
    const detail = (await request(`/admin/bookings/${booking.id}`)).booking;
    assert.equal(detail.internalNotes.length, 2);
    assert.equal(detail.internalNotes[0].authorId, String(admin._id));
    await request(endpoint, "PATCH", { text: "Overwrite" }, 404);
    const receipt = await request(
      "/service-bookings",
      "POST",
      bookingInput,
      201,
      { key: bookingKey },
    );
    assert.ok(!JSON.stringify(receipt).includes("Private operational"));
    for (const field of [
      "internalNotes",
      "assignmentHistory",
      "eventOutbox",
      "keyHash",
      "requestHash",
      "recipient",
    ])
      assert.ok(!JSON.stringify(receipt).includes(field));
  });
  await test("order create, confirm, process, assign, ready and pickup delivery preserve stock", async () => {
    product = await Product.create({
      name: "Isolated operations product",
      slug: `operations-qa-${Date.now()}`,
      category: "Accessories",
      description: "QA operations product",
      price: 25,
      stock: 10,
      active: true,
    });
    order = (
      await request(
        "/orders",
        "POST",
        {
          customer: {
            fullName: bookingInput.customer.name,
            phone: bookingInput.customer.phone,
            email: bookingInput.customer.email,
          },
          items: [{ product: String(product._id), quantity: 2 }],
          fulfillmentMethod: "pickup",
          paymentMethod: "pay-on-delivery",
        },
        201,
        { key: randomUUID() },
      )
    ).order;
    await status("orders", order.id, "delivered", 400);
    for (const state of ["confirmed", "processing"])
      await status("orders", order.id, state);
    await assignment("orders", order.id, staffB._id);
    await request(`/admin/operations/orders/${order.id}/notes`, "POST", {
      text: "Pack carefully",
    });
    await status("orders", order.id, "ready");
    await status("orders", order.id, "out-for-delivery", 400);
    await status("orders", order.id, "delivered");
    await status("orders", order.id, "processing", 400);
    await status("orders", order.id, "cancelled", 400);
    await request(`/admin/orders/${order.id}`, "PATCH", {
      paymentStatus: "paid",
    });
    assert.equal((await Product.findById(product._id)).stock, 8);
  });
  await test("delivery branch and concurrent cancellation restoration retain exact stock", async () => {
    const input = {
      customer: { fullName: "Delivery QA", phone: "0209999999" },
      items: [{ product: String(product._id), quantity: 1 }],
      fulfillmentMethod: "delivery",
      deliveryAddress: { address: "QA street", town: "QA town" },
      paymentMethod: "pay-on-delivery",
    };
    const delivery = (await request("/orders", "POST", input, 201)).order;
    for (const state of ["confirmed", "processing", "ready"])
      await status("orders", delivery.id, state);
    await status("orders", delivery.id, "delivered", 400);
    await status("orders", delivery.id, "out-for-delivery");
    await Promise.all([
      status("orders", delivery.id, "cancelled"),
      status("orders", delivery.id, "cancelled"),
    ]);
    assert.equal((await Product.findById(product._id)).stock, 8);
    await status("orders", delivery.id, "confirmed", 400);
    assert.equal(
      await ActivityLog.countDocuments({
        entityId: delivery.id,
        action: "stock-restored",
      }),
      1,
    );
  });
  await test("audit actors and limited metadata reflect meaningful operations, not note bodies or secrets", async () => {
    const events = await ActivityLog.find({ entityId: booking.id }).lean();
    for (const action of [
      "created",
      "status-changed",
      "assigned",
      "reassigned",
      "completed",
      "internal-note-added",
    ])
      assert.ok(
        events.some((e) => e.action === action),
        action,
      );
    assert.equal(
      events.find((e) => e.action === "created").actorType,
      "customer",
    );
    for (const event of events.filter((e) => e.action !== "created"))
      assert.equal(String(event.actorId), String(admin._id));
    const serialized = JSON.stringify(events);
    for (const forbidden of [
      "password",
      "JWT",
      "api_secret",
      "signature",
      "Private operational note",
      bookingInput.customer.email,
    ])
      assert.ok(!serialized.includes(forbidden));
    assert.ok(
      await ActivityLog.exists({ entityType: "staff", action: "deactivated" }),
    );
  });
  await test("outbox interruption is recoverable without duplicate audit or notification jobs", async () => {
    const receipt = await createIdempotentBooking(bookingInput, randomUUID());
    const original = NotificationJob.updateOne;
    try {
      NotificationJob.updateOne = async () => {
        throw new Error("Injected interruption");
      };
      await assert.rejects(projectOperations("booking", receipt.id));
    } finally {
      NotificationJob.updateOne = original;
    }
    assert.equal(
      (await ServiceBooking.findById(receipt.id).select("+eventOutbox"))
        .eventOutbox.length,
      1,
    );
    await Promise.all([
      projectOperations("booking", receipt.id),
      projectOperations("booking", receipt.id),
    ]);
    await recoverOperations();
    assert.equal(await ActivityLog.countDocuments({ entityId: receipt.id }), 1);
    assert.equal(
      await NotificationJob.countDocuments({ entityId: receipt.id }),
      1,
    );
    assert.equal(
      (await ServiceBooking.findById(receipt.id).select("+eventOutbox"))
        .eventOutbox.length,
      0,
    );
  });
  await test("notification templates use real references/settings and simulation never marks sent", async () => {
    await runNotifications({ limit: 100, transport: simulation });
    const jobs = await NotificationJob.find();
    assert.ok(jobs.length > 10);
    for (const job of jobs) {
      assert.equal(job.status, "simulated");
      assert.equal(job.sentAt, null);
      assert.ok(job.simulatedAt);
      assert.match(job.payload.text, /Isolated R&J Operations QA/);
      assert.match(job.payload.reference, /^RJ-(ORD|SVC)-/);
    }
    const count = simulation.receipts.size;
    await runNotifications({ limit: 100, transport: simulation });
    assert.equal(simulation.receipts.size, count);
  });
  const makeJob = () =>
    NotificationJob.create({
      eventKey: randomUUID(),
      channel: "email",
      template: "booking.pending",
      recipient: "trusted@example.invalid",
      entityType: "booking",
      entityId: booking.id,
      payload: {
        reference: booking.bookingNumber,
        subject: "QA",
        text: "QA only",
      },
    });
  await test("transient failures sanitize errors, back off and retry with the same event key", async () => {
    const job = await makeJob();
    const transport = createTestTransport({
      fail: () => {
        throw new Error(
          "secret=NEVER_LOG_THIS recipient=private@example.invalid",
        );
      },
    });
    const now = new Date();
    await runNotifications({ transport, now });
    const failed = await NotificationJob.findById(job._id);
    assert.equal(failed.status, "pending");
    assert.equal(failed.attempts, 1);
    assert.ok(failed.nextRetryAt > now);
    assert.ok(!failed.lastError.includes("NEVER_LOG_THIS"));
    await runNotifications({
      transport: simulation,
      now: new Date(now.getTime() + 31000),
    });
    const retried = await NotificationJob.findById(job._id);
    assert.equal(retried.status, "simulated");
    assert.equal(retried.attempts, 2);
    assert.ok(simulation.receipts.has(job.eventKey));
  });
  await test("permanent unconfigured failures are visible and retry rejects recipient overrides", async () => {
    const job = await makeJob();
    await runNotifications();
    const failed = await NotificationJob.findById(job._id);
    assert.equal(failed.status, "failed");
    assert.match(failed.lastError, /no provider/);
    await request(
      `/admin/operations/notifications/${job._id}/retry`,
      "POST",
      { recipient: "attacker@example.invalid" },
      400,
    );
    await request(
      `/admin/operations/notifications/${job._id}/retry`,
      "POST",
      {},
      401,
      { anonymous: true },
    );
    await request(
      `/admin/operations/notifications/${job._id}/retry`,
      "POST",
      {},
    );
    assert.equal(
      (await NotificationJob.findById(job._id)).recipient,
      "trusted@example.invalid",
    );
    await runNotifications({ transport: simulation });
    assert.equal((await NotificationJob.findById(job._id)).status, "simulated");
    await request(
      `/admin/operations/notifications/${job._id}/retry`,
      "POST",
      {},
      409,
    );
  });
  await test("expired leases recover safely with event deduplication and active leases cannot be stolen", async () => {
    const job = await makeJob();
    const now = new Date();
    await NotificationJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "processing",
          leaseUntil: new Date(now.getTime() + 60000),
          leaseToken: "old",
          attempts: 1,
          cycleAttempts: 1,
        },
      },
    );
    await runNotifications({ transport: simulation, now });
    assert.equal(
      (await NotificationJob.findById(job._id)).status,
      "processing",
    );
    await simulation.send({ idempotencyKey: job.eventKey });
    const before = simulation.receipts.size;
    await Promise.all([
      runNotifications({
        transport: simulation,
        now: new Date(now.getTime() + 61000),
      }),
      runNotifications({
        transport: simulation,
        now: new Date(now.getTime() + 61000),
      }),
    ]);
    assert.equal((await NotificationJob.findById(job._id)).status, "simulated");
    assert.equal(simulation.receipts.size, before);
  });
  await test("attempt limits and expired final attempts become failed instead of looping forever", async () => {
    const job = await makeJob();
    await NotificationJob.updateOne(
      { _id: job._id },
      { $set: { maxAttempts: 1 } },
    );
    await runNotifications({
      transport: createTestTransport({
        fail: () => {
          throw new Error("Transient");
        },
      }),
    });
    assert.equal((await NotificationJob.findById(job._id)).status, "failed");
    const interrupted = await makeJob();
    await NotificationJob.updateOne(
      { _id: interrupted._id },
      {
        $set: {
          status: "processing",
          attempts: 5,
          cycleAttempts: 5,
          leaseUntil: new Date(0),
        },
      },
    );
    await runNotifications({ transport: simulation });
    assert.equal(
      (await NotificationJob.findById(interrupted._id)).status,
      "failed",
    );
  });
  await test("provider acceptance contract records sent once under concurrent workers", async () => {
    const job = await makeJob();
    let calls = 0;
    // Injected adapter contract test only; no external message is sent.
    const adapter = {
      name: "isolated-acceptance-contract",
      supportsIdempotency: true,
      async send(message) {
        calls++;
        assert.equal(message.recipient, "trusted@example.invalid");
        return { accepted: true };
      },
    };
    await Promise.all([
      runNotifications({ transport: adapter }),
      runNotifications({ transport: adapter }),
    ]);
    const accepted = await NotificationJob.findById(job._id);
    assert.equal(calls, 1);
    assert.equal(accepted.status, "sent");
    assert.ok(accepted.sentAt);
    assert.equal(accepted.simulatedAt, null);
    await runNotifications({ transport: adapter });
    assert.equal(calls, 1);
  });
  await test("stale worker completion cannot overwrite the current lease owner's result", async () => {
    const job = await makeJob();
    let release, started;
    const began = new Promise((resolve) => {
      started = resolve;
    });
    const adapter = {
      name: "isolated-delayed-contract",
      supportsIdempotency: true,
      async send() {
        started();
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    };
    const running = runNotifications({ limit: 1, transport: adapter });
    await began;
    await NotificationJob.updateOne(
      { _id: job._id },
      {
        $set: {
          leaseToken: "new-owner",
          status: "failed",
          lastError: "New owner result",
        },
      },
    );
    release({ accepted: true });
    await running;
    const fenced = await NotificationJob.findById(job._id);
    assert.equal(fenced.status, "failed");
    assert.equal(fenced.lastError, "New owner result");
    assert.equal(fenced.sentAt, null);
  });
  await test("settings changes audit field names without exposing their content publicly", async () => {
    const settings = (await request("/admin/settings")).settings;
    const allowed = [
      "businessName",
      "legalName",
      "slogan",
      "primaryPhone",
      "secondaryPhone",
      "whatsapp",
      "email",
      "address",
      "city",
      "region",
      "country",
      "mapUrl",
      "deliveryNote",
      "serviceCoverage",
      "bookingNote",
      "openingHours",
      "socialLinks",
    ];
    const payload = Object.fromEntries(
      allowed.map((key) => [key, settings[key]]),
    );
    payload.slogan = "Updated isolated operations slogan";
    await request("/admin/settings", "PUT", payload);
    const audit = await ActivityLog.findOne({
      entityType: "settings",
      action: "updated",
    });
    assert.ok(audit.metadata.fields.includes("slogan"));
    assert.equal(String(audit.actorId), String(admin._id));
    assert.ok(!JSON.stringify(audit).includes(payload.slogan));
    assert.ok(
      !JSON.stringify(await request("/settings")).includes("eventOutbox"),
    );
  });
  await test("dashboard filters, notification history and CRM retain operational context", async () => {
    const dashboard = (await request("/admin/dashboard")).dashboard;
    assert.ok(dashboard.stats.failedNotifications >= 2);
    assert.ok(dashboard.recentActivity.length);
    assert.equal(
      (
        await request(
          `/admin/orders?assignedStaff=${staffB._id}&paymentStatus=paid&status=delivered`,
        )
      ).orders.length,
      1,
    );
    const customer = await request("/admin/customers/233201234567");
    assert.ok(customer.orders.some((o) => o._id === order.id));
    assert.ok(customer.bookings.some((b) => b._id === booking.id));
    assert.ok(customer.activity.length);
    const detail = (await request(`/admin/bookings/${booking.id}`)).booking;
    assert.ok(detail.notifications.some((j) => j.status === "failed"));
    assert.ok(!JSON.stringify(detail.notifications).includes("leaseToken"));
    const publicSettings = await request("/settings");
    assert.ok(!JSON.stringify(publicSettings).includes("eventOutbox"));
  });
} catch (error) {
  console.error(
    "Operations QA setup failed:",
    error.name,
    String(error.message).replace(
      /mongodb(?:\+srv)?:\/\/[^\s]+/g,
      "[redacted database URI]",
    ),
  );
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === dbName &&
    /^rj_phase7c_qa_\d+_\d+$/.test(dbName)
  ) {
    await mongoose.connection.dropDatabase();
    console.log("Isolated operations QA database cleaned.");
  }
  await mongoose.disconnect();
}
