import { randomUUID } from "node:crypto";
import MediaCleanupJob from "../models/MediaCleanupJob.js";
import Product from "../models/Product.js";
import BusinessSettings from "../models/BusinessSettings.js";
import { uploadImageBuffer, deleteCloudinaryImage } from "../utils/cloudinaryMedia.js";

// Internal only: callers pass identifiers from a loaded DB record or a server-generated upload intent.
export async function enqueueCleanup(publicId, contextType, contextId, reason, nextRetryAt = new Date()) {
  if (!publicId) return null;
  return MediaCleanupJob.findOneAndUpdate({ publicId }, { $setOnInsert: { publicId, contextType, contextId, reason, nextRetryAt } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
}

export async function uploadTrackedImage(buffer, options, contextType, contextId) {
  const publicId = `${options.folder}/${randomUUID()}`;
  // Write intent BEFORE the external operation, so even an upload followed by a
  // DB outage/process interruption leaves a known, server-owned cleanup target.
  await enqueueCleanup(publicId, contextType, contextId, "upload-not-attached", new Date(Date.now() + 15 * 60000));
  return uploadImageBuffer(buffer, { public_id: publicId, overwrite: false, timeout: 60000 });
}

export async function runMediaCleanup({ limit = 20, now = new Date(), destroy = deleteCloudinaryImage } = {}) {
  let count = 0;
  while (count < limit) {
    const leaseToken = randomUUID();
    const job = await MediaCleanupJob.findOneAndUpdate({
      $or: [{ status: "pending", nextRetryAt: { $lte: now } }, { status: "processing", leaseUntil: { $lte: now } }],
    }, { $set: { status: "processing", leaseToken, leaseUntil: new Date(Date.now() + 120000) } }, { sort: { nextRetryAt: 1 }, returnDocument: "after" });
    if (!job) break;
    count++;
    const ownership = { _id: job._id, status: "processing", leaseToken };
    try {
      // Fence any stale optimistic save before checking attachment. If a save won
      // first, its reference protects the asset. If this wins, that save conflicts.
      const Model = job.contextType === "product" ? Product : BusinessSettings;
      await Model.updateOne({ _id: job.contextId }, { $inc: { __v: 1 } });
      const referenced = await Product.exists({ "images.publicId": job.publicId }) || await BusinessSettings.exists({ logoPublicId: job.publicId });
      if (referenced) {
        // Keep the intent available for future removal; do not delete attached media.
        await MediaCleanupJob.updateOne(ownership, { $set: { status: "pending", nextRetryAt: new Date(Date.now() + 86400000), leaseUntil: null } });
        continue;
      }
      await MediaCleanupJob.updateOne(ownership, { $inc: { attempts: 1 } });
      const result = await destroy(job.publicId);
      if (!result || !["ok", "not found"].includes(result.result)) throw new Error("Unconfirmed cleanup");
      await MediaCleanupJob.updateOne(ownership, { $set: { status: "completed", completedAt: new Date(), lastError: "", leaseUntil: null } });
    } catch (error) {
      const status = Number(error.http_code || error.statusCode);
      const lastError = [401, 403].includes(status) ? "Media provider rejected cleanup; check account permissions." : "Media cleanup failed; retry scheduled.";
      const delay = Math.min(86400000, 30000 * 2 ** Math.min(job.attempts, 12));
      await MediaCleanupJob.updateOne(ownership, { $set: { status: "pending", lastError, nextRetryAt: new Date(Date.now() + delay), leaseUntil: null } });
    }
  }
  return count;
}

export async function scheduleStoredCleanup(publicId, contextType, contextId, reason) {
  const job = await enqueueCleanup(publicId, contextType, contextId, reason, new Date(Date.now() + 15 * 60000));
  if (job && job.status !== "completed") await MediaCleanupJob.updateOne({ _id: job._id }, { $set: { nextRetryAt: new Date(Date.now() + 15 * 60000), reason } });
  return job;
}

export async function activateCleanup(publicId) {
  if (!publicId) return;
  try { await MediaCleanupJob.updateOne({ publicId, status: "pending" }, { $set: { nextRetryAt: new Date() } }); }
  catch { console.error("Cleanup scheduling deferred; durable intent retained."); }
}
