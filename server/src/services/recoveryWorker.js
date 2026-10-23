import { recoverOperations } from "./operationsOutbox.js";
import { runNotifications } from "./notifications.js";
import { recoverNotificationWebhooks } from "./notificationWebhooks.js";
import { runMediaCleanup } from "./mediaCleanup.js";
import { reconcileReservations } from "./orderReservations.js";
import { restoreOrderStock } from "../controllers/adminOrderController.js";
import Order from "../models/Order.js";
export async function recoverOnce() {
  await reconcileReservations();
  for (const order of await Order.find({
    status: "cancelled",
    stockDeducted: true,
  })
    .sort({ updatedAt: 1 })
    .limit(25)) {
    try {
      await restoreOrderStock(order, { retry: true });
    } catch {
      console.error("Cancellation recovery deferred; durable order retained.");
      await Order.updateOne(
        { _id: order._id },
        { $set: { updatedAt: new Date() } },
      );
    }
  }
  await runMediaCleanup();
  await recoverOperations();
  await recoverNotificationWebhooks();
  await runNotifications();
  await recoverNotificationWebhooks();
}
export function startRecoveryWorker() {
  let stopped = false;
  let running = Promise.resolve();
  let busy = false;
  const tick = () => {
    if (stopped || busy) return;
    busy = true;
    running = recoverOnce()
      .catch(() =>
        console.error("Recovery pass deferred; durable records retained."),
      )
      .finally(() => {
        busy = false;
      });
  };
  const timer = setInterval(tick, 10000);
  timer.unref();
  tick();
  return async () => {
    stopped = true;
    clearInterval(timer);
    await running;
  };
}
