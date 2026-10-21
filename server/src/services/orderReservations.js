import { operationEvent, customerNotification } from "./operationEvents.js";
import { createHash, randomInt, randomUUID } from "node:crypto";
import ReservationAttempt from "../models/ReservationAttempt.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fail = (message, statusCode = 409) =>
  Object.assign(new Error(message), { statusCode, expose: true });
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;

export async function beginReservation(data, key = randomUUID()) {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key))
    throw fail(
      "Use an Idempotency-Key of 16-128 letters, digits, hyphens or underscores.",
      400,
    );
  data = {
    ...data,
    customer: { ...data.customer, email: data.customer.email || "" },
    installationRequired: Boolean(data.installationRequired),
    installationAddress: data.installationRequired
      ? data.installationAddress
      : "",
    deliveryAddress:
      data.fulfillmentMethod === "delivery"
        ? {
            address: data.deliveryAddress?.address || "",
            town: data.deliveryAddress?.town || "",
            landmark: data.deliveryAddress?.landmark || "",
          }
        : {},
    notes: data.notes || "",
  };
  const keyHash = hash(key);
  const requestHash = hash(JSON.stringify(canonical(data)));
  let attempt = await ReservationAttempt.findOne({ keyHash });
  if (!attempt) {
    const items = [];
    for (const item of data.items) {
      const product = await Product.findById(item.product);
      if (!product || !product.active)
        throw fail("One of the selected products is no longer available.", 400);
      items.push({
        product: String(product._id),
        quantity: item.quantity,
        name: product.name,
        price: product.price,
      });
    }
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const payload = {
      ...data,
      items,
      subtotal,
      total: subtotal,
      deliveryFee: 0,
      installationFee: 0,
      stockDeducted: true,
      deliveryAddress:
        data.fulfillmentMethod === "delivery" ? data.deliveryAddress : {},
      installationAddress: data.installationRequired
        ? data.installationAddress
        : "",
    };
    for (let n = 0; n < 10 && !attempt; n++) {
      const orderNumber = `RJ-ORD-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
      if (await Order.exists({ orderNumber })) continue;
      try {
        attempt = await ReservationAttempt.create({
          keyHash,
          requestHash,
          orderNumber,
          payload,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        attempt = await ReservationAttempt.findOne({ keyHash });
      }
    }
    if (!attempt)
      throw fail("Could not allocate an order reference. Please retry.", 503);
  }
  if (attempt.requestHash !== requestHash)
    throw fail(
      "This checkout key was already used for different order details. Retry the original order.",
    );
  return attempt;
}

export async function compensateReservation(attempt) {
  // Only the durable compensating state permits restoration. Committing is irreversible.
  const current = await ReservationAttempt.findOne({
    _id: attempt._id,
    state: "compensating",
  });
  if (!current) return;
  const token = String(current._id);
  for (const item of current.payload.items) {
    // A terminal marker is written even when deduction never happened. This fences
    // a stale reserving process that wakes after compensation has passed this item.
    await Product.collection.updateOne(
      {
        _id: new Product({ _id: item.product })._id,
        releasedReservationIds: { $ne: token },
      },
      [
        {
          $set: {
            stock: {
              $add: [
                "$stock",
                {
                  $cond: [
                    { $in: [token, { $ifNull: ["$reservedAttemptIds", []] }] },
                    item.quantity,
                    0,
                  ],
                },
              ],
            },
            releasedReservationIds: {
              $concatArrays: [
                { $ifNull: ["$releasedReservationIds", []] },
                [token],
              ],
            },
            __v: { $add: [{ $ifNull: ["$__v", 0] }, 1] },
          },
        },
      ],
    );
  }
  await ReservationAttempt.updateOne(
    { _id: current._id, state: "compensating" },
    { $set: { state: "failed" } },
  );
}

export async function resumeReservation(id, { afterReserve } = {}) {
  let attempt = await ReservationAttempt.findById(id);
  if (!attempt) throw fail("Checkout attempt was not found.", 404);
  const token = String(attempt._id);
  if (attempt.state === "reserving") {
    for (const item of attempt.payload.items) {
      let product = await Product.findOneAndUpdate(
        {
          _id: item.product,
          active: true,
          stock: { $gte: item.quantity },
          reservedAttemptIds: { $ne: token },
          releasedReservationIds: { $ne: token },
        },
        {
          $inc: { stock: -item.quantity, __v: 1 },
          $addToSet: { reservedAttemptIds: token },
        },
        { returnDocument: "after" },
      );
      if (!product)
        product = await Product.findOne({
          _id: item.product,
          reservedAttemptIds: token,
          releasedReservationIds: { $ne: token },
        });
      if (!product) {
        await ReservationAttempt.updateOne(
          { _id: id, state: "reserving" },
          {
            $set: {
              state: "compensating",
              lastError:
                "One or more selected products have insufficient stock or are unavailable.",
            },
          },
        );
        break;
      }
      if (afterReserve) await afterReserve(item);
    }
    // A failed reserving process must never move compensation back to committing.
    await ReservationAttempt.updateOne(
      { _id: id, state: "reserving" },
      { $set: { state: "committing" } },
    );
    attempt = await ReservationAttempt.findById(id);
  }
  if (attempt.state === "compensating") {
    await compensateReservation(attempt);
    attempt = await ReservationAttempt.findById(id);
  }
  if (attempt.state === "failed") throw fail(attempt.lastError, 400);
  if (attempt.state === "committing") {
    // Deterministic _id makes a crash after insert but before completion recoverable.
    const creationEvent = operationEvent(
      "created",
      `${attempt.orderNumber}: order received, pending review.`,
      {
        actorType: "customer",
        eventId: `${attempt._id}:created`,
        notification: customerNotification("order", {
          ...attempt.payload,
          orderNumber: attempt.orderNumber,
          status: "pending",
        }),
      },
    );
    try {
      await Order.updateOne(
        { _id: attempt._id },
        {
          $setOnInsert: {
            ...attempt.payload,
            orderNumber: attempt.orderNumber,
            eventOutbox: [creationEvent],
            lastActivity: {
              summary: creationEvent.summary,
              at: creationEvent.createdAt,
            },
          },
        },
        { upsert: true, runValidators: true },
      );
    } catch (error) {
      if (error.code !== 11000 || !(await Order.exists({ _id: attempt._id })))
        throw error;
    }
    await ReservationAttempt.updateOne(
      { _id: id, state: "committing" },
      { $set: { state: "completed" } },
    );
  }
  const order = await Order.findById(attempt._id);
  if (!order)
    throw fail(
      "Checkout is recovering. Retry with the same checkout key.",
      503,
    );
  return order;
}

export async function reconcileReservations({
  staleBefore = new Date(Date.now() - 60000),
  limit = 25,
} = {}) {
  const attempts = await ReservationAttempt.find({
    state: { $in: ["reserving", "committing", "compensating"] },
    updatedAt: { $lte: staleBefore },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);
  for (const attempt of attempts) {
    try {
      await resumeReservation(attempt._id);
    } catch (error) {
      if (error.statusCode !== 400) {
        console.error(
          "Reservation recovery deferred; durable attempt retained.",
        );
        // Back off this record so a permanently failing attempt cannot starve others.
        await ReservationAttempt.updateOne(
          { _id: attempt._id, state: { $nin: ["failed", "completed"] } },
          {
            $set: {
              lastError:
                "Reservation recovery temporarily unavailable; retry scheduled.",
            },
          },
        );
      }
    }
  }
  return attempts.length;
}
