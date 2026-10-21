# Phase 7A verification

`npm test --prefix server` uses Node's built-in test runner. Unit/controller tests replace model methods and never connect to a database. Multipart tests start a temporary localhost Express server and exercise real Multer parsing. No package versions were changed or dependencies reinstalled.

From the server directory in PowerShell:

```powershell
$env:RUN_ISOLATED_QA='1'
$env:QA_SKIP_LIVE_MEDIA='1'
node scripts/qa-integration.js
```

The integration runner loads server/.env for connection credentials but ALWAYS overrides the database name with a unique `rj_phase7a_qa_<timestamp>` name. Its finally block checks that exact name before dropping it. It verifies product creation, inventory, reservation, concurrent cancellation, service booking, CRM and dashboard. Clear QA_SKIP_LIVE_MEDIA to also verify live Cloudinary upload, delivery, product ordering/deletion and logo replacement/removal. Live tests create temporary Cloudinary assets and delete only the returned IDs. Real upload/delete verification now succeeds with the temporary local credentials; see the Phase 7A final closeout and current phase report.

Browser QA uses real Express and a separate unique `rj_phase7a_browser_<timestamp>` database. Only Cloudinary transport is simulated; no application API data is fabricated in the shipped frontend. The fixture image is a one-pixel PNG. Install temporary Playwright tooling and use installed Edge:

```powershell
npm install --prefix "$env:TEMP/rj-phase7a-browser" playwright --no-package-lock --no-audit --no-fund
$env:RUN_ISOLATED_QA='1'
node scripts/qa-browser.js
```

Vite selects the next free local port if 5173 is in use. The script closes Edge, Vite and Express and drops only its isolated database. Screenshots are written to `qa-artifacts`. Expected console error logs appear during the deliberately failed upload. The test asserts no unhandled browser runtime exceptions.

`qa-cloudinary-transport.js` is an explicitly gated diagnostic that compares native signed multipart upload with the SDK, without printing credentials. Any successfully returned temporary asset is deleted immediately.

Cancellation first atomically records cancelled status, then restores each product with a per-order marker in the same atomic stock update, then marks the order restored. A partial failure keeps stockDeducted true and a repeated save resumes safely. The admin order page explains this recovery. Compensation for failed order creation uses per-attempt restoration markers. These markers must not be removed while a retry could still occur.


## Phase 7A closeout recovery verification

The new isolated-database suite is separate from the no-database unit suite:

```powershell
$env:RUN_ISOLATED_QA='1'
npm run test:reliability --prefix server
```

It always overrides the URI database with `rj_phase7a_reliability_<timestamp>_<pid>`, checks that exact name before dropping it, and never connects to the URI's default database. It covers real MongoDB concurrency, interrupted reservation/compensation, cancellation restoration, durable media intent/job handling, retries/backoff, stale-save fencing, HTTP idempotency and sanitized provider errors. Its Cloudinary calls are simulated deliberately for failure injection. Live sign-off uses the separate real-provider suites below.

From `server`:

```powershell
$env:RUN_ISOLATED_QA='1'
Remove-Item Env:QA_SKIP_LIVE_MEDIA -ErrorAction SilentlyContinue
node scripts/qa-integration.js
$env:QA_LIVE_MEDIA='1'
node scripts/qa-browser.js
```

Browser `QA_LIVE_MEDIA=1` uses actual Cloudinary for successful product/logo uploads and deletion checks. One deliberately failed upload response is intercepted solely to test retry UX; successful uploads are never simulated in live mode. The test checks the real image loads in Shop/details and Header/Footer. Temporary assets from durable intent records are removed before dropping the isolated database. The low-level diagnostic now fails its process exit code on unsuccessful HTTP/creation/cleanup results and redacts authorization material.

### Recovery operation

Normal `npm start` initializes unique reservation/cleanup indexes before listening, then starts one non-overlapping recovery pass every 10 seconds. A pass processes up to 25 stale reservation attempts (older than 60 seconds), 25 cancelled orders still needing restoration and 20 due cleanup jobs. Multiple server processes remain safe through atomic stock markers, state transitions and cleanup leases. SIGINT/SIGTERM stops new passes and HTTP acceptance, drains work and disconnects MongoDB; a 120-second shutdown deadline leaves durable work for the next process if it expires.

Media cleanup is asynchronous: a successful removal response confirms DB removal, with provider deletion following in the worker. Cleanup calls have a 30-second provider timeout. Failed jobs keep a sanitized error and retry after 30 seconds, doubling up to 24 hours without discarding the job. Expired two-minute leases are reclaimable. Referenced assets are protected and rechecked daily. Upload intents are written before upload and become eligible after 15 minutes, allowing a failed save/process interruption to be recovered. Optimistic document version fencing prevents a stale controller from attaching media after cleanup begins. The application currently assumes normal provider completion within this grace period; remote completion delayed beyond it requires operational inspection.

No public cleanup enqueue/retry endpoint exists. Operators can inspect `MediaCleanupJob` records through trusted database tooling. Keep completed records and reservation markers: deleting them can invalidate retry guarantees. No automated retention policy is introduced in this phase.

### Order API contract

`POST /api/v1/orders` accepts an optional `Idempotency-Key` header (16?128 ASCII letters/digits/hyphens/underscores). The shipped checkout always sends a random UUID and retains its pending payload/key in sessionStorage through timeout/reload. Same-key normalized requests replay HTTP 201 with the existing order receipt; materially different data returns 409. Insufficient stock returns 400 after durable compensation. Transient failures must be retried with the same key. Requests without the header remain backward compatible, but repeated independent keyless requests cannot be deduplicated.

The reservation document stores a SHA-256 key hash, canonical request hash, immutable order snapshots/reference and state. Per-product deduction markers and terminal compensation markers are written atomically with stock. A terminal marker also fences a delayed reserving process that has not deducted yet. `committing` attempts never compensate: they insert/upsert the deterministic order ID and recover completion after interruption. Completed order records are never overwritten on replay; cancellation restoration remains separate and idempotent. References retain `RJ-ORD-YYYY-NNNNNN`.

Root Cloudinary credentials are temporary for local verification only. Replace them with a dedicated R&J backend key with least-privilege upload/delete permissions before production/deployment. Provider resource-read permission is used by QA to verify absence, not by the application cleanup worker. No automatic credential rotation is performed.


## Phase 7B storefront verification

`server/scripts/qa-storefront.js` exercises the redesigned public pages with the real application API and a unique `rj_phase7b_browser_<timestamp>_<pid>` database. It seeds 30 test products, including a long name, a large currency value, two gallery images, an out-of-stock item and multiple categories/brands. Its SVG is a local test fixture, never shipped as catalogue data. The suite checks filters, cart persistence/stale data, delivery and pickup, installation, price changes, lost-response idempotency (including zero remaining stock), booking and dynamic contact links. Lost order and booking responses are deliberately interrupted only after the real server has created the corresponding record.

From `server` in PowerShell:

```powershell
$env:RUN_ISOLATED_QA='1'
node scripts/qa-storefront.js
```

Playwright uses the same temporary installation and Edge channel as Phase 7A. Ten public routes are checked at 320, 375, 390, 430, 768, 1024 and 1440 px. Screenshots at 320, 390 and 1440 px are saved to `qa-artifacts/phase7b/`. The suite also checks one main/primary heading, metadata, keyboard focus containment/restoration, Escape, scroll lock, reduced motion and unexpected browser errors. This is functional/accessibility coverage, not a claim of full WCAG certification or cross-browser testing.

Continue running the Phase 7A reliability, integration and browser suites too. The existing browser selectors now target the featured section and actual form fields so the new hero and description metadata do not create ambiguous matches. Successful media checks still use real Cloudinary with `QA_LIVE_MEDIA=1`. If this environment encounters an SDK network timeout, the verified local retry uses `$env:NODE_OPTIONS='--dns-result-order=ipv4first'`; this is a QA process option, not an application change.


Both browser runners explicitly bind the browser/API to `127.0.0.1`, use a disposable frontend port and define the QA API URL in the temporary Vite configuration. A browser request guard blocks API origins other than the isolated server. This avoids inheriting a developer's normal API address. No `.env` files are changed.


## Phase 7C operations verification

Read `server/docs/OPERATIONS.md` for status rules, idempotency, internal data boundaries, notification semantics and the future provider contract. The expanded no-database suite includes workflow, template, safe audit metadata and transport tests.

From `server` in PowerShell:

```powershell
$env:RUN_ISOLATED_QA='1'
node scripts/qa-operations.js
node scripts/qa-operations-browser.js
```

The operations integration runner uses a unique `rj_phase7c_qa_<timestamp>_<pid>` database, initializes critical indexes and checks the exact name before dropping it. It covers booking concurrency/canonical replay/changed payload/past-date replay/keyless compatibility; active staff assignments and inactive history; full order/booking workflows; terminal-state rejection and exact stock restoration; append-only authenticated notes; durable outbox interruption/replay; audit actor/privacy; notification deduplication, transient/permanent failure, trusted-recipient retry, simulated success, injected provider acceptance, expired leases, stale-worker fencing, attempt limits, settings activity and CRM/dashboard context. Notification transports are explicitly injected test doubles; no email/SMS/WhatsApp is sent.

The operations browser runner uses a separate `rj_phase7c_browser_<timestamp>_<pid>` database and a guarded localhost API. It verifies staff creation/edit/deactivation/reactivation; dashboard/list filters; order/booking assignments, workflow confirmations, notes, activity and notification history; customer links; dialog/sidebar keyboard focus; and ten admin screens at 320, 375, 390, 430, 768, 1024 and 1440 pixels. Screenshots are written to `qa-artifacts/phase7c/` at 320, 390 and 1440 pixels. Browser tooling remains the temporary Playwright installation and installed Edge used by Phase 7A.

The storefront runner now also deliberately discards a successful real booking response, reloads with a different service query, verifies the original form is restored/locked, retries the exact key and payload, and asserts only one booking exists. The real-media browser runner confirms cancellation through the new consequence dialog.

All three browser runners use separate process-specific Vite caches beneath TEMP, validate the cache parent before cleanup, and preserve the isolated API-origin guard. This prevents dependency-cache collisions between concurrent test servers. No application credentials or `.env` files are changed.
