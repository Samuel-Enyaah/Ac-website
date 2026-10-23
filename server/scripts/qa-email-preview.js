// Local HTML rendering only; no environment credentials, DB or external mail.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  notificationTemplates,
  renderNotification,
} from "../src/services/notificationTemplates.js";
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(tmpdir(), "rj-phase7a-browser/node_modules/playwright"),
);
const directory = fileURLToPath(
  new URL("../../qa-artifacts/phase7d/emails/", import.meta.url),
);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => route.abort());
  for (const template of notificationTemplates) {
    const reference = `${template.startsWith("order.") ? "RJ-ORD" : "RJ-SVC"}-2026-123456`;
    const rendered = renderNotification(template, reference, {
      businessName: "R&J AC ACCESSARIES COM. LTD",
      primaryPhone: "0201234567",
      email: "support@example.invalid",
      whatsapp: "0201234567",
      address: "QA preview address",
      city: "Accra",
    });
    await writeFile(join(directory, `${template}.html`), rendered.html, "utf8");
    await writeFile(join(directory, `${template}.txt`), rendered.text, "utf8");
    assert.ok(
      rendered.text.includes(reference) && rendered.text.includes("Telephone:"),
    );
    for (const width of [320, 600]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.setContent(rendered.html);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(await page.locator("h1").count(), 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${template} overflow at ${width}`,
      );
      assert.equal(await page.locator('a[href^="https://wa.me/"]').count(), 1);
      await page.screenshot({
        path: join(directory, `${template}-${width}.png`),
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS 12 HTML/text templates, 24 responsive renders, no overflow or browser errors. Email-client inbox rendering remains unverified.",
  );
} finally {
  await browser.close();
}
