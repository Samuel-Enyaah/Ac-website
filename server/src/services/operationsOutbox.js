import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";
import Staff from "../models/Staff.js";
import BusinessSettings from "../models/BusinessSettings.js";
import ActivityLog from "../models/ActivityLog.js";
import NotificationJob from "../models/NotificationJob.js";
import { renderNotification } from "./notificationTemplates.js";

const models = {
  order: Order,
  booking: ServiceBooking,
  staff: Staff,
  settings: BusinessSettings,
};
async function insertOnce(Model, query, data) {
  try {
    await Model.updateOne(
      query,
      { $setOnInsert: data },
      { upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000 || !(await Model.exists(query))) throw error;
  }
}

export async function projectOperations(type, id) {
  const Model = models[type];
  const record = await Model.findById(id).select("+eventOutbox").lean();
  if (!record) return;
  for (const event of record.eventOutbox || []) {
    const { notification, ...audit } = event;
    await insertOnce(
      ActivityLog,
      { eventId: event.eventId },
      { ...audit, entityType: type, entityId: id },
    );
    if (notification?.template && notification.recipient) {
      const settings =
        (await BusinessSettings.findOne({ key: "main" }).lean()) ||
        new BusinessSettings().toObject();
      const eventKey = `${event.eventId}:email`;
      await insertOnce(
        NotificationJob,
        { eventKey },
        {
          eventKey,
          channel: "email",
          template: notification.template,
          recipient: notification.recipient,
          entityType: type,
          entityId: id,
          payload: renderNotification(
            notification.template,
            notification.reference,
            settings,
          ),
        },
      );
    }
    // Remove only after BOTH projections persist. Concurrent projectors use the
    // same unique keys; a crash at any point safely replays the original event.
    await Model.updateOne(
      { _id: id },
      { $pull: { eventOutbox: { eventId: event.eventId } } },
      { timestamps: false },
    );
  }
}

export async function flushOperations(type, id) {
  try {
    await projectOperations(type, id);
  } catch {
    console.error(
      "Operational event projection deferred; durable event retained.",
    );
  }
}

export async function recoverOperations({ limit = 25 } = {}) {
  for (const [type, Model] of Object.entries(models)) {
    const records = await Model.find({ "eventOutbox.0": { $exists: true } })
      .select("_id")
      .sort({ updatedAt: 1 })
      .limit(limit)
      .lean();
    for (const record of records) await flushOperations(type, record._id);
  }
}

export async function operationHistory(type, id) {
  await flushOperations(type, id);
  const [activity, notifications] = await Promise.all([
    ActivityLog.find({ entityType: type, entityId: id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean(),
    NotificationJob.find({ entityType: type, entityId: id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .select("-payload")
      .lean(),
  ]);
  return { activity, notifications };
}
