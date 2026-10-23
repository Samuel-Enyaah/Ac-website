import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdir, rm } from "node:fs/promises";
import { createServer } from "../../client/node_modules/vite/dist/node/index.js";
import Admin from "../src/models/Admin.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import ServiceBooking from "../src/models/ServiceBooking.js";
import Staff from "../src/models/Staff.js";
import ActivityLog from "../src/models/ActivityLog.js";
import NotificationJob from "../src/models/NotificationJob.js";
import BusinessSettings from "../src/models/BusinessSettings.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
import { runNotifications } from "../src/services/notifications.js";
import { createTestTransport } from "../src/services/notificationTransports.js";

const qaCache = join(tmpdir(), `rj-operations-vite-${process.pid}`);
dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
process.env.EMAIL_PROVIDER = ""; // Automated QA must never send external email.

process.env.NODE_ENV = "test";
if (process.env.RUN_ISOLATED_QA !== "1")
  throw new Error("Explicit isolated QA opt-in required.");
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(tmpdir(), "rj-phase7a-browser/node_modules/playwright"),
);
const dbName = `rj_phase7c_browser_${Date.now()}_${process.pid}`;
const artifacts = fileURLToPath(
  new URL("../../qa-artifacts/phase7c/", import.meta.url),
);
let server,
  vite,
  browser,
  page,
  passed = 0;
const errors = [];
const check = (name) => {
  passed++;
  console.log(`PASS ${name}`);
};
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName,
    serverSelectionTimeoutMS: 15000,
  });
  assert.equal(mongoose.connection.name, dbName);
  await Promise.all(
    [
      ReservationAttempt,
      Order,
      ServiceBooking,
      Staff,
      ActivityLog,
      NotificationJob,
    ].map((Model) => Model.init()),
  );
  const admin = await Admin.create({
    name: "Operations Browser Admin",
    email: "qa-operations@example.invalid",
    passwordHash: "isolated-qa",
    active: true,
  });
  await BusinessSettings.create({
    key: "main",
    businessName: "R&J AC",
    primaryPhone: "0201234567",
    email: "qa@example.invalid",
  });
  const product = await Product.create({
    name: "QA operations accessory with a long title for mobile wrapping",
    slug: "qa-operations-product",
    category: "Accessories",
    description: "Isolated browser product",
    stock: 5,
    price: 1234567.89,
    active: true,
  });
  const host = express();
  server = host.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const api = `http://127.0.0.1:${server.address().port}`;
  vite = await createServer({
    cacheDir: qaCache,
    root: fileURLToPath(new URL("../../client", import.meta.url)),
    define: { "import.meta.env.VITE_API_URL": JSON.stringify(`${api}/api/v1`) },
    server: { host: "127.0.0.1", port: 0, strictPort: false },
  });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  process.env.CLIENT_URL = origin;
  host.use((await import("../src/app.js")).default);
  const publicPost = async (path, data) => {
    const response = await fetch(`${api}/api/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(data),
    });
    assert.equal(response.status, 201);
    return response.json();
  };
  const customer = {
    phone: "0201234567",
    email: "qa-browser-customer@example.invalid",
  };
  const order = (
    await publicPost("orders", {
      customer: { ...customer, fullName: "Operations Browser Customer" },
      items: [{ product: String(product._id), quantity: 1 }],
      fulfillmentMethod: "pickup",
      paymentMethod: "pay-on-delivery",
      notes: "Customer collection request",
    })
  ).order;
  const booking = (
    await publicPost("service-bookings", {
      customer: { ...customer, name: "Operations Browser Customer" },
      serviceType: "maintenance",
      description:
        "Long service description for the operations browser workflow",
      units: 2,
      preferredDate: new Date(Date.now() + 86400000 * 7)
        .toISOString()
        .slice(0, 10),
      preferredTime: "morning",
      location: "QA customer location",
      notes: "Customer service request",
    })
  ).booking;
  await runNotifications(); // Deliberately unconfigured: visible failures, no mail.
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.route("**/api/v1/**", async (route) => {
    if (new URL(route.request().url()).origin !== api) {
      errors.push("Blocked non-isolated API origin");
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  await context.addCookies([
    {
      name: ADMIN_COOKIE,
      value: jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      }),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  // The isolated Vite cache must compile on its first navigation.
  page.setDefaultNavigationTimeout(60000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await mkdir(artifacts, { recursive: true });
  const go = async (path) => {
    // Navigate within the SPA after its first cold load, as an operator does.
    // Repeated full reloads duplicate auth/settings requests under StrictMode
    // and can exhaust the unchanged public API limiter during a fast QA run.
    if (page.url() === origin + path) await page.reload();
    else if (page.url().startsWith(origin + "/"))
      await page.evaluate((next) => {
        history.pushState(null, "", next);
        dispatchEvent(new PopStateEvent("popstate"));
      }, path);
    else await page.goto(origin + path);
    await page.waitForLoadState("networkidle");
    const pathname = new URL(origin + path).pathname;
    const title =
      pathname === "/admin"
        ? "Work that needs attention"
        : pathname === "/admin/orders"
          ? "Orders"
          : pathname.startsWith("/admin/orders/")
            ? order.orderNumber
            : pathname === "/admin/bookings"
              ? "Service Bookings"
              : pathname.startsWith("/admin/bookings/")
                ? booking.bookingNumber
                : pathname === "/admin/staff"
                  ? "Staff directory"
                  : pathname === "/admin/staff/new"
                    ? "Add staff"
                    : pathname.startsWith("/admin/staff/")
                      ? "QA Browser Technician"
                      : pathname === "/admin/notifications"
                        ? "Notifications"
                        : pathname === "/admin/inventory"
                          ? "Stock Management"
                          : "Operations Browser Customer";
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
  };
  const saveWorkflow = async (label, state) => {
    await page.getByLabel(label, { exact: true }).selectOption(state);
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm change", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: /updated successfully/ })
      .waitFor();
    assert.equal(
      await page.getByLabel(label, { exact: true }).inputValue(),
      state,
    );
  };
  await go("/admin");
  await page
    .getByRole("link", { name: /Orders awaiting confirmation/ })
    .waitFor();
  await page.getByRole("link", { name: /Unassigned service bookings/ }).click();
  await page
    .getByRole("link", { name: booking.bookingNumber, exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Assigned staff", { exact: true }).inputValue(),
    "unassigned",
  );
  check(
    "dashboard pending/unassigned/notification work links reach meaningful filters",
  );
  await go("/admin/staff/new");
  await page
    .getByLabel("Staff name", { exact: true })
    .fill("QA Browser Technician");
  await page.getByLabel("Phone", { exact: true }).fill("0201111111");
  await page
    .getByLabel("Email", { exact: true })
    .fill("qa-tech@example.invalid");
  await page
    .getByLabel("Skills (comma separated)", { exact: true })
    .fill("Maintenance, Installation");
  await page.getByRole("button", { name: "Save staff", exact: true }).click();
  await page.waitForURL(/\/admin\/staff\/[a-f0-9]{24}$/);
  const staff = await Staff.findOne({ name: "QA Browser Technician" });
  assert.ok(staff);
  await page
    .getByRole("heading", { name: "QA Browser Technician", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Staff activity", exact: true })
    .waitFor();
  await page.getByLabel("Phone", { exact: true }).fill("0201112222");
  await page.getByRole("button", { name: "Save staff", exact: true }).click();
  await page
    .getByText("Staff assignment record updated.", { exact: true })
    .waitFor();
  assert.equal((await Staff.findById(staff._id)).phone, "0201112222");
  check("staff create and edit persist without creating an admin login");
  await go("/admin/orders?status=pending&paymentStatus=pending&sort=oldest");
  await page.getByLabel("Search", { exact: true }).fill(order.orderNumber);
  await page
    .getByRole("button", { name: "Search records", exact: true })
    .click();
  await page
    .getByRole("link", { name: order.orderNumber, exact: true })
    .click();
  await page
    .getByRole("heading", { name: order.orderNumber, exact: true })
    .waitFor();
  await page
    .getByLabel("Order Status", { exact: true })
    .selectOption("confirmed");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    );
  }
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  assert.ok(
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  check("status confirmation traps focus, closes on Escape and restores focus");
  await saveWorkflow("Order Status", "confirmed");
  await saveWorkflow("Order Status", "processing");
  await page
    .getByLabel("Assign staff", { exact: true })
    .selectOption(String(staff._id));
  await page
    .getByLabel("Assignment note (internal)", { exact: true })
    .fill("Handle pickup preparation");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Assignment saved." })
    .waitFor();
  await page
    .getByLabel("New internal note", { exact: true })
    .fill("Browser private order follow-up");
  await page
    .getByRole("button", { name: "Add internal note", exact: true })
    .click();
  await page
    .getByText("Browser private order follow-up", { exact: true })
    .waitFor();
  await saveWorkflow("Order Status", "ready");
  await saveWorkflow("Order Status", "delivered");
  const savedOrder = await Order.findById(order.id);
  assert.equal(savedOrder.status, "delivered");
  assert.equal(savedOrder.assignmentHistory.length, 1);
  assert.equal(savedOrder.internalNotes.length, 1);
  assert.equal((await Product.findById(product._id)).stock, 4);
  check(
    "order search, filters, status progression, assignment, notes and audit persist",
  );
  await page
    .getByRole("button", { name: "Retry notification", exact: true })
    .first()
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Notification queued" })
    .waitFor();
  await runNotifications({ transport: createTestTransport(), limit: 100 });
  await go(`/admin/orders/${order.id}`);
  await page
    .getByText("Test simulation only. No message was sent to the customer.", {
      exact: true,
    })
    .first()
    .waitFor();
  check(
    "notification failure and trusted retry display an honest simulation result",
  );
  await go("/admin/bookings?status=pending&serviceType=maintenance");
  await page
    .getByRole("link", { name: booking.bookingNumber, exact: true })
    .click();
  await saveWorkflow("Booking Status", "confirmed");
  await page
    .getByLabel("Assign staff", { exact: true })
    .selectOption(String(staff._id));
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Assignment saved." })
    .waitFor();
  await page
    .getByLabel("New internal note", { exact: true })
    .fill("Browser private service follow-up");
  await page
    .getByRole("button", { name: "Add internal note", exact: true })
    .click();
  await page
    .getByText("Browser private service follow-up", { exact: true })
    .waitFor();
  await go(`/admin/staff/${staff._id}`);
  await page.getByLabel("Staff status", { exact: true }).selectOption("false");
  await page.getByRole("button", { name: "Save staff", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm change", exact: true })
    .click();
  await page
    .getByText("Staff assignment record deactivated.", { exact: true })
    .waitFor();
  await go(`/admin/bookings/${booking.id}`);
  await page.getByText("Inactive", { exact: true }).waitFor();
  assert.ok(
    await page.getByText("QA Browser Technician", { exact: true }).count(),
  );
  check("staff deactivation preserves visible historical booking assignments");
  await go(`/admin/staff/${staff._id}`);
  await page.getByLabel("Staff status", { exact: true }).selectOption("true");
  await page.getByRole("button", { name: "Save staff", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm change", exact: true })
    .click();
  await page
    .getByText("Staff assignment record activated.", { exact: true })
    .waitFor();
  await go(`/admin/bookings/${booking.id}`);
  for (const state of ["technician-assigned", "in-progress", "completed"])
    await saveWorkflow("Booking Status", state);
  assert.equal((await ServiceBooking.findById(booking.id)).status, "completed");
  check("booking filters, assignment, notes and full service progression");
  await go("/admin/staff?role=Technician&skill=Maintenance&active=true");
  await page
    .getByRole("link", { name: "QA Browser Technician", exact: true })
    .waitFor();
  await go("/admin/customers/233201234567");
  await page
    .getByRole("heading", { name: "Latest operational activity", exact: true })
    .waitFor();
  assert.ok(await page.locator(`a[href="/admin/orders/${order.id}"]`).count());
  assert.ok(
    await page.locator(`a[href="/admin/bookings/${booking.id}"]`).count(),
  );
  check("staff role/skills/status filters and customer related work timeline");
  const fixtureJobs = [];
  for (let n = 0; n < 28; n++)
    fixtureJobs.push(
      await NotificationJob.create({
        eventKey: crypto.randomUUID(),
        channel: "email",
        template: "order.confirmed",
        recipient: "notification-fixture@example.invalid",
        entityType: "order",
        entityId: order.id,
        reference: order.orderNumber,
        payload: {
          reference: order.orderNumber,
          subject: "QA fixture",
          text: "No external email sent.",
        },
        status:
          n === 0
            ? "delivered"
            : n === 1
              ? "accepted"
              : n === 2
                ? "retrying"
                : n === 3
                  ? "pending"
                  : "failed",
        provider: "resend",
        acceptedAt: n < 2 ? new Date() : undefined,
        deliveredAt: n === 0 ? new Date() : undefined,
        failureCode: n >= 4 ? "configuration" : "",
        lastError: n >= 4 ? "Email sender configuration is incomplete." : "",
      }),
    );
  await go("/admin/notifications");
  await page
    .getByLabel("Recipient search", { exact: true })
    .fill("notification-fixture@example.invalid");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await page.getByText("28 matching notifications", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("Page 2 of 2", { exact: true }).waitFor();
  assert.equal(await page.locator("[data-notification-id]").count(), 3);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByText("Page 1 of 2", { exact: true }).waitFor();
  check(
    "notification recipient filter and pagination preserve matching results",
  );
  for (const [label, value] of [
    ["Channel", "email"],
    ["Record type", "order"],
    ["Notification event", "order.confirmed"],
    ["Notification ordering", "oldest"],
  ]) {
    await page.getByLabel(label, { exact: true }).selectOption(value);
    await page.waitForLoadState("networkidle");
  }
  await page
    .getByLabel("Reference search", { exact: true })
    .fill(order.orderNumber);
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel("From date (UTC)", { exact: true }).fill(today);
  await page.getByLabel("To date (UTC)", { exact: true }).fill(today);
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await page.getByText("28 matching notifications", { exact: true }).waitFor();
  for (const [state, label] of [
    ["accepted", "Accepted by provider"],
    ["delivered", "Delivered to mail server"],
    ["failed", "Failed"],
  ]) {
    await page
      .getByLabel("Notification status", { exact: true })
      .selectOption(state);
    await page.waitForLoadState("networkidle");
    const expected = state === "failed" ? 24 : 1;
    await page
      .getByText(`${expected} matching notifications`, { exact: true })
      .waitFor();
    await page
      .locator("[data-notification-id] .ops-badge")
      .filter({ hasText: label })
      .first()
      .waitFor();
    assert.equal(
      await page
        .locator("[data-notification-id] .ops-badge")
        .filter({ hasText: label })
        .count(),
      expected,
      `${state} badge count`,
    );
  }
  check(
    "notification channel, entity, event, reference, date, ordering and delivery-state filters",
  );
  await page
    .getByLabel("Notification status", { exact: true })
    .selectOption("delivered");
  await page.waitForLoadState("networkidle");
  await page
    .locator(`[data-notification-id="${fixtureJobs[0]._id}"]`)
    .getByRole("link", { name: "Open order", exact: true })
    .click();
  await page
    .getByRole("heading", { name: order.orderNumber, exact: true })
    .waitFor();
  await page
    .locator(`[data-notification-id="${fixtureJobs[0]._id}"]`)
    .getByText("Delivered to mail server", { exact: true })
    .first()
    .waitFor();
  await go(`/admin/bookings/${booking.id}`);
  await page
    .getByRole("heading", { name: "Notification history", exact: true })
    .waitFor();
  assert.ok(await page.locator("[data-notification-id]").count());
  check(
    "notification related-record navigation and order/booking delivery histories",
  );
  await go("/admin");
  for (const [status, label] of [
    ["pending", "Queued emails"],
    ["retrying", "Retrying emails"],
    ["failed", "Failed emails"],
  ]) {
    const card = page.getByRole("link", { name: new RegExp(label) });
    assert.ok(Number(await card.locator("p").innerText()) > 0);
    assert.equal(
      await card.getAttribute("href"),
      `/admin/notifications?status=${status}`,
    );
  }
  await page.getByRole("link", { name: /Failed emails/ }).click();
  await page
    .getByRole("heading", { name: "Notifications", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Notification status", { exact: true }).inputValue(),
    "failed",
  );
  check(
    "dashboard queued/retrying/failed counts link to accurate notification filters",
  );
  const views = [
    ["dashboard", "/admin"],
    ["orders", "/admin/orders"],
    ["order", `/admin/orders/${order.id}`],
    ["bookings", "/admin/bookings"],
    ["booking", `/admin/bookings/${booking.id}`],
    ["staff", "/admin/staff"],
    ["staff-detail", `/admin/staff/${staff._id}`],
    ["notifications", "/admin/notifications"],
    ["customer", "/admin/customers/233201234567"],
    ["inventory", "/admin/inventory?stock=low"],
  ];
  for (const [name, path] of views) {
    await go(path);
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("h1").count(), 1);
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      // Chromium can expose new innerWidth before the responsive layout pass.
      // Wait for the shell's actual breakpoint layout before measuring overflow.
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector("main").parentElement)
            .paddingLeft === (innerWidth >= 1024 ? "288px" : "0px"),
      );
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll("body *")]
          .filter(
            (el) =>
              el.getBoundingClientRect().right > innerWidth + 1 &&
              getComputedStyle(el).visibility !== "hidden",
          )
          .slice(0, 12)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            right: el.getBoundingClientRect().right,
          })),
      }));
      assert.ok(
        overflow.scrollWidth <= overflow.width,
        `${name} overflows at ${width}: ${JSON.stringify(overflow)}`,
      );
      const undersized = await page
        .locator(
          "main .ops-button, main .ops-link, main .ops-field input, main .ops-field select",
        )
        .evaluateAll((elements) =>
          elements
            .filter(
              (el) =>
                el.getClientRects().length &&
                el.getBoundingClientRect().height < 43.5,
            )
            .map((el) => el.textContent),
        );
      assert.deepEqual(undersized, [], `${name} touch targets at ${width}`);
      if ([320, 390, 1440].includes(width))
        await page.screenshot({
          path: join(artifacts, `${name}-${width}.png`),
          fullPage: true,
        });
    }
    check(
      `${name}: one main/h1, touch targets and no page overflow at all seven widths`,
    );
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await go("/admin");
  const trigger = page.getByRole("button", {
    name: "Open admin navigation",
    exact: true,
  });
  await trigger.click();
  const menu = page.getByRole("dialog", {
    name: "Admin navigation",
    exact: true,
  });
  await menu.waitFor({ state: "visible" });
  await page.waitForFunction(() =>
    document
      .querySelector('[role="dialog"][aria-label="Admin navigation"]')
      ?.contains(document.activeElement),
  );
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await menu.evaluate((el) => el.contains(document.activeElement)),
      "Mobile menu must contain focus after Tab",
    );
  }
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "Open admin navigation",
  );
  assert.ok(
    await trigger.evaluate((el) => el === document.activeElement),
    "Escape must restore navigation trigger focus",
  );
  check("mobile admin navigation focus containment and Escape restoration");
  assert.deepEqual(errors, []);
  check("no unexpected console errors or runtime exceptions");
  console.log(
    `${passed} operations browser checks passed, including 70 responsive width checks.`,
  );
} catch (error) {
  console.error("Operations browser QA failed:", error.message);
  console.error("Browser diagnostics:", JSON.stringify(errors));
  process.exitCode = 1;
  if (page)
    await page
      .screenshot({ path: join(artifacts, "failure.png"), fullPage: true })
      .catch(() => {});
} finally {
  await browser?.close();
  await vite?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === dbName &&
    /^rj_phase7c_browser_\d+_\d+$/.test(dbName)
  ) {
    await mongoose.connection.dropDatabase();
    console.log("Isolated operations browser database cleaned.");
  }
  await mongoose.disconnect();
  // Only this process's disposable Vite cache, verified directly under TEMP.
  if (dirname(resolve(qaCache)) === resolve(tmpdir()))
    await rm(qaCache, { recursive: true, force: true });
}
