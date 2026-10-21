import { createHash, randomInt } from "node:crypto";
import mongoose from "mongoose";
import ServiceBooking from "../models/ServiceBooking.js";
import {
  customerNotification,
  operationEvent,
  operationalError,
} from "./operationEvents.js";
const hash = (value) => createHash("sha256").update(value).digest("hex");
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

export async function createIdempotentBooking(input, key) {
  if (key !== undefined && !/^[A-Za-z0-9_-]{16,128}$/.test(key))
    throw operationalError(
      "Use an Idempotency-Key of 16-128 letters, digits, hyphens or underscores.",
      400,
    );
  const data = {
    ...input,
    customer: {
      ...input.customer,
      email: (input.customer.email || "").toLowerCase(),
    },
    acType: input.acType || "",
    brand: input.brand || "",
    units: input.units ?? 1,
    landmark: input.landmark || "",
    notes: input.notes || "",
  };
  const keyHash = key === undefined ? undefined : hash(key);
  const requestHash = hash(JSON.stringify(canonical(data)));
  const replay = (booking) => {
    if (booking.requestHash !== requestHash)
      throw operationalError(
        "This service request key was already used for different details. Retry the original request.",
      );
    return booking.receipt;
  };
  // Replay BEFORE date validation: a successful request remains replayable even
  // after its preferred date has passed or its operational status has changed.
  if (keyHash) {
    const existing = await ServiceBooking.findOne({ keyHash }).select(
      "+requestHash +receipt",
    );
    if (existing) return replay(existing);
  }
  const preferredDate = new Date(`${data.preferredDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate) ||
    Number.isNaN(preferredDate.getTime()) ||
    preferredDate.toISOString().slice(0, 10) !== data.preferredDate
  )
    throw operationalError("Please provide a valid preferred date.", 400);
  if (data.preferredDate < new Date().toISOString().slice(0, 10))
    throw operationalError(
      "Preferred service date cannot be in the past.",
      400,
    );
  for (let attempt = 0; attempt < 10; attempt++) {
    const _id = new mongoose.Types.ObjectId();
    const bookingNumber = `RJ-SVC-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
    const createdAt = new Date();
    const receipt = {
      id: String(_id),
      bookingNumber,
      status: "pending",
      serviceType: data.serviceType,
      preferredDate: preferredDate.toISOString(),
      preferredTime: data.preferredTime,
      createdAt: createdAt.toISOString(),
    };
    const event = operationEvent(
      "created",
      `${bookingNumber}: service request received, pending review.`,
      {
        actorType: "customer",
        eventId: `${_id}:created`,
        notification: customerNotification("booking", {
          ...data,
          bookingNumber,
          status: "pending",
        }),
      },
    );
    try {
      await ServiceBooking.create({
        ...data,
        _id,
        bookingNumber,
        preferredDate,
        status: "pending",
        createdAt,
        ...(keyHash ? { keyHash, requestHash } : {}),
        receipt,
        eventOutbox: [event],
        lastActivity: { summary: event.summary, at: createdAt },
      });
      return receipt;
    } catch (error) {
      if (error.code !== 11000) throw error;
      if (keyHash) {
        const existing = await ServiceBooking.findOne({ keyHash }).select(
          "+requestHash +receipt",
        );
        if (existing) return replay(existing);
      }
    }
  }
  throw operationalError(
    "Could not allocate a service reference. Retry with the same request key.",
    503,
  );
}
