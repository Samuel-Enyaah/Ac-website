import test from "node:test";
import assert from "node:assert/strict";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import { restoreOrderStock } from "../src/controllers/adminOrderController.js";
test("concurrent cancellation retries increment each product exactly once", async (t) => {
  const balances = new Map([["a", 2], ["b", 0]]);
  const restored = new Set();
  t.mock.method(Product, "updateOne", async (filter, update) => {
    assert.equal(filter.restoredOrderIds.$ne, "order-1");
    assert.equal(update.$addToSet.restoredOrderIds, "order-1");
    if (!restored.has(filter._id)) { restored.add(filter._id); balances.set(filter._id, balances.get(filter._id) + update.$inc.stock); }
  });
  t.mock.method(Order, "updateOne", async (filter, update) => { assert.equal(filter.status, "cancelled"); assert.equal(update.$set.stockDeducted, false); });
  const makeOrder = () => ({ _id: "order-1", stockDeducted: true, items: [{ product: "a", quantity: 1 }, { product: "a", quantity: 2 }, { product: "b", quantity: 4 }] });
  await Promise.all([restoreOrderStock(makeOrder()), restoreOrderStock(makeOrder())]);
  assert.deepEqual([...balances], [["a", 5], ["b", 4]]);
});
test("partial restoration failure leaves order retryable", async (t) => {
  let calls = 0; let completed = false;
  t.mock.method(Product, "updateOne", async () => { if (++calls === 2) throw new Error("database unavailable"); });
  t.mock.method(Order, "updateOne", async () => { completed = true; });
  const order = { _id: "order-1", stockDeducted: true, items: [{ product: "a", quantity: 1 }, { product: "b", quantity: 1 }] };
  await assert.rejects(restoreOrderStock(order), /database unavailable/);
  assert.equal(order.stockDeducted, true); assert.equal(completed, false);
});

import { rollbackReservedStock } from "../src/controllers/orderController.js";
test("reservation compensation retries do not increment previously restored stock", async (t) => {
  const released = new Set(); let stock = 2;
  t.mock.method(Product, "updateOne", async (filter, update) => {
    const id = filter.releasedReservationIds.$ne;
    assert.equal(update.$addToSet.releasedReservationIds, id);
    if (!released.has(id)) { released.add(id); stock += update.$inc.stock; }
  });
  const items = [{ productId: "a", quantity: 3, reservationId: "request-1" }];
  await rollbackReservedStock(items); await rollbackReservedStock(items);
  assert.equal(stock, 5);
});
