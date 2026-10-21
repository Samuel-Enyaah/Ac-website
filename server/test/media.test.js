import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { uploadProductImages, uploadSingleImage } from "../src/middleware/imageUpload.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { deleteAdminProductImage, reorderAdminProductImages } from "../src/controllers/adminProductController.js";
import Product from "../src/models/Product.js";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
test("real multipart parser receives images/image and enforces size, MIME and count", async (t) => {
  t.mock.method(console, "error", () => {});
  const app = express();
  app.post("/products", uploadProductImages, (req, res) => res.json({ count: req.files.length }));
  app.post("/logo", uploadSingleImage, (req, res) => res.json({ name: req.file.fieldname }));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const send = async (path, field, count, type = "image/png", size = 8) => {
    const data = new FormData(); for (let i = 0; i < count; i++) data.append(field, new Blob([new Uint8Array(size)], { type }), "image.png");
    return fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: "POST", body: data });
  };
  for (const count of [1, 3, 6]) { const res = await send("/products", "images", count); assert.equal(res.status, 200); assert.equal((await res.json()).count, count); }
  assert.equal((await send("/logo", "image", 1)).status, 200);
  for (const args of [["/products", "image", 1], ["/products", "images", 7], ["/products", "images", 1, "text/plain"], ["/products", "images", 1, "image/png", 5 * 1024 * 1024 + 1]]) assert.equal((await send(...args)).status, 400);
});
test("deletion rejects public IDs not owned by the product", async (t) => {
  t.mock.method(Product, "findById", async () => ({ images: [{ _id: "one", publicId: "owned" }] }));
  const res = response(); await deleteAdminProductImage({ params: { productId: "507f1f77bcf86cd799439011" }, body: { publicId: "unrelated" } }, res, (err) => { throw err; });
  assert.equal(res.code, 404);
});
test("legacy URL-only removal does not need a Cloudinary public ID", async (t) => {
  const product = { images: [{ _id: "one", url: "https://example.com/legacy.png" }], async save() {} };
  t.mock.method(Product, "findById", async () => product);
  const res = response(); await deleteAdminProductImage({ params: { productId: "507f1f77bcf86cd799439011" }, body: { imageId: "one" } }, res, (err) => { throw err; });
  assert.equal(res.code, 200); assert.deepEqual(product.images, []);
});
test("primary image ordering accepts only an exact permutation", async (t) => {
  const product = { images: [{ _id: "one" }, { _id: "two" }], async save() {} };
  t.mock.method(Product, "findById", async () => product);
  for (const ids of [["two", "one"], ["one", "one"], ["foreign", "one"], ["one"]]) {
    const res = response(); await reorderAdminProductImages({ params: { productId: "507f1f77bcf86cd799439011" }, body: { imageIds: ids } }, res, (err) => { throw err; });
    assert.equal(res.code, ids[0] === "two" ? 200 : 400);
  }
  assert.equal(product.images[0]._id, "two");
});
test("provider details are not returned to clients", (t) => {
  t.mock.method(console, "error", () => {});
  const res = response(); errorHandler({ http_code: 401, message: "secret credential details" }, {}, res, () => {});
  assert.equal(res.code, 500); assert.ok(!JSON.stringify(res.body).includes("secret"));
});
