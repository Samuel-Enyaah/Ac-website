import { runMediaCleanup } from "../src/services/mediaCleanup.js";
import MediaCleanupJob from "../src/models/MediaCleanupJob.js";
import ReservationAttempt from "../src/models/ReservationAttempt.js";
import Order from "../src/models/Order.js";
import { deleteCloudinaryImage } from "../src/utils/cloudinaryMedia.js";
// Browser QA: real provider with QA_LIVE_MEDIA=1; explicit simulation otherwise.
import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { Writable } from "node:stream";
import { createRequire } from "node:module";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdir, rm } from "node:fs/promises";
import Admin from "../src/models/Admin.js";
import Product from "../src/models/Product.js";
import BusinessSettings from "../src/models/BusinessSettings.js";
import { ADMIN_COOKIE } from "../src/utils/adminAuth.js";
import { getCloudinary } from "../src/config/cloudinary.js";
import { createServer } from "../../client/node_modules/vite/dist/node/index.js";
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(tmpdir(), "rj-phase7a-browser/node_modules/playwright"),
);
const qaCache = join(tmpdir(), `rj-media-vite-${process.pid}`);
dotenv.config({ quiet: true });
process.env.NODE_ENV = "test";
if (process.env.RUN_ISOLATED_QA !== "1")
  throw new Error("Explicit isolated QA opt-in required.");
const dbName = `rj_phase7a_browser_${Date.now()}`;
let server, vite, browser, qaPage;
const errors = [];
const deleted = [];
const live = process.env.QA_LIVE_MEDIA === "1";
let failUpload = false;
let imageNumber = 0;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=",
  "base64",
);
const file = { name: "qa.png", mimeType: "image/png", buffer: png };
let passed = 0;
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
  await Promise.all([ReservationAttempt.init(), MediaCleanupJob.init()]);
  const admin = await Admin.create({
    name: "QA",
    email: "qa@example.invalid",
    passwordHash: "isolated-qa",
    active: true,
  });
  await BusinessSettings.create({
    key: "main",
    businessName: "QA Cooling",
    primaryPhone: "0201234567",
    whatsapp: "0201234567",
  });
  const host = express();
  host.get("/qa.png", (req, res) => res.type("png").send(png));
  server = host.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const api = `http://127.0.0.1:${server.address().port}`;
  const cloudinary = getCloudinary();
  if (!live) {
    cloudinary.uploader.upload_stream = (options, callback) =>
      new Writable({
        write(chunk, encoding, done) {
          done();
        },
        final(done) {
          if (failUpload) callback(new Error("Simulated transport failure"));
          else
            callback(null, {
              secure_url: `${api}/qa.png?image=${++imageNumber}`,
              public_id: options.public_id,
            });
          done();
        },
      });
    cloudinary.uploader.destroy = async (id) => {
      deleted.push(id);
      return { result: "ok" };
    };
  }
  const absent = async (id) => {
    await runMediaCleanup();
    if (!live) {
      assert.ok(deleted.includes(id));
      return;
    }
    try {
      await cloudinary.api.resource(id);
      assert.fail("Cloudinary asset still exists");
    } catch (error) {
      assert.equal(error.error?.http_code || error.http_code, 404);
    }
  };
  process.env.VITE_API_URL = `${api}/api/v1`;
  vite = await createServer({
    cacheDir: qaCache,
    root: new URL("../../client", import.meta.url).pathname.replace(
      /^\/(\w:)/,
      "$1",
    ),
    define: { "import.meta.env.VITE_API_URL": JSON.stringify(`${api}/api/v1`) },
    server: { host: "127.0.0.1", port: 0, strictPort: false },
  });
  await vite.listen();
  const siteOrigin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  process.env.CLIENT_URL = siteOrigin;
  host.use((await import("../src/app.js")).default);
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.route("**/api/v1/**", async (route) => {
    if (new URL(route.request().url()).origin !== api) {
      errors.push("Blocked API request outside this isolated QA server.");
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  await context.addCookies([
    {
      name: ADMIN_COOKIE,
      value: jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, {
        expiresIn: "20m",
      }),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  qaPage = page;
  page.setDefaultTimeout(60000);
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !/Product image upload failed|status of 502/.test(message.text())
    )
      errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  const go = async (path) => {
    await page.goto(`${siteOrigin}${path}`);
    await page.waitForLoadState("networkidle");
  };
  const fillProduct = async (name) => {
    await page.locator('[name="name"]').fill(name);
    await page.locator('textarea[name="description"]').fill("QA description");
    await page.locator('[name="price"]').fill("100");
    await page.locator('[name="stock"]').fill("5");
    await page.locator('[name="featured"]').check();
  };
  const submit = () => page.locator('button[type="submit"]').click();
  await go("/shop");
  await page.getByText("No products found", { exact: true }).waitFor();
  check("public empty catalogue state");
  await go("/admin/products/new");
  await fillProduct("Browser QA no image");
  await submit();
  await page.waitForURL(/\/admin\/products\/[^/]+\/edit/);
  assert.equal(await Product.countDocuments(), 1);
  check("browser create without image");
  await go("/admin/products/new");
  await fillProduct("Browser QA media");
  await page
    .locator('input[type="file"]')
    .setInputFiles([file, { ...file, name: "qa2.png" }]);
  assert.equal(await page.locator('img[src^="blob:"]').count(), 2);
  check("multiple local previews");
  failUpload = true;
  if (live)
    await page.route("**/api/v1/admin/products/*/images", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Media upload failed. Please try again.",
        }),
      }),
    );
  await submit();
  await page.waitForURL(/\/admin\/products\/[^/]+\/edit/);
  await page.waitForLoadState("networkidle");
  assert.equal(await Product.countDocuments(), 2);
  assert.equal(await page.locator('img[src^="blob:"]').count(), 2);
  check("upload failure keeps files and enters edit mode");
  failUpload = false;
  if (live) await page.unroute("**/api/v1/admin/products/*/images");
  await submit();
  await page.getByText("Product and images saved successfully.").waitFor();
  const product = await Product.findOne({ name: "Browser QA media" });
  assert.equal(product.images.length, 2);
  assert.equal(await Product.countDocuments(), 2);
  check("retry uploads to same product without duplicate creation");
  await page.getByRole("button", { name: "Make primary" }).click();
  await page.getByText("Primary image updated.").waitFor();
  const primary = (await Product.findById(product._id)).images[0]._id;
  assert.equal(String(primary), String(product.images[1]._id));
  await page.reload();
  await page.waitForLoadState("networkidle");
  check("primary image persists after browser refresh");
  await go(`/shop/${product.slug}`);
  await page
    .getByRole("button", { name: "View Browser QA media image 2", exact: true })
    .click();
  assert.equal(
    await page.locator('img[alt="Browser QA media"]').getAttribute("src"),
    product.images[0].url,
  );
  check("public gallery switches between real uploaded images");
  await go(`/admin/products/${product._id}/edit`);
  await page
    .getByRole("button", { name: "Remove product image" })
    .first()
    .click();
  await page.getByText("Product image removed successfully.").waitFor();
  assert.equal((await Product.findById(product._id)).images.length, 1);
  check("delete saved product image");
  await absent(product.images[1].publicId);
  assert.equal(
    (await Product.findById(product._id)).images[0].publicId,
    product.images[0].publicId,
  );
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid"),
    });
  await page
    .getByRole("alert")
    .filter({ hasText: "Only JPG, PNG and WEBP" })
    .waitFor();
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
  await page
    .getByRole("alert")
    .filter({ hasText: "Each image must be 5 MB" })
    .waitFor();
  await page
    .locator('input[type="file"]')
    .setInputFiles(
      Array.from({ length: 6 }, (_, i) => ({ ...file, name: `qa-${i}.png` })),
    );
  await page
    .getByRole("alert")
    .filter({ hasText: "maximum of 6 images" })
    .waitFor();
  check("browser rejects unsupported, oversized and excess files");
  await page.locator('textarea[name="description"]').fill("Edited description");
  await submit();
  await page.getByText("Product saved successfully.").waitFor();
  assert.equal(
    (await Product.findById(product._id)).description,
    "Edited description",
  );
  check("product edit persistence");
  await go("/admin/products/new");
  await fillProduct("Browser QA single image");
  await page.locator('input[type="file"]').setInputFiles(file);
  await submit();
  await page.waitForURL(/\/admin\/products\/[^/]+\/edit/);
  await page.waitForLoadState("networkidle");
  assert.equal(
    (await Product.findOne({ name: "Browser QA single image" })).images.length,
    1,
  );
  check("create with one image");
  await go("/admin/inventory");
  const inventoryCard = page
    .locator("section > div.rounded-2xl")
    .filter({ hasText: "Browser QA media" });
  await inventoryCard
    .getByRole("button", { name: "Adjust", exact: true })
    .click();
  await inventoryCard.getByLabel("Quantity", { exact: true }).fill("2");
  await inventoryCard
    .getByRole("button", { name: "Update", exact: true })
    .click();
  await inventoryCard.getByText("7", { exact: true }).waitFor();
  assert.equal((await Product.findById(product._id)).stock, 7);
  check("inventory UI immediately displays persisted adjustment");
  await go("/");
  await page.getByRole("heading", { name: "Featured Products" }).waitFor();
  assert.equal(
    await page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Featured Products" }) })
      .getByRole("link", { name: "Browser QA media", exact: true })
      .count(),
    1,
  );
  assert.equal(await page.getByLabel("Customer account").count(), 0);
  assert.ok(await page.locator('.storefront a[href="tel:0201234567"]').count());
  check("real featured products, telephone and no dead account control");
  await go(`/shop/${product.slug}`);
  await page.locator('img[alt="Browser QA media"]').waitFor();
  assert.ok(
    await page
      .locator('img[alt="Browser QA media"]')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  );
  check("public product image renders in browser");
  await mkdir(new URL("../../qa-artifacts", import.meta.url), {
    recursive: true,
  });
  await page.screenshot({
    path: new URL(
      "../../qa-artifacts/desktop-product.png",
      import.meta.url,
    ).pathname.replace(/^\/(\w:)/, "$1"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/");
  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Navigation" });
  await menu.waitFor();
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  assert.ok(await menu.locator('a[href="tel:0201234567"]').count());
  assert.ok(
    await menu.locator('a[href^="https://wa.me/233201234567"]').count(),
  );
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    assert.ok(await menu.evaluate((el) => el.contains(document.activeElement)));
  }
  await page.keyboard.press("Escape");
  assert.ok(await trigger.evaluate((el) => el === document.activeElement));
  check("mobile contacts, focus containment, Escape and focus restoration");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mkdir(new URL("../../qa-artifacts", import.meta.url), {
    recursive: true,
  });
  await page.screenshot({
    path: new URL(
      "../../qa-artifacts/mobile-home.png",
      import.meta.url,
    ).pathname.replace(/^\/(\w:)/, "$1"),
    fullPage: true,
  });
  await go("/admin/products");
  const adminTrigger = page.getByRole("button", {
    name: "Open admin navigation",
  });
  await adminTrigger.click();
  const adminMenu = page.getByRole("dialog", { name: "Admin navigation" });
  await adminMenu.waitFor();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await adminMenu.evaluate((el) => el.contains(document.activeElement)),
    );
  }
  await page.keyboard.press("Escape");
  assert.ok(await adminTrigger.evaluate((el) => el === document.activeElement));
  check("admin mobile sidebar focus containment and restoration");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/admin/settings");
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Upload Logo", exact: true }).click();
  await page.getByText("Business logo uploaded successfully.").waitFor();
  const oldLogo = (await BusinessSettings.findOne()).logoPublicId;
  await page.reload();
  await page.waitForLoadState("networkidle");
  assert.ok((await BusinessSettings.findOne()).logoUrl);
  check(
    live
      ? "real logo upload and refresh persistence"
      : "simulated logo upload and refresh persistence",
  );
  await go("/");
  for (const selector of ["header img", "footer img"]) {
    await page.locator(selector).waitFor();
    assert.ok(
      await page
        .locator(selector)
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    );
  }
  check("public Header and Footer render uploaded logo");
  await go("/admin/settings");
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Replace Logo", exact: true }).click();
  await page.getByText("Business logo uploaded successfully.").waitFor();
  await absent(oldLogo);
  check("logo replacement calls cleanup for old asset");
  const removedLogo = (await BusinessSettings.findOne()).logoPublicId;
  await page.getByRole("button", { name: "Remove Logo", exact: true }).click();
  await page.getByText("Business logo removed successfully.").waitFor();
  assert.equal((await BusinessSettings.findOne()).logoUrl, "");
  await absent(removedLogo);
  await go("/");
  assert.equal(await page.locator("header img").count(), 0);
  check("logo removal and public fallback branding");
  await go("/shop");
  assert.ok(
    await page
      .locator('img[alt="Browser QA media"]')
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  check("Shop displays uploaded image");
  await go(`/shop/${product.slug}`);
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await go("/cart");
  assert.ok(await page.getByText("Browser QA media", { exact: true }).count());
  await go("/checkout");
  await page.locator('[name="fullName"]').fill("Browser Customer");
  await page.locator('[name="phone"]').fill("0201234567");
  await page.locator('input[value="pickup"]').check({ force: true });
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await page
    .getByText(/RJ-ORD-/)
    .first()
    .waitFor();
  const placed = await Order.findOne({
    "customer.fullName": "Browser Customer",
  });
  assert.ok(placed);
  assert.equal((await Product.findById(product._id)).stock, 6);
  check("cart and checkout reserve stock");
  await go(`/admin/orders/${placed._id}`);
  await page.locator("select").first().selectOption("cancelled");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm change", exact: true })
    .click();
  await page.getByText("Order updated successfully.").waitFor();
  assert.equal((await Product.findById(product._id)).stock, 7);
  check("admin order cancellation restores stock");
  await go("/admin/inventory");
  await page
    .locator("section > div.rounded-2xl")
    .filter({ hasText: "Browser QA media" })
    .getByText("7", { exact: true })
    .waitFor();
  check("inventory reflects cancellation");
  assert.deepEqual(errors, []);
  check("no unexpected browser console errors or runtime exceptions");
  console.log(
    `${passed} browser checks passed (${live ? "real Cloudinary" : "simulated provider"}).`,
  );
} catch (error) {
  console.error("Browser QA failed:", error.message);
  if (qaPage) {
    await mkdir(new URL("../../qa-artifacts", import.meta.url), {
      recursive: true,
    });
    await qaPage
      .screenshot({
        path: new URL(
          "../../qa-artifacts/legacy-browser-failure.png",
          import.meta.url,
        ).pathname.replace(/^\/(\w:)/, "$1"),
        fullPage: true,
      })
      .catch(() => {});
    console.error("Browser diagnostics:", JSON.stringify(errors));
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await vite?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === dbName &&
    /^rj_phase7a_browser_\d+$/.test(dbName)
  ) {
    if (live)
      for (const job of await MediaCleanupJob.find()) {
        try {
          await deleteCloudinaryImage(job.publicId);
        } catch {
          console.error("QA asset cleanup failed.");
          process.exitCode = 1;
        }
      }
    await mongoose.connection.dropDatabase();
    console.log("Isolated browser QA database cleaned.");
  }
  await mongoose.disconnect();
  // Only this process's disposable Vite cache, verified directly under TEMP.
  if (dirname(resolve(qaCache)) === resolve(tmpdir()))
    await rm(qaCache, { recursive: true, force: true });
}
