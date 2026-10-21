# Phase 7A closeout final

Date: 2026-10-16. **Status: COMPLETE for the requested local Phase 7A scope.** Nothing deployed. Phase 7B not started. This report supersedes the earlier blocked closeout result; historical audit/report files remain unchanged.

## 1. Baseline

The opening quality-gate run passed client lint (no diagnostics), all 16 existing server tests and the client production build (2,008 modules; 4.28 seconds). The previously recorded server syntax baseline was 49 files with no failures. Fresh final syntax validation covers 55 files with no failures. Existing uncommitted Phase 7A work was preserved.

## 2. Cloudinary live-provider result

The fresh signed diagnostic immediately before this work returned HTTP 200, successful creation, secure_url and public_id, followed by deletion HTTP 200 / ok. The application-level suites below then exercised real Cloudinary successfully. The previous non-root key lacked asset-create permission. The corrected dotenv bootstrap is retained: explicit server/.env path, application imports after initialization, production environment variables taking precedence.

## 3. Product media live QA

Passed through the real backend/provider and browser: creation without images, single upload, multiple uploads, MongoDB URL/public-ID persistence, image ordering and primary selection, admin refresh, Shop rendering, Product Details gallery switching, removal of one image and provider-resource absence verification. Remaining images were verified unaffected. Unsupported formats, files above 5 MB and more than six images were rejected by browser checks; the real multipart unit tests also exercise server MIME/size/count limits. Retry after an intentionally injected upload failure kept the same product rather than creating a duplicate.

## 4. Logo live QA

Passed real upload, MongoDB URL/public-ID persistence, Admin Settings refresh, Header/Footer image rendering, replacement and old-resource absence, removal and resource absence, and public fallback branding. The public settings response was checked to exclude logoPublicId.

## 5. Durable media cleanup architecture

MediaCleanupJob persists provider, publicId, resourceType, operation, contextType/contextId, reason, status, attempts, sanitized lastError, nextRetryAt, lease token/expiry, completedAt and timestamps. Public IDs originate in loaded server records or server-generated upload intent IDs written to MongoDB before Cloudinary upload. There is no client-facing enqueue endpoint.

Upload intents survive upload success followed by database-save failure. Removal/replacement records cleanup intent before changing the referenced document, then makes cleanup due after a successful save. Thus a failure between writes retains a recoverable record. Product/settings optimistic version fencing plus reference checks protect still-attached media from cleanup and prevent stale saves attaching a deleted asset. Actual deletion runs outside the admin request.

## 6. Cleanup retry behavior

A local worker runs every 10 seconds with non-overlapping passes, processing up to 20 due cleanup jobs. It claims a two-minute lease atomically; interrupted leases are reclaimable. Provider calls have a 30-second timeout. Both `ok` and `not found` resolve a job, and completed jobs are not executed again. Failures remain pending with sanitized messages, starting at 30 seconds of backoff and doubling to a maximum of 24 hours. Retries are not discarded after an arbitrary attempt count. Attached assets are protected and rechecked daily. Unattached upload intents become due after a 15-minute grace period.

SIGINT/SIGTERM stops scheduling and HTTP acceptance, drains active work, and disconnects MongoDB. A 120-second shutdown deadline leaves durable unfinished records recoverable by the next process. No paid/external queue was introduced.

## 7. Order idempotency architecture

Checkout generates a UUID Idempotency-Key and retains the pending key/payload in sessionStorage for retries/reload, with an in-memory fallback when storage is unavailable. The backend persists a unique SHA-256 key hash, canonical request hash, immutable order snapshot and unique RJ-ORD reference. Same-key equivalent requests return the existing receipt; changed order details return 409. Unique indexes are initialized before the production server accepts requests. Concurrent duplicate HTTP requests were verified to produce one order and one deduction.

## 8. Reservation/recovery architecture

ReservationAttempt progresses through reserving, committing, completed or compensating/failed. Per-product reservation markers are written atomically with a conditional stock decrement, ensuring no negative stock and no duplicate deduction. Compensation atomically checks deduction markers and writes a terminal marker even for an item that was never deducted; this prevents a delayed reserving process from deducting after compensation has passed that item.

Only reserving attempts may transition to compensation. Committing attempts preserve their stock and upsert an order using the attempt's deterministic ID; a crash after order insertion but before completion safely reuses that order. Existing order status/details are not overwritten on replay. Historical orders retain their existing schema/meaning and RJ-ORD-YYYY-NNNNNN references. Existing per-order cancellation markers remain in use.

## 9. Reconciliation behavior

Every recovery pass considers up to 25 incomplete attempts older than 60 seconds, resumes reservation or commitment, or finishes compensation. Temporary failures remain durable and are deferred so they do not permanently starve later attempts. The worker also retries up to 25 cancelled orders whose stock restoration remains incomplete. All QA reconciliation operated on disposable isolated databases. MongoDB transactions are not required.

## 10. Database/schema changes

Added ReservationAttempt with unique keyHash and orderNumber indexes and indexed state. Added MediaCleanupJob with unique publicId and a due-work/lease index. Added hidden Product.reservedAttemptIds; existing releasedReservationIds and restoredOrderIds remain. No migration rewrites historical orders. No TTL/ledger deletion was added because removing idempotency evidence prematurely would weaken retry guarantees.

## 11. API contract changes

POST /api/v1/orders accepts Idempotency-Key: 16-128 ASCII letters, digits, hyphens or underscores. Replay returns HTTP 201 with the existing receipt. Materially different payloads under one key return 409. Stock rejection returns 400 after compensation; transient failures must retry the same key. Legacy callers may omit the header, retaining the prior request contract, but independent keyless submissions cannot be deduplicated.

Pickup deliveryAddress may be null, matching the existing checkout payload. Product IDs are canonicalized before aggregation, including mixed-case representations of one MongoDB ID. Customer-facing references and receipt fields are preserved. Media deletion responses confirm DB removal; provider cleanup now completes asynchronously through the durable worker.

## 12. Frontend changes

Order service now sends/persists the checkout key, preserves it on ambiguous failures, clears it on success or a definitive 400, and refuses silent replacement by materially different pending details. Checkout restores pending form details after reload. Existing product upload retry behavior is preserved. Provider authorization failures show an actionable account-permissions message without raw provider authorization details. No visual redesign or new business feature was introduced.

## 13. Security implications

Root Cloudinary credentials are being used temporarily for local Phase 7A verification. Before production/deployment, replace them with a dedicated R&J backend API key with least-privilege upload/delete permissions. QA additionally uses provider resource-read access to verify deletion; the application worker does not need that read API. The old non-root key lacked asset-create permission.

No credentials were rotated automatically, hard-coded, printed or exposed client-side. Cleanup errors store fixed sanitized messages, never provider secrets/signatures. Public settings continue to exclude logoPublicId. All database QA used explicit unique database overrides and exact-name cleanup checks; no production data was used. Successful live operations were not simulated. One browser upload failure response was deliberately injected only for negative-state/retry coverage.

## 14. Files changed during this successful closeout

- client/src/pages/Checkout.jsx
- client/src/services/orderService.js
- server/package.json
- server/src/server.js
- server/src/models/Product.js
- server/src/controllers/orderController.js
- server/src/controllers/adminProductController.js
- server/src/controllers/adminMediaController.js
- server/src/utils/cloudinaryMedia.js
- server/scripts/qa-integration.js
- server/scripts/qa-browser.js
- server/test/validation.test.js
- server/test/README.md
- PHASE7A-CLOSEOUT-FINAL.md
- qa-artifacts/desktop-product.png and qa-artifacts/mobile-home.png (refreshed)

Earlier Phase 7A source changes and the previous bootstrap/diagnostic correction are retained, not claimed as newly introduced here. Files already untracked at the start remain untracked; no commit was made.

## 15. Files created

- server/src/models/MediaCleanupJob.js
- server/src/models/ReservationAttempt.js
- server/src/services/mediaCleanup.js
- server/src/services/orderReservations.js
- server/src/services/recoveryWorker.js
- server/scripts/qa-reliability.js

## 16. Tests added

Nineteen isolated-database reliability tests cover same-key replay/conflict, concurrent duplicates, HTTP receipt replay, interrupted reservation/reconciliation, interruption after order insertion, compensation and interrupted compensation, delayed deduction fencing, concurrent oversell prevention, cancellation retry/concurrency, cleanup creation/idempotency/backoff, expired leases, attached-media protection, stale-save fencing, successful upload followed by an actual injected DB-save failure, arbitrary public-ID rejection, provider-error sanitization, and product/logo cleanup failure recovery. One unit test adds case-insensitive product-ID aggregation. Integration now covers manual inventory SET/INCREASE/DECREASE. Browser QA adds live provider verification, gallery/Shop/logo checks, empty catalogue, checkout and order cancellation/inventory checks.

## 17. Exact lint result

`npm run lint --prefix client`: passed, 0 errors and 0 warnings.

## 18. Exact server test result

`npm test --prefix server`: 17 tests, 17 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo.

`RUN_ISOLATED_QA=1 npm run test:reliability --prefix server`: 19 tests, 19 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo. Total: 36 passing automated server tests across the two suites. Expected injected provider 403 and request 409 logs are not test failures.

## 19. Exact build result

`npm run build --prefix client`: passed with Vite 8.3.0, 2,008 modules transformed, reported build time 2.99 seconds. Main JavaScript: 337.33 kB, 109.51 kB gzip. Server syntax: 55 JavaScript files, 0 failures; subsequently changed recovery/test files were syntax-checked again. `git diff --check` passed.

## 20. Exact integration result

Final `RUN_ISOLATED_QA=1 node scripts/qa-integration.js`: **18 integration checks passed**, exit 0. Includes stock adjustment/reservation/concurrent cancellation, booking/CRM/dashboard regressions and real provider media operations. Temporary QA assets and the isolated database were cleaned.

## 21. Exact browser QA result

Final `RUN_ISOLATED_QA=1 QA_LIVE_MEDIA=1 node scripts/qa-browser.js`: **25 browser checks passed (real Cloudinary)**, exit 0. No unexpected browser console errors or runtime exceptions. The deliberate 502 upload failure is an expected negative test; its retry subsequently uploads through the real provider. Temporary browser QA assets and database were cleaned.

## 22. Exact real Cloudinary result

Both final application suites above used real Cloudinary for all successful product/logo operations. Signed uploads succeeded, HTTPS images rendered, IDs/URLs persisted and provider resource lookups returned 404 after deletion/cleanup. Product image removal, old-logo replacement cleanup and logo removal passed. The initial low-level diagnostic returned HTTP 200 creation and HTTP 200 / ok deletion. No live-provider pass is inferred from a mock.

## 23. Remaining limitations

- Root credentials must be replaced before production; deployment is outside this task.
- Cleanup is eventually consistent and depends on the backend worker running. Provider outages leave retryable jobs; there is no new admin queue dashboard or external alerting.
- Upload cleanup assumes remote completion within the 15-minute grace period. Extremely delayed provider completion after a timeout/grace expiry requires operational inspection.
- Durable idempotency records/product marker arrays are retained and grow; future retention/archival must preserve retry safety. No automatic pruning is safe without a defined retention contract.
- Anonymous deduplication relies on reusing the key. New keys, legacy keyless clients, cleared browser storage or another browser can represent distinct orders. Pending checkout data is stored in tab-scoped sessionStorage; unavailable storage limits reload recovery to the current in-memory page.
- A pending ambiguous checkout blocks silently changing order details until the original attempt is retried. The UI has no separate attempt-history feature.
- Interruption tests inject failures at persistence boundaries; they are not exhaustive hardware/power-loss or prolonged provider-outage certification. Permanent data corruption or administrative deletion of recovery records requires operator intervention.

## 24. Official Phase 7A status

**COMPLETE for the requested local closeout scope.** Real product/logo workflows, durable cleanup, idempotency, reservation recovery/reconciliation, inventory regressions and all stated quality gates passed. No production data was used by QA. Nothing was deployed.

## 25. Recommendation for Phase 7B

Proceed only under a separate user instruction for the planned storefront/UI modernization, preserving these tested backend contracts. Replace temporary Root credentials with the dedicated backend key before any production deployment. Phase 7B has not been started.
