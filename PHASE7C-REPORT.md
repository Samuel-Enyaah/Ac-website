# Phase 7C completion report

Completed 21 October 2026. Phase 7C extends the existing R&J AC ACCESSARIES COM. LTD application with staff assignment, explicit operational workflows, durable activity, internal notes, booking retry protection and notification infrastructure. Nothing was deployed. Phase 7D has not started.

## 1. Initial audit

Read PHASE7A-AUDIT.md, PHASE7A-REPORT.md, PHASE7A-CLOSEOUT-FINAL.md, PHASE7B-AUDIT.md, PHASE7B-REPORT.md and server/test/README.md before implementation. Inspected the existing admin screens, authentication, order and booking controllers/models, CRM aggregation, stock reservation/cancellation recovery, media cleanup, background worker and public booking flow. Findings and pre-change results are in [PHASE7C-AUDIT.md](PHASE7C-AUDIT.md).

The baseline passed: client lint; 17 server tests; 56 server syntax checks; 19 isolated reliability tests; 18 integration checks using real Cloudinary; and the Vite build (2004 modules, 2.94 seconds, main JS 337.98 kB / 109.92 kB gzip). No email provider was configured. MongoDB is standalone, so the implementation uses atomic document writes and recoverable projections rather than requiring transactions. Existing Phase 7A/7B changes were retained.

## 2. Service booking idempotency

`POST /api/v1/service-bookings` accepts an optional `Idempotency-Key`. The frontend generates a UUID; the backend stores its SHA-256 hash, a canonical normalized request hash and an immutable successful receipt on the booking itself. A partial unique index prevents concurrent duplicate inserts. The creation event is included in the same atomic insertion.

Same key and equivalent details return the original HTTP 201 receipt and RJ-SVC reference. Materially different details return 409. Replays preserve the original receipt after status changes and after the preferred date passes. Callers without a key remain compatible, but independent keyless submissions cannot be deduplicated.

The public form retains the exact key and payload in `sessionStorage` under `rj-service-attempt` after ambiguous failures. Reload restores and locks those details, including when the URL requests a different service. Retry resends the stored request. A successful receipt or definitive 400 clears the attempt; a conflict or transient failure retains it. Browser QA discarded a real successful response, reloaded and retried, then verified one booking existed.

## 3. Staff model/architecture

A separate `Staff` collection stores name, phone, email, role, active state, skills, optional directory notes and timestamps. Roles are Administrator, Operations, Technician and Customer Support. These are assignment roles; creating a Staff record never creates an Admin account or grants login access. Existing active Admin authentication protects all staff administration.

Deactivation replaces deletion. The API has no staff deletion endpoint. A partial PATCH changes only explicitly supplied fields, preventing contact edits from resetting skills or reactivating inactive staff. This edge case has an integration regression assertion.

## 4. Assignment workflow

Orders have an operational owner; service bookings have a real assigned staff record. Assignment captures the staff ID, name, role, timestamp, assigning admin, prior assignee and optional internal note. Reassignment adds history rather than overwriting it. Historical snapshots remain readable after staff deactivation or profile edits.

An atomic active-staff claim validates eligibility. Deactivation serialized before the claim blocks the assignment; a deactivation overlapping afterward preserves the accepted historical assignment. Version checks protect concurrent record updates. Terminal orders/bookings cannot be reassigned. Assignment does not alter customer contact details, requested schedule or workflow status automatically.

## 5. Order status workflow

| Fulfillment | Forward path |
| --- | --- |
| Pickup | pending → confirmed → processing → ready → delivered |
| Delivery | pending → confirmed → processing → ready → out-for-delivery → delivered |

Cancellation is allowed before delivery. Delivered and cancelled states cannot be reopened. Invalid transitions return useful 400 errors; conflicting concurrent updates return 409. Existing payment status remains an administrative record and does not charge or refund money.

Cancellation retains Phase 7A's per-product restoration markers and retry/recovery behavior. A cancelled record with unfinished restoration can be saved again to resume safely. Restoration completion/retry activity is recorded without replacing the stock safety mechanism. Integration and reliability checks confirm exact restoration under concurrency and interruption.

## 6. Booking status workflow

The forward path is pending → confirmed → technician-assigned → in-progress → completed. A real staff assignment is required before technician-assigned or in-progress. Cancellation is available before completion; completed and cancelled are terminal. Skipping steps and reopening terminal records are rejected.

Legacy bookings marked technician-assigned without an actual staff record must receive an assignment before advancing. A preferred appointment remains a customer request until the administrator confirms arrangements. Assignment and status progression are explicit separate actions.

## 7. Internal notes

Orders and bookings support append-only internal notes with text, authenticated author ID/name and timestamp. The server derives authors from the Admin session and rejects client-supplied author overrides. Optional UUID note IDs deduplicate ambiguous retries and reject reuse for different content. Notes allow 1–2000 characters, with a limit of 500 notes per record.

There are no note edit/delete routes. Customer-provided notes remain visibly separate. Internal notes are excluded from public receipts and notification templates. Customer follow-up uses notes on the related order or booking, linked from CRM activity, rather than creating a second customer record system.

## 8. Audit/activity architecture

Each meaningful mutation writes an `eventOutbox` entry atomically with the business change. An idempotent projector creates an `ActivityLog` and any notification job using unique event keys. It removes the outbox entry only after both projections persist. A crash between projections is recoverable; concurrent replay cannot duplicate either record.

Activity includes entity type/ID, event ID, action, actor type/ID/name, readable summary, timestamp and allowlisted operational metadata. Coverage includes creation, status/payment changes, assignment/reassignment, cancellation, completion, stock restoration, note creation, staff changes and meaningful settings changes. Metadata records changed field names rather than settings values, and note IDs rather than note bodies. Detail pages display the latest 100 activity entries. No historical backfill is claimed.

## 9. Notification architecture

`NotificationJob` provides durable event identity, channel, template, trusted recipient, entity identity, rendered payload, status, attempts, retry schedule, safe error and completion timestamps. Unique event keys suppress duplicate jobs. Controllers express business events; templates and delivery adapters remain separate services.

No email provider is configured. Normal execution therefore records a visible, sanitized unconfigured failure and sends no message. An explicitly injected test transport records `simulated`, never `sent`. WhatsApp/SMS remain channel concepts with manual customer links; no paid provider integration was invented. Opening any contact link never marks a job as delivered.

The adapter contract and future sender/domain, credential, idempotency and delivery-reconciliation requirements are documented in [server/docs/OPERATIONS.md](server/docs/OPERATIONS.md). No provider secret or `.env` value was added or changed.

## 10. Notification worker/retry behavior

The existing non-overlapping recovery worker additionally projects pending operations and processes up to 20 notifications per pass. It retains reservation, cancellation and media recovery. Each notification claim gets a unique lease token and a two-minute lease measured at that claim, with a 30-second transport deadline. Completion is fenced by the token; stale workers cannot overwrite a new owner.

Transient failures retry from 30 seconds with exponential backoff capped at 24 hours. Five attempts are allowed per cycle; permanent failures, exhausted cycles and interrupted final attempts become visibly failed. Expired leases are reclaimable. Authorized manual retry accepts an empty body, reads the stored recipient/event/payload, resets the cycle count, preserves lifetime attempts and records the requesting admin.

Adapters must support durable idempotency for the stable event key. Database leasing alone cannot guarantee exactly-once external delivery. `sent` means confirmed provider acceptance, not verified inbox delivery. Explicit simulations remain labeled as simulations and have no sent timestamp. The acceptance-state test uses an injected stub and does not send external email.

## 11. Customer notification templates/events

| Entity | Templates |
| --- | --- |
| Order | Received, confirmed, ready for pickup, out for delivery, delivered, cancelled |
| Booking | Request received, confirmed, staff assigned, in progress, completed, cancelled |

All 12 templates use the actual RJ-ORD/RJ-SVC reference and a snapshot of BusinessSettings name, phone, email, WhatsApp and address at projection time. Pending messages explicitly avoid promising a confirmed appointment or delivery. Pickup-ready is emitted only for pickup orders. Staff-assigned communication occurs at the explicit technician-assigned workflow step. Email jobs require an email address on the original request. Internal notes and assignment notes never enter templates.

## 12. Dashboard improvements

Daily work cards link directly to orders awaiting confirmation, actionable orders, service requests awaiting confirmation, unassigned bookings, services in progress, low stock and failed notifications. Recent orders/bookings, recent operational activity and notification failures provide direct links to the relevant records.

Counts use database queries; recent activity and failure lists are bounded. Existing paid-revenue context remains, labeled as a recorded payment total rather than a provider balance. Low-stock navigation includes active products with zero through five units.

## 13. Order management improvements

Orders support search, workflow/payment/assignee filters, unassigned work, newest/oldest order and dashboard action context. Selecting a new status filter clears incompatible dashboard action context. List cards show reference, customer, status, assignee, latest activity and the next action.

Details retain customer, products, prices/totals, fulfillment, installation and payment data, with assignment/history, append-only notes, activity and notification history added. Status/payment changes use a consequence confirmation dialog. Cancellation explains stock restoration/retry. Customer CRM, phone, email, WhatsApp and SMS links support manual follow-up.

## 14. Booking management improvements

Booking lists include customer, service, preferred date, status, assigned staff and latest activity, with search/status/service/assignee/sort filters. Details retain AC information, units, requirements, requested schedule and location while adding assignment history, explicit valid transitions, notes, audit and notification status/retry.

The UI identifies the next workflow action and distinguishes a requested schedule from an agreed appointment. Inactive historical staff remain visible. Completed/cancelled work cannot be reopened or reassigned through the controls.

## 15. Staff management UI

Added `/admin/staff`, `/admin/staff/new` and `/admin/staff/:staffId`, plus sidebar navigation. Administrators can search and filter by role, skill and active state; create/edit records; deactivate/reactivate with confirmation; and review staff activity. The UI explicitly explains that these records do not grant admin login. No payroll, public employee profiles or destructive deletion was added.

## 16. CRM improvements

The existing normalized-phone aggregation remains the customer source; no Customer collection was introduced. Related orders/bookings retain links and gain operational context. Customer detail displays recent cross-record activity, including links to the record containing any internal follow-up note. Latest order/service activity and assignee information are available from the aggregation. The customer header and content grid were corrected for narrow mobile widths.

## 17. Privacy/security review

All new operational/staff routes require the existing active Admin session. Staff assignment roles do not authorize requests. Staff writes have a 30/minute limit; assignment, notes and notification retry mutations have a 60/minute limit, in addition to existing global API limits. Browser QA kept those limits enabled.

Public order/booking receipts remain explicit projections without internal notes, assignments, activity, jobs or idempotency hashes. Public settings remain allowlisted. Audit metadata excludes credentials, request bodies, customer contacts and internal note text. Notification errors use fixed safe messages rather than raw provider responses. No API key, secret, signature, authorization token or real customer data was printed or placed in this report. Test data uses isolated databases and non-deliverable example.invalid addresses.

The existing not-found fallback now returns a safe 404 instead of falling through as a 500. Validation, identifier checks, field allowlists and version checks protect new writes. Retry endpoints reject arbitrary recipient/payload overrides. No production database, deployment, credentials, customer authentication or payment provider was changed.

## 18. Accessibility/responsive improvements

Operational pages use the existing navy/blue visual language with consistent panels, status badges, timelines, labeled forms, loading/error/empty states and retry controls. New form labels use explicit associations, including selects. Buttons and inputs have 44-pixel minimum targets and visible focus. Confirmation dialogs and mobile navigation retain focus containment, Escape dismissal and focus restoration.

Ten admin screens passed at 320, 375, 390, 430, 768, 1024 and 1440 pixels: dashboard, orders, order detail, bookings, booking detail, staff list, staff detail, notifications, customer detail and inventory. Checks assert one main/primary heading, relevant control sizes and no horizontal page overflow. A real 320-pixel CRM overflow was corrected with a shrinkable grid/header. Representative desktop and mobile screenshots were visually inspected. This is targeted accessibility coverage, not a full WCAG certification.

## 19. API contract changes

Full inputs and semantics are in [server/docs/OPERATIONS.md](server/docs/OPERATIONS.md). Additions under `/api/v1/admin` are:

| Method/path | Purpose |
| --- | --- |
| GET/POST `/staff` | Filter/list or create staff records |
| GET/PATCH `/staff/:staffId` | Read staff/activity or update allowed directory fields |
| POST `/operations/orders/:id/assignment` | Assign/reassign an active staff owner |
| POST `/operations/bookings/:id/assignment` | Assign/reassign active service staff |
| POST `/operations/orders/:id/notes` | Append an authenticated internal note |
| POST `/operations/bookings/:id/notes` | Append an authenticated internal note |
| GET `/operations/notifications` | Paginated notification status list |
| POST `/operations/notifications/:id/retry` | Retry a failed job using stored trusted information |

Existing order/booking PATCH routes enforce the documented workflow graph. Detail responses add allowed transitions, assignments/history, internal notes, recent activity and notification summaries. Lists add assignee and newest/oldest filters; order lists accept `work=action`. Product lists accept `stock=attention` for operational low-stock navigation. Anonymous booking POST gains optional idempotency without requiring an account. Existing public receipt shapes and RJ references remain intact.

## 20. Database/schema changes

Added Staff, ActivityLog and NotificationJob collections. Order and ServiceBooking gain assignment snapshots, internal notes, latest activity and an excluded-by-default pending event outbox. ServiceBooking additionally gains immutable, excluded-by-default key hash, request hash and receipt with a partial unique key index. BusinessSettings gains an excluded-by-default event outbox.

Activity event IDs and notification event keys are unique. Entity/history, status/date, assignee and due-job indexes support operational reads and workers. Startup initializes critical new indexes before accepting requests. Existing reservation attempts, stock markers, media jobs, order idempotency and authentication collections remain in use. No destructive migration, transaction dependency, TTL deletion or history purge was introduced.

## 21. Files changed

The following list is specific to Phase 7C, compared with hashes captured before implementation. The workspace already contained Phase 7A/7B changes; those are not attributed to this phase.

32 existing files changed:

- `client/src/index.css`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/pages/BookService.jsx`
- `client/src/pages/admin/AdminBookingDetails.jsx`
- `client/src/pages/admin/AdminBookings.jsx`
- `client/src/pages/admin/AdminCustomerDetails.jsx`
- `client/src/pages/admin/AdminDashboard.jsx`
- `client/src/pages/admin/AdminInventory.jsx`
- `client/src/pages/admin/AdminOrderDetails.jsx`
- `client/src/pages/admin/AdminOrders.jsx`
- `client/src/routes/AppRoutes.jsx`
- `client/src/services/serviceBookingService.js`
- `server/scripts/qa-browser.js`
- `server/scripts/qa-storefront.js`
- `server/src/app.js`
- `server/src/controllers/adminCustomerController.js`
- `server/src/controllers/adminDashboardController.js`
- `server/src/controllers/adminOrderController.js`
- `server/src/controllers/adminProductController.js`
- `server/src/controllers/adminServiceBookingController.js`
- `server/src/controllers/adminSettingsController.js`
- `server/src/controllers/orderController.js`
- `server/src/controllers/serviceBookingController.js`
- `server/src/middleware/errorHandler.js`
- `server/src/middleware/notFound.js`
- `server/src/models/BusinessSettings.js`
- `server/src/models/Order.js`
- `server/src/models/ServiceBooking.js`
- `server/src/server.js`
- `server/src/services/orderReservations.js`
- `server/src/services/recoveryWorker.js`
- `server/test/README.md`

## 22. Files created

28 source, test and documentation files created:

- `PHASE7C-AUDIT.md`
- `PHASE7C-REPORT.md`
- `client/src/components/admin/OperationDetails.jsx`
- `client/src/components/admin/OperationList.jsx`
- `client/src/components/admin/OperationsUI.jsx`
- `client/src/hooks/useAdminResource.js`
- `client/src/pages/admin/AdminNotifications.jsx`
- `client/src/pages/admin/AdminStaff.jsx`
- `client/src/utils/operations.js`
- `server/docs/OPERATIONS.md`
- `server/scripts/qa-operations-browser.js`
- `server/scripts/qa-operations.js`
- `server/src/controllers/adminStaffController.js`
- `server/src/models/ActivityLog.js`
- `server/src/models/NotificationJob.js`
- `server/src/models/Staff.js`
- `server/src/models/operationsFields.js`
- `server/src/routes/adminOperationsRoutes.js`
- `server/src/routes/adminStaffRoutes.js`
- `server/src/services/bookingRequests.js`
- `server/src/services/notificationTemplates.js`
- `server/src/services/notificationTransports.js`
- `server/src/services/notifications.js`
- `server/src/services/operationEvents.js`
- `server/src/services/operationWorkflows.js`
- `server/src/services/operations.js`
- `server/src/services/operationsOutbox.js`
- `server/test/operations.test.js`

Additional QA artifacts: `qa-artifacts/phase7c-baseline-files.json`, `qa-artifacts/phase7c-file-manifest.json`, and 30 successful admin screenshots in `qa-artifacts/phase7c/` (ten screens at 320, 390 and 1440 pixels). Existing storefront and media screenshot artifacts were refreshed during their regression runs.

## 23. Files removed

None. No application files, historical staff records, production data or existing tests were removed.

## 24. Tests added

Added six no-database tests covering order/booking workflow graphs, safe audit metadata, all templates, error sanitization and explicit transport behavior. Added 22 isolated operations integration tests covering booking concurrency/canonical replay/conflicts/date replay/keyless callers, authentication, staff PATCH semantics, assignment/deactivation/history, complete workflows, exact cancellation restoration, append-only notes, activity privacy, outbox interruption, job deduplication, simulation/acceptance, failure/backoff/retry, recipient protection, attempt limits, lease recovery/fencing, settings activity and dashboard/CRM context.

Added 20 admin browser checks, including 70 responsive cases. Extended the public storefront suite with lost-booking-response/reload retry, and updated real-media cancellation to use the new confirmation dialog. Browser runners use separate temporary Vite caches, isolated API origins and bounded readiness checks. These harness changes avoid dependency-cache collisions and measure layouts after the responsive breakpoint has applied; application rate limits remain enabled.

## 25. Exact lint result

`npm run lint --prefix client`: exit **0**, ESLint completed with **0 errors and 0 warnings** on the final implementation.

`git diff --check`: exit **0**, no whitespace errors. Existing Windows line-ending notices do not represent check failures.

## 26. Exact server test result

`npm test --prefix server`: exit **0**. Node test runner reported **23 tests, 23 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo**; duration **7239.9143 ms** in the final run.

Server syntax validation: `node --check` passed for **74 JavaScript files** across `server/src`, `server/scripts` and `server/test`, with **0 failures**.

## 27. Exact reliability result

With `RUN_ISOLATED_QA=1`, `npm run test:reliability --prefix server`: exit **0**, **19 passed, 0 failed**; recorded duration **7564.8839 ms**. This covers real MongoDB concurrency and stock/reservation/cancellation/media recovery while deliberately injecting provider failures. Its database was isolated and cleaned. Live Cloudinary verification is reported separately below.

## 28. Exact build result

`npm run build --prefix client`: exit **0**. **Vite 8.3.0**, **2008 modules transformed**, built in **4.18 seconds**, with no build errors or warnings.

| Final output | Size | Gzip |
| --- | ---: | ---: |
| Main JS (`index-C8rTpyk-.js`) | 341.51 kB | 111.10 kB |
| CSS (`index-DmXUL9Yq.css`) | 57.83 kB | 11.76 kB |
| Shared operation details | 11.98 kB | 3.78 kB |
| Staff screen | 6.75 kB | 2.26 kB |
| Notifications screen | 2.22 kB | 0.95 kB |

The build retains lazy admin page chunks. Build output is local only.

## 29. Exact integration result

| Suite | Result |
| --- | --- |
| `RUN_ISOLATED_QA=1 node scripts/qa-operations.js` | Exit 0; **22 passed, 0 failed**; latest recorded Node duration **1423.933 ms** |
| `RUN_ISOLATED_QA=1 node scripts/qa-integration.js` with live media enabled | Exit 0; **18 integration checks passed**, including real Cloudinary upload, deliverable images, replacement/removal and cleanup |

Operations integration exercised the actual application API and MongoDB. Notification transports were explicitly injected test doubles, including an acceptance-contract stub; no customer email/SMS/WhatsApp was sent. Real-media integration used actual Cloudinary. Temporary test assets were deleted and each explicitly named isolated database was cleaned. No production data was used.

## 30. Exact browser QA result

| Suite | Result |
| --- | --- |
| `qa-operations-browser.js` | Exit 0; **20 checks passed**, including **70 responsive width checks** across ten admin screens; **0 unexpected console errors or runtime exceptions** |
| `qa-storefront.js` | Exit 0; **26 checks passed**, including **70 responsive width checks**, checkout recovery and lost-response booking retry |
| `qa-browser.js` with `QA_LIVE_MEDIA=1` | Exit 0; **25 checks passed** using real Cloudinary, including product images, logo replacement/removal, storefront/cart/checkout and cancellation inventory |

All browser runners use installed headless Edge with the existing temporary Playwright installation, unique disposable databases, localhost API guards and separate temporary Vite caches. All completed with database/cache cleanup. The real-media runner's deliberately injected failed upload is expected and tested; successful media operations are real. Its established local process option was `NODE_OPTIONS=--dns-result-order=ipv4first`; no application networking configuration was changed.

The final operations run passed the customer and inventory checks after the narrow-width CRM fix. Representative order/customer mobile, staff mobile, dashboard desktop and booking desktop screenshots were reviewed. Earlier failed test attempts were resolved before this completion result.

## 31. Known limitations

- Email delivery is not active because no provider is configured. The queue, failures, templates, retry and adapter boundary are implemented and verified; simulations are not external deliveries. Provider selection, verified sender/DNS, credentials and a proven idempotency/reconciliation contract are required before activation. Delivery/bounce webhooks and inbox confirmation are not implemented.
- Staff records support assignment only. Non-admin staff authentication and granular authorization remain future work. All operational access currently requires an active Admin.
- Activity is prospective; pre-Phase-7C actions have no fabricated backfill. Detail views show the latest 100 activity/notification entries. Embedded note/assignment histories are capped at 500 each. Larger archive/search and retention policy need future design.
- Staff selectors show up to 100 active search results. CRM preserves the existing dynamic, in-memory aggregation approach, which will need reassessment for substantially larger datasets.
- Browser storage restrictions reduce pending booking recovery to memory during the current page lifetime. Keyless callers cannot gain duplicate protection. Users should locate an existing ambiguous request before starting another.
- External exactly-once delivery depends on provider guarantees, not leases alone. A future adapter must not claim durable idempotency without evidence. Provider acceptance is not proof of inbox delivery.
- Verification used headless Edge and targeted keyboard/responsive checks, not all browsers/devices or a complete WCAG audit.
- Standalone MongoDB remains supported. Recovery is asynchronous and relies on retained idempotency/stock/event markers. There is no automated archive or TTL purge.
- Temporary Root Cloudinary credentials remain local and were not rotated. They must be replaced with an appropriate dedicated backend key before any future deployment. No deployment or production credential change occurred.

## 32. Recommendation for Phase 7D

After explicit approval, prioritize selecting and configuring a real notification provider with a verified sender, durable idempotency or reconciliation, delivery/bounce visibility and operational monitoring. Agree business requirements before adding staff login or granular permissions. Reassess history retention and CRM/query scale against actual usage.

Phase 7D has not started. Customer accounts, online payments, quotes/invoices, returns/refunds and production deployment were not added. Phase 7C is complete and work stops here for review and approval.
