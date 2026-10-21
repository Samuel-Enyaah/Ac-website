import test from "node:test";
import assert from "node:assert/strict";
import { createProductSchema, updateProductSchema } from "../src/validation/product.js";
import { createOrderSchema, normalizeItems, rollbackReservedStock } from "../src/controllers/orderController.js";
import Product from "../src/models/Product.js";
const valid = { name: "Cooling unit", category: "Air Conditioners", description: "Full description", price: 100, stock: 0 };
test("product requires name, category, description and nonnegative price", () => {
  assert.equal(createProductSchema.safeParse(valid).success, true);
  for (const change of [{ name: "" }, { category: "Unknown" }, { description: " " }, { price: "" }, { price: -1 }, { price: Infinity }, { stock: 1.2 }, { stock: -1 }, { oldPrice: 99 }, { oldPrice: "abc" }]) {
    assert.equal(createProductSchema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change));
  }
  for (const oldPrice of [undefined, null, "", 101]) assert.equal(createProductSchema.safeParse({ ...valid, oldPrice }).success, true);
});
test("updates cannot modify stock and cannot blank required fields", () => {
  assert.deepEqual(updateProductSchema.parse({ stock: 100, oldPrice: null }), { oldPrice: null });
  assert.equal(updateProductSchema.safeParse({ description: "" }).success, false);
});
test("Mongoose continues to require full description and integer stock", async () => {
  const product = new Product({ ...valid, slug: "cooling-unit", description: "", stock: 1.5 });
  await assert.rejects(product.validate(), (error) => Boolean(error.errors.description && error.errors.stock));
});
const order = { customer: { fullName: "Test Customer", phone: "0201234567" }, items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }], fulfillmentMethod: "pickup", paymentMethod: "pay-on-delivery" };
test("order validation rejects empty cart, invalid contact and fractional or negative quantities", () => {
  assert.equal(createOrderSchema.safeParse(order).success, true);
  for (const quantity of [0, -1, 1.5]) assert.equal(createOrderSchema.safeParse({ ...order, items: [{ ...order.items[0], quantity }] }).success, false);
  assert.equal(createOrderSchema.safeParse({ ...order, items: [] }).success, false);
  assert.equal(createOrderSchema.safeParse({ ...order, customer: {} }).success, false);
});
test("duplicate cart items aggregate before stock reservation", () => {
  assert.deepEqual(normalizeItems([{ product: "a", quantity: 1 }, { product: "a", quantity: 2 }]), [{ product: "a", quantity: 3 }]);
});
test("failed order compensation restores only reserved quantities", async (t) => {
  const calls = [];
  t.mock.method(Product, "updateOne", async (...args) => calls.push(args));
  await rollbackReservedStock([{ productId: "a", quantity: 3 }]);
  assert.deepEqual(calls, [[{ _id: "a" }, { $inc: { stock: 3 } }]]);
});

test("case variants of the same MongoDB product ID aggregate", () => {
  assert.deepEqual(normalizeItems([{ product: "507F1F77BCF86CD799439011", quantity: 1 }, { product: "507f1f77bcf86cd799439011", quantity: 2 }]), [{ product: "507f1f77bcf86cd799439011", quantity: 3 }]);
});
