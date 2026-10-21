import BusinessSettings from "../src/models/BusinessSettings.js";
import { uploadBusinessLogo, deleteBusinessLogo } from "../src/controllers/adminMediaController.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
import MediaCleanupJob from "../src/models/MediaCleanupJob.js";
import { beginReservation, resumeReservation, compensateReservation, reconcileReservations } from "../src/services/orderReservations.js";
import { enqueueCleanup, runMediaCleanup, uploadTrackedImage } from "../src/services/mediaCleanup.js";
import { restoreOrderStock } from "../src/controllers/adminOrderController.js";
import { deleteAdminProductImage, uploadAdminProductImages } from "../src/controllers/adminProductController.js";
import { getCloudinary } from "../src/config/cloudinary.js";
import { Writable } from "node:stream";
dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
if (process.env.RUN_ISOLATED_QA !== "1") throw new Error("Explicit isolated QA opt-in required.");
const dbName = `rj_phase7a_reliability_${Date.now()}_${process.pid}`;
before(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName, serverSelectionTimeoutMS: 15000 });
  assert.equal(mongoose.connection.name, dbName);
  await Promise.all([Product.init(), Order.init(), ReservationAttempt.init(), MediaCleanupJob.init()]);
});
after(async () => {
  if (mongoose.connection.name === dbName && /^rj_phase7a_reliability_\d+_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
const product = (stock = 5) => Product.create({ name: "Recovery QA", slug: randomUUID(), category: "Accessories", description: "Isolated QA", stock, price: 10 });
const payload = (...products) => ({ customer: { fullName: "QA Customer", phone: "0201234567" }, items: products.map(p => ({ product: String(p._id), quantity: 2 })), fulfillmentMethod: "pickup", paymentMethod: "pay-on-delivery" });
const stock = async p => (await Product.findById(p._id)).stock;

test("same key replays one order; different payload conflicts", async () => {
  const p = await product(); const key = randomUUID(); const data = payload(p);
  const a = await beginReservation(data, key); const first = await resumeReservation(a._id);
  const second = await resumeReservation((await beginReservation(data, key))._id);
  assert.equal(String(first._id), String(second._id)); assert.equal(await stock(p), 3);
  await assert.rejects(beginReservation({ ...data, notes: "different" }, key), { statusCode: 409 });
  assert.match(first.orderNumber, /^RJ-ORD-\d{4}-\d{6}$/);
});
test("concurrent duplicate submissions create one durable order and deduction", async () => {
  const p = await product(); const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 8 }, async () => resumeReservation((await beginReservation(payload(p), key))._id)));
  assert.equal(new Set(results.map(o => String(o._id))).size, 1); assert.equal(await stock(p), 3);
});
test("interruption after first deduction resumes through reconciliation", async () => {
  const a = await product(), b = await product(); const attempt = await beginReservation(payload(a, b), randomUUID());
  await assert.rejects(resumeReservation(attempt._id, { afterReserve() { throw new Error("Simulated interruption"); } }));
  assert.equal(await stock(a), 3); assert.equal(await stock(b), 5);
  await reconcileReservations({ staleBefore: new Date(Date.now() + 1000) });
  assert.equal(await stock(a), 3); assert.equal(await stock(b), 3);
  assert.ok(await Order.exists({ _id: attempt._id }));
});
test("crash after order insert preserves order and never deducts twice", async () => {
  const p = await product(); const a = await beginReservation(payload(p), randomUUID());
  const o = await resumeReservation(a._id);
  await ReservationAttempt.updateOne({ _id: a._id }, { $set: { state: "committing" } });
  assert.equal(String((await resumeReservation(a._id))._id), String(o._id)); assert.equal(await stock(p), 3);
});
test("partial reservation failure compensates once, even under concurrent retries", async () => {
  const a = await product(), b = await product(0); const attempt = await beginReservation(payload(a, b), randomUUID());
  await assert.rejects(resumeReservation(attempt._id), { statusCode: 400 });
  await Promise.all([compensateReservation(attempt), compensateReservation(attempt)]);
  assert.equal(await stock(a), 5); assert.equal(await stock(b), 0);
  assert.equal(await Order.countDocuments({ _id: attempt._id }), 0);
});
test("compensation terminal markers fence a delayed deduction", async () => {
  const p = await product(); const a = await beginReservation(payload(p), randomUUID());
  await ReservationAttempt.updateOne({ _id: a._id }, { $set: { state: "compensating" } });
  await compensateReservation(a);
  const result = await Product.updateOne({ _id: p._id, reservedAttemptIds: { $ne: String(a._id) }, releasedReservationIds: { $ne: String(a._id) }, stock: { $gte: 2 } }, { $inc: { stock: -2 }, $addToSet: { reservedAttemptIds: String(a._id) } });
  assert.equal(result.modifiedCount, 0); assert.equal(await stock(p), 5);
});
test("concurrent different orders cannot make stock negative", async () => {
  const p = await product(3); const attempts = await Promise.all([beginReservation(payload(p), randomUUID()), beginReservation(payload(p), randomUUID())]);
  const results = await Promise.allSettled(attempts.map(a => resumeReservation(a._id)));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(await stock(p), 1);
});
test("partial cancellation failure and concurrent retries restore once", async t => {
  const a = await product(), b = await product(); const o = await resumeReservation((await beginReservation(payload(a, b), randomUUID()))._id);
  await Order.updateOne({ _id: o._id }, { $set: { status: "cancelled" } }); o.status = "cancelled";
  const original = Product.updateOne.bind(Product); let calls = 0;
  const mock = t.mock.method(Product, "updateOne", (...args) => { if (++calls === 2) throw new Error("Interrupted restoration"); return original(...args); });
  await assert.rejects(restoreOrderStock(o)); mock.mock.restore();
  assert.equal((await Order.findById(o._id)).stockDeducted, true);
  await Promise.all([restoreOrderStock(await Order.findById(o._id)), restoreOrderStock(await Order.findById(o._id))]);
  await restoreOrderStock(await Order.findById(o._id));
  assert.equal(await stock(a), 5); assert.equal(await stock(b), 5);
});
test("cleanup job creation, success and completed job idempotency", async () => {
  const p = await product(); const id = `qa/${randomUUID()}`;
  await enqueueCleanup(id, "product", p._id, "test"); await enqueueCleanup(id, "product", p._id, "test");
  assert.equal(await MediaCleanupJob.countDocuments({ publicId: id }), 1);
  let calls = 0; const destroy = async () => { calls++; return { result: "ok" }; };
  await runMediaCleanup({ destroy }); await runMediaCleanup({ destroy });
  assert.equal(calls, 1); assert.equal((await MediaCleanupJob.findOne({ publicId: id })).status, "completed");
});
test("failed cleanup sanitizes errors, backs off and remains retryable", async () => {
  const p = await product(); const id = `qa/${randomUUID()}`;
  await enqueueCleanup(id, "product", p._id, "test");
  const started = Date.now();
  await runMediaCleanup({ destroy: async () => { throw Object.assign(new Error("secret signature sensitive"), { http_code: 403 }); } });
  let job = await MediaCleanupJob.findOne({ publicId: id });
  assert.equal(job.status, "pending"); assert.equal(job.attempts, 1); assert.ok(job.nextRetryAt.getTime() >= started + 29000);
  assert.ok(!/secret|signature|sensitive/.test(job.lastError));
  await runMediaCleanup({ now: new Date(Date.now() + 60000), destroy: async () => ({ result: "not found" }) });
  job = await MediaCleanupJob.findById(job._id); assert.equal(job.status, "completed");
});
test("attached image is protected, and stale document saves are fenced", async () => {
  const p = await product(); const id = `qa/${randomUUID()}`;
  p.images = [{ url: "https://example.invalid/qa.png", publicId: id }]; await p.save();
  await enqueueCleanup(id, "product", p._id, "test");
  await runMediaCleanup({ destroy: async () => assert.fail("Attached image must not be deleted") });
  p.name = "Stale edit"; await assert.rejects(p.save(), { name: "VersionError" });
});
test("upload intent survives successful upload followed by DB save failure", async t => {
  const p = await product(); const cloud = getCloudinary();
  t.mock.method(cloud.uploader, "upload_stream", (options, cb) => new Writable({ write(c,e,done) { done(); }, final(done) { cb(null, { public_id: options.public_id, secure_url: "https://example.invalid/upload.png" }); done(); } }));
  const mock = t.mock.method(Product.prototype, "save", async () => { throw new Error("Simulated database save failure"); });
  let failure;
  await uploadAdminProductImages({ params: { productId: String(p._id) }, files: [{ buffer: Buffer.from("qa") }] }, {}, error => { failure = error; });
  mock.mock.restore(); assert.match(failure.message, /database save failure/);
  const intent = await MediaCleanupJob.findOne({ contextId: p._id }); assert.ok(intent);
  const uploaded = { public_id: intent.publicId };
  let cleaned = false;
  await runMediaCleanup({ now: new Date(Date.now() + 16 * 60000), destroy: async id => { if (id === uploaded.public_id) cleaned = true; return { result: "ok" }; } });
  assert.ok(cleaned);
});
test("arbitrary client public ID cannot enqueue deletion", async () => {
  const p = await product(); const before = await MediaCleanupJob.countDocuments();
  const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await deleteAdminProductImage({ params: { productId: String(p._id) }, body: { publicId: "foreign/asset" } }, res, error => { throw error; });
  assert.equal(res.code, 404); assert.equal(await MediaCleanupJob.countDocuments(), before);
});

test("partial compensation interruption is safely retried", async t => {
  const a = await product(), b = await product(); const attempt = await beginReservation(payload(a, b), randomUUID());
  await assert.rejects(resumeReservation(attempt._id, { afterReserve() { throw new Error("Interrupted"); } }));
  await ReservationAttempt.updateOne({ _id: attempt._id }, { $set: { state: "compensating" } });
  const original = Product.collection.updateOne.bind(Product.collection); let calls = 0;
  const mock = t.mock.method(Product.collection, "updateOne", (...args) => { if (++calls === 2) throw new Error("DB interruption"); return original(...args); });
  await assert.rejects(compensateReservation(attempt)); mock.mock.restore();
  await Promise.all([compensateReservation(attempt), compensateReservation(attempt)]);
  assert.equal(await stock(a), 5); assert.equal(await stock(b), 5);
});
test("expired cleanup lease can be reclaimed after worker interruption", async () => {
  const p = await product(); const job = await enqueueCleanup(`qa/${randomUUID()}`, "product", p._id, "lease-test");
  await MediaCleanupJob.updateOne({ _id: job._id }, { $set: { status: "processing", leaseUntil: new Date(0), leaseToken: "dead-worker" } });
  await runMediaCleanup({ destroy: async () => ({ result: "ok" }) });
  assert.equal((await MediaCleanupJob.findById(job._id)).status, "completed");
});
test("authorization upload errors are useful and sanitized", async t => {
  const p = await product(); const cloud = getCloudinary();
  t.mock.method(cloud.uploader, "upload_stream", (options, cb) => new Writable({ write(c,e,done) { done(); }, final(done) { cb({ http_code: 403, message: "secret signature" }); done(); } }));
  await assert.rejects(uploadTrackedImage(Buffer.from("qa"), { folder: "qa" }, "product", p._id), error => error.statusCode === 502 && /permissions/.test(error.message) && !/secret|signature/.test(error.message));
});

test("HTTP POST retries and concurrent same-key requests return the same receipt", async () => {
  const { default: app } = await import("../src/app.js");
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  try {
    const p = await product(); const key = randomUUID(); const data = payload(p);
    const send = body => fetch(`http://127.0.0.1:${server.address().port}/api/v1/orders`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
    const responses = await Promise.all(Array.from({ length: 5 }, () => send(data)));
    assert.ok(responses.every(r => r.status === 201));
    const receipts = await Promise.all(responses.map(r => r.json()));
    assert.equal(new Set(receipts.map(r => r.order.id)).size, 1); assert.equal(await stock(p), 3);
    assert.equal((await send({ ...data, notes: "different" })).status, 409);
    assert.equal((await send(data)).status, 201);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("product removal remains successful when queued provider cleanup fails", async () => {
  const p = await product(); const publicId = `qa/${randomUUID()}`; p.images = [{ publicId, url: "https://example.invalid/qa.png" }]; await p.save();
  const res = { status() { return this; }, json(data) { this.data = data; } };
  await deleteAdminProductImage({ params: { productId: String(p._id) }, body: { imageId: String(p.images[0]._id) } }, res, error => { throw error; });
  assert.equal(res.data.success, true); assert.equal((await Product.findById(p._id)).images.length, 0);
  await runMediaCleanup({ destroy: async () => { throw new Error("Unavailable provider"); } });
  assert.equal((await MediaCleanupJob.findOne({ publicId })).status, "pending");
  await runMediaCleanup({ now: new Date(Date.now() + 60000), destroy: async () => ({ result: "ok" }) });
  assert.equal((await MediaCleanupJob.findOne({ publicId })).status, "completed");
});
test("logo replacement and removal retain failed cleanup jobs for retry", async t => {
  const oldId = `qa/${randomUUID()}`;
  const settings = await BusinessSettings.create({ key: "main", logoPublicId: oldId, logoUrl: "https://example.invalid/old.png" });
  const cloud = getCloudinary();
  t.mock.method(cloud.uploader, "upload_stream", (options, cb) => new Writable({ write(c,e,done) { done(); }, final(done) { cb(null, { public_id: options.public_id, secure_url: "https://example.invalid/new.png" }); done(); } }));
  const res = { json(data) { this.data = data; } };
  const admin = { _id: new mongoose.Types.ObjectId() };
  await uploadBusinessLogo({ file: { buffer: Buffer.from("qa") }, admin }, res, error => { throw error; });
  const newId = res.data.logoPublicId; assert.notEqual(newId, oldId);
  await runMediaCleanup({ destroy: async () => { throw new Error("Provider unavailable"); } });
  assert.equal((await MediaCleanupJob.findOne({ publicId: oldId })).status, "pending");
  assert.equal((await BusinessSettings.findById(settings._id)).logoPublicId, newId);
  await deleteBusinessLogo({ admin }, res, error => { throw error; });
  await runMediaCleanup({ destroy: async () => { throw new Error("Provider unavailable"); } });
  assert.equal((await MediaCleanupJob.findOne({ publicId: newId })).status, "pending");
  await runMediaCleanup({ now: new Date(Date.now() + 60000), destroy: async () => ({ result: "ok" }) });
  for (const publicId of [oldId, newId]) assert.equal((await MediaCleanupJob.findOne({ publicId })).status, "completed");
  assert.equal((await BusinessSettings.findById(settings._id)).logoUrl, "");
});
