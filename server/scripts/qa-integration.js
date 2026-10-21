import { runMediaCleanup } from "../src/services/mediaCleanup.js";
import MediaCleanupJob from "../src/models/MediaCleanupJob.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
// Explicit opt-in integration QA. Always uses a new isolated database, never the URI's database.
import dotenv from "dotenv";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import Product from "../src/models/Product.js";
import BusinessSettings from "../src/models/BusinessSettings.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
import { getCloudinary } from "../src/config/cloudinary.js";
import { deleteCloudinaryImage } from "../src/utils/cloudinaryMedia.js";
dotenv.config({ quiet: true });
if (process.env.RUN_ISOLATED_QA !== "1") throw new Error("Set RUN_ISOLATED_QA=1 to run isolated integration QA.");
const dbName = `rj_phase7a_qa_${Date.now()}`;
const assets = new Set();
let server;
let passed = 0;
const check = (name) => { passed++; console.log(`PASS ${name}`); };
try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName, serverSelectionTimeoutMS: 15000 });
  assert.equal(mongoose.connection.name, dbName);
  await Promise.all([ReservationAttempt.init(), MediaCleanupJob.init()]);
  console.log("Connected to isolated QA database.");
  const admin = await Admin.create({ name: "Phase 7A QA", email: "phase7a@example.invalid", passwordHash: "isolated-test-hash", active: true });
  const cookie = `${ADMIN_COOKIE}=${jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "10m" })}`;
  server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const request = async (path, method = "GET", body, expected = 200) => {
    const multipart = body instanceof FormData;
    const response = await fetch(base + path, { method, headers: { Cookie: cookie, ...(body && !multipart ? { "Content-Type": "application/json" } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined });
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${data.message || "unexpected status"}`);
    return data;
  };
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=", "base64");
  const form = (field, count = 1) => { const data = new FormData(); for (let i = 0; i < count; i++) data.append(field, new Blob([image], { type: "image/png" }), `qa-${i}.png`); return data; };
  const remember = (images) => images.forEach((item) => { if (item.publicId) assets.add(item.publicId); });
  const absent = async (id) => { await runMediaCleanup(); try { await getCloudinary().api.resource(id); assert.fail("Cloudinary asset still exists"); } catch (error) { assert.equal(error.error?.http_code || error.http_code, 404); } };
  const created = await request("/admin/products", "POST", { name: "Phase 7A isolated QA", category: "Accessories", description: "Temporary QA product", price: 10, stock: 10, featured: true }, 201);
  const id = created.product._id; check("create without image");
  await request(`/admin/products/${id}/inventory`, "PATCH", { operation: "increase", quantity: 2 }); assert.equal((await Product.findById(id)).stock, 12); check("inventory adjustment");
  await request(`/admin/products/${id}/inventory`, "PATCH", { operation: "set", quantity: 15 }); assert.equal((await Product.findById(id)).stock, 15); check("inventory SET");
  await request(`/admin/products/${id}/inventory`, "PATCH", { operation: "decrease", quantity: 3 }); assert.equal((await Product.findById(id)).stock, 12); check("inventory DECREASE");
  const order = await request("/orders", "POST", { customer: { fullName: "QA Customer", phone: "0201234567" }, items: [{ product: id, quantity: 2 }], fulfillmentMethod: "pickup", paymentMethod: "pay-on-delivery" }, 201);
  assert.equal((await Product.findById(id)).stock, 10); check("order reserves stock");
  await Promise.all([request(`/admin/orders/${order.order.id}`, "PATCH", { status: "cancelled" }), request(`/admin/orders/${order.order.id}`, "PATCH", { status: "cancelled" })]);
  assert.equal((await Product.findById(id)).stock, 12); check("concurrent cancellation restores exactly once");
  const booking = await request("/service-bookings", "POST", { customer: { name: "QA Customer", phone: "0201234567" }, serviceType: "maintenance", description: "Temporary QA service request", preferredDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), preferredTime: "morning", location: "QA location", units: 1 }, 201);
  assert.ok(JSON.stringify(booking).includes("RJ-SVC-")); check("service booking reference");
  const customers = await request("/admin/customers"); assert.equal(customers.customers.length, 1); check("customer CRM aggregation");
  await request("/admin/dashboard"); check("admin dashboard");
  if (process.env.QA_SKIP_LIVE_MEDIA === "1") { console.log(`${passed} non-media integration checks passed.`); }
  else {
  let result = await request(`/admin/products/${id}/images`, "POST", form("images")); remember(result.images); assert.equal(result.images.length, 1); check("single Cloudinary upload");
  result = await request(`/admin/products/${id}/images`, "POST", form("images", 2)); remember(result.images); assert.equal(result.images.length, 3); check("multiple Cloudinary uploads");
  const ordered = result.images.map((item) => item._id).reverse();
  result = await request(`/admin/products/${id}/images/order`, "PATCH", { imageIds: ordered });
  assert.equal(result.images[0]._id, ordered[0]);
  const persisted = await Product.findById(id); assert.equal(String(persisted.images[0]._id), ordered[0]); check("primary image order persists in MongoDB");
  const publicProducts = await request("/products?featured=true"); assert.ok(publicProducts.products.some((p) => p._id === id));
  const detail = await request(`/products/${persisted.slug}`); assert.equal(detail.product.images[0].url, persisted.images[0].url);
  const delivered = await fetch(persisted.images[0].url); assert.equal(delivered.status, 200); assert.match(delivered.headers.get("content-type"), /^image\//); check("public catalogue/detail expose persisted, deliverable image");
  await request(`/admin/products/${id}`, "PATCH", { description: "Updated QA description", stock: 999 }); assert.equal((await Product.findById(id)).stock, 12); check("product edit cannot modify stock");
  const removed = result.images[0]; await request(`/admin/products/${id}/images`, "DELETE", { imageId: removed._id }); await absent(removed.publicId); check("saved image deletion and Cloudinary cleanup");
  let logo = await request("/admin/settings/logo", "POST", form("image")); assets.add(logo.logoPublicId);
  assert.equal((await BusinessSettings.findOne({ key: "main" })).logoUrl, logo.logoUrl);
  const pubSettings = await request("/settings"); assert.ok(!JSON.stringify(pubSettings).includes("logoPublicId")); check("logo persistence and public projection");
  const oldId = logo.logoPublicId;
  logo = await request("/admin/settings/logo", "POST", form("image")); assets.add(logo.logoPublicId); await absent(oldId); check("logo replacement cleanup");
  await request("/admin/settings/logo", "DELETE"); await absent(logo.logoPublicId); assert.equal((await BusinessSettings.findOne({ key: "main" })).logoUrl, ""); check("logo removal");
  console.log(`${passed} integration checks passed.`);
  }
} catch (error) {
  console.error("Integration QA failed:", error.name, error.code || "", String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, "[redacted database URI]"));
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && /^rj_phase7a_qa_\d+$/.test(dbName)) {
    for (const job of await MediaCleanupJob.find()) assets.add(job.publicId);
    for (const product of await Product.find()) product.images.forEach((item) => assets.add(item.publicId));
    const settings = await BusinessSettings.findOne({ key: "main" }); if (settings?.logoPublicId) assets.add(settings.logoPublicId);
    for (const id of assets) if (id) { try { await deleteCloudinaryImage(id); } catch { console.error("QA asset cleanup failed; inspect isolated QA assets."); process.exitCode = 1; } }
    await mongoose.connection.dropDatabase();
    console.log("Isolated QA database cleaned.");
  }
  await mongoose.disconnect();
}
