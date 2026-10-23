import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedTransitions,
  assertTransition,
} from "../src/services/operationWorkflows.js";
import { operationEvent } from "../src/services/operationEvents.js";
import {
  notificationTemplates,
  renderNotification,
} from "../src/services/notificationTemplates.js";
import {
  configuredTransport,
  sanitizedNotificationError,
  createTestTransport,
} from "../src/services/notificationTransports.js";

test("order workflows enforce terminal states and pickup/delivery branches", () => {
  for (const status of ["delivered", "cancelled"])
    assert.deepEqual(allowedTransitions("order", { status }), []);
  assert.throws(
    () => assertTransition("order", { status: "delivered" }, "processing"),
    { statusCode: 400 },
  );
  assert.deepEqual(
    allowedTransitions("order", {
      status: "ready",
      fulfillmentMethod: "pickup",
    }),
    ["delivered", "cancelled"],
  );
  assert.deepEqual(
    allowedTransitions("order", {
      status: "ready",
      fulfillmentMethod: "delivery",
    }),
    ["out-for-delivery", "cancelled"],
  );
  assert.doesNotThrow(() =>
    assertTransition("order", { status: "pending" }, "confirmed"),
  );
});
test("booking workflow requires assignment and forbids skipping or reopening completion", () => {
  assert.deepEqual(allowedTransitions("booking", { status: "confirmed" }), [
    "cancelled",
  ]);
  assert.doesNotThrow(() =>
    assertTransition(
      "booking",
      { status: "confirmed", assignedStaff: "assigned" },
      "technician-assigned",
    ),
  );
  assert.throws(() =>
    assertTransition("booking", { status: "pending" }, "completed"),
  );
  assert.throws(() =>
    assertTransition("booking", { status: "completed" }, "confirmed"),
  );
});
test("audit construction allowlists metadata and authenticated actor", () => {
  const event = operationEvent("status-changed", "Status changed.", {
    admin: { _id: "admin-id", name: "Admin" },
    metadata: {
      fromStatus: "pending",
      toStatus: "confirmed",
      password: "not-recorded",
      jwt: "not-recorded",
      api_secret: "not-recorded",
      customer: { email: "not-recorded" },
    },
  });
  assert.equal(event.actorId, "admin-id");
  assert.equal(event.actorType, "admin");
  assert.deepEqual(event.metadata, {
    fromStatus: "pending",
    toStatus: "confirmed",
  });
  assert.ok(!JSON.stringify(event).includes("not-recorded"));
});
test("all notification templates use reference and settings without promising pending confirmation", () => {
  for (const template of notificationTemplates) {
    const result = renderNotification(template, "RJ-REF-123", {
      businessName: "QA Business",
      primaryPhone: "0201234567",
      email: "team@example.invalid",
      whatsapp: "233201234567",
      address: "QA address",
    });
    for (const value of [
      "RJ-REF-123",
      "QA Business",
      "0201234567",
      "team@example.invalid",
      "233201234567",
      "QA address",
    ])
      assert.ok(result.text.includes(value));
  }
  assert.match(
    renderNotification("booking.pending", "RJ-SVC", {}).text,
    /not a confirmed appointment/,
  );
  assert.match(
    renderNotification("order.pending", "RJ-ORD", {}).text,
    /has not been confirmed/,
  );
});
test("provider errors never expose credentials, response bodies or recipient data", () => {
  const secret = "secret-token-signature-customer@example.invalid";
  for (const error of [
    new Error(secret),
    { permanent: true, message: secret },
    { notificationCode: "unconfigured", message: secret },
  ])
    assert.ok(!sanitizedNotificationError(error).includes(secret));
});
test("unconfigured adapter fails honestly and explicit test adapter deduplicates simulations", async () => {
  await assert.rejects(configuredTransport({}).send({}), {
    notificationCode: "unconfigured",
  });
  const adapter = createTestTransport();
  assert.equal(
    (await adapter.send({ idempotencyKey: "event-1" })).simulated,
    true,
  );
  await adapter.send({ idempotencyKey: "event-1" });
  assert.equal(adapter.receipts.size, 1);
});
