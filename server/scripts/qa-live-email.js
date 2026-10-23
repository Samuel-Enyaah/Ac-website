// Explicitly gated, one QA email per configured developer address; never reads customers.
import dotenv from "dotenv";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import NotificationJob from "../src/models/NotificationJob.js";
import NotificationAttempt from "../src/models/NotificationAttempt.js";
import ActivityLog from "../src/models/ActivityLog.js";
import {
  emailConfiguration,
  validEmail,
} from "../src/services/emailConfiguration.js";
import { createResendTransport } from "../src/services/resendTransport.js";
import { runNotifications } from "../src/services/notifications.js";
import { renderNotification } from "../src/services/notificationTemplates.js";

dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
const config = emailConfiguration();
const recipients = [
  ...new Set(
    (process.env.EMAIL_QA_RECIPIENTS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ),
];
const blocked = [];
if (!config.ready)
  blocked.push(
    "Provider credentials and sender configuration are unavailable or incomplete.",
  );
if (process.env.EMAIL_QA_SENDER_VERIFIED !== "true")
  blocked.push("Sender verification has not been confirmed locally.");
if (
  !recipients.length ||
  recipients.length > 3 ||
  !recipients.every(validEmail)
)
  blocked.push("Configure one to three explicit developer/test recipients.");
if (process.env.RUN_LIVE_EMAIL_QA !== "1")
  blocked.push(
    "Live email QA has not been explicitly enabled for this process.",
  );
if (blocked.length) {
  console.log(
    JSON.stringify({ status: "BLOCKED", reasons: blocked, messagesSent: 0 }),
  );
  process.exitCode = 2;
} else {
  const dbName = `rj_phase7d_live_email_${Date.now()}_${process.pid}`;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName,
      serverSelectionTimeoutMS: 15000,
    });
    await Promise.all(
      [NotificationJob, NotificationAttempt, ActivityLog].map((model) =>
        model.init(),
      ),
    );
    let httpStatus = null;
    const transport = createResendTransport({
      fetchImpl: async (...args) => {
        const response = await fetch(...args);
        httpStatus = response.status;
        return response;
      },
    });
    for (const recipient of recipients) {
      const job = await NotificationJob.create({
        eventKey: randomUUID(),
        channel: "email",
        template: "order.pending",
        entityType: "order",
        entityId: new mongoose.Types.ObjectId(),
        recipient,
        reference: "RJ-ORD-QA-PREVIEW",
        maxAttempts: 1,
        payload: renderNotification("order.pending", "RJ-ORD-QA-PREVIEW", {
          businessName: "R&J AC ACCESSARIES COM. LTD — Developer test",
        }),
      });
      httpStatus = null;
      await runNotifications({ limit: 1, transport });
      const stored = await NotificationJob.findById(job._id);
      console.log(
        JSON.stringify({
          httpStatus,
          accepted: stored.status === "accepted",
          providerMessageIdPersisted: Boolean(stored.providerMessageId),
          htmlAndTextPresent: Boolean(
            stored.payload.html && stored.payload.text,
          ),
          failureCode: stored.failureCode || null,
          delivery: "UNVERIFIED",
          webhook:
            "Requires a separately authorized reachable endpoint; no deployment or tunnel is started.",
        }),
      );
      if (stored.status !== "accepted") {
        process.exitCode = 1;
        break;
      }
    }
  } catch {
    console.error(
      "Live email QA interrupted. Provider acceptance is unconfirmed; inspect provider records before repeating.",
    );
    process.exitCode = 1;
  } finally {
    if (
      mongoose.connection.readyState === 1 &&
      mongoose.connection.name === dbName &&
      /^rj_phase7d_live_email_\d+_\d+$/.test(dbName)
    )
      await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
