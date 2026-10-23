# Phase 7D ? Real notifications and operational monitoring

Closeout verification: 23 October 2026. Existing Phase 7A/7B/7C architecture retained. No deployment, production migration or credential changes.

## 1. Initial audit

[PHASE7D-AUDIT.md](PHASE7D-AUDIT.md) records the initial read of all nine requested documents and baseline against approved Phase 7C commit `0a13356`. Baseline lint/build/syntax passed; server 23/23, reliability 19/19 and operations 22/22 passed. Browser baseline identified a viewport-layout timing assertion and reproducible initial mobile-sidebar focus failure. These findings are tracked through closeout, not described as passing baseline checks.

## 2. Provider selected

Exactly one real email provider: **Resend**. It supplies HTTPS sending, response message IDs, finite idempotency retention and signed delivery events. No SMTP, SMS or WhatsApp provider was added. Provider setup is documented in [NOTIFICATIONS.md](server/docs/NOTIFICATIONS.md).

## 3. Provider adapter architecture

`notificationTransports.js` selects the unconfigured or Resend adapter. The native-fetch adapter uses a fixed HTTPS endpoint, no redirects, a bounded timeout, immutable sender snapshot and stable generation key. Business controllers remain provider-independent and use the existing operation outbox. The notification worker persists attempt evidence, projects job state with version/lease fencing, and recovers interrupted projections without resending.

## 4. Required environment variables

`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`; optional `EMAIL_REPLY_TO` and `EMAIL_TIMEOUT_MS` (default 15000). Signed status evidence requires `RESEND_WEBHOOK_SECRET`. Live QA separately requires `EMAIL_QA_RECIPIENTS`, `EMAIL_QA_SENDER_VERIFIED=true` and process opt-in `RUN_LIVE_EMAIL_QA=1`. All names are documented in [server/.env.example](server/.env.example), except the command-only opt-in documented in the QA guide. No real values were written or printed.

## 5. Sender/domain configuration

Sender identity comes only from server configuration. BusinessSettings supply customer-facing contacts in content; customers cannot choose From. Sender name rejects header control characters; sender and reply addresses are validated. Resend's required domain DNS verification remains an operator task. No claim is made that a real sender/domain was verified. [Provider setup](https://resend.com/docs/dashboard/domains/introduction)

## 6. Email template improvements

All 12 existing events now have branded responsive HTML and useful plain text: six order events and six service events. Each includes its RJ-ORD/RJ-SVC reference, clear status, explanation, next step, configured business contacts, optional WhatsApp link, address and footer. Pending requests explicitly avoid confirmed appointment/delivery language. Dynamic HTML is escaped; internal notes and private staff information are not template inputs. All 12 pairs were generated and 24 browser renders checked at 320/600 px. Representative mobile service-request and desktop collection previews were visually inspected.

## 7. Notification status semantics

Queued (`pending`), processing, retrying, accepted, delivered, failed, bounced and complained are separate states. `simulated` remains explicitly QA-only. Legacy `sent` reads as accepted. Accepted means provider acceptance for delivery; delivered requires a signed event confirming recipient-mail-server acceptance. Inbox placement and reading are never asserted. [Resend event semantics](https://resend.com/docs/webhooks/event-types)

## 8. Provider-message tracking

Jobs and controlled attempts retain provider, provider message ID, acceptance/delivery/bounce/complaint timestamps, latest provider event/status, failure category, safe error, uncertainty and safe retry deadline. Unique provider/message-ID and job/generation indexes protect trusted mappings. Attempt history survives manual retry. Older generations cannot replace current job evidence.

## 9. Webhook architecture/security

`POST /api/v1/webhooks/resend` uses a 128 KB raw JSON body, independent 600/minute/IP limiter and Svix signature/timestamp verification before JSON/schema parsing. It needs no Admin cookie. Invalid/missing signatures return 401, invalid signed payloads 400, unavailable processing 503; 202 acknowledges durable receipt only. Verified IDs/types/times are retained; entire payloads, addresses, subject and provider reason text are discarded. Duplicate event IDs and audit IDs are unique. Early/unknown IDs wait for trusted send-response mapping; out-of-order evidence is monotonic. Minimal receipt records expire after 30 days. [Verification contract](https://resend.com/docs/webhooks/verify-webhooks-requests)

## 10. Retry/failure behavior

429, temporary 5xx, timeout and network errors retry with durable backoff. Configuration/authentication/sender/recipient rejection stops automatic looping. Five attempts exhaust a cycle. The existing two-minute leases, 30-second deadline and stale-worker fencing remain. Bounce/complaint/suppression block later automatic mail to that normalized recipient.

Resend retains keys for 24 hours; a persisted conservative 23-hour replay window prevents uncertain resends after retention expires. Automatic retry keeps the same key, body and sender. Manual retry uses only stored trusted data: a definitive failure starts a new controlled generation; an uncertain result within its window replays the same key. Uncertain expired outcomes require provider reconciliation. At most 25 manual retries are allowed. [Idempotency limits](https://resend.com/docs/dashboard/emails/idempotency-keys)

## 11. Admin notification center

Added channel, record type, event/template, status, queued-date range, reference and recipient filters, newest/oldest order and 25-item pagination. Results show safe status, timeline, retry counts, error and prior controlled attempts. Eligible retries use an empty request body; related-record links and explicit refresh are present. No email HTML, provider secret, signature, lease token or raw webhook content is returned.

## 12. Order/booking notification history

Both detail panels use the same explicit status/timeline and attempt history, with refresh and eligible retry. Empty history explains ?No email recipient available? and retains manual contact links. Optional email remains optional; invalid addresses are rejected by existing request validation and cannot generate valid send jobs. Later signed events appear after refresh.

## 13. Dashboard monitoring

Current queued, retrying, failed, bounced and complaint counts link directly to filters. Recent problems and worker timestamps are visible. Fixed rules flag incomplete configuration, missing webhook setup, at least three sender/authentication/configuration failures in 15 minutes, at least five failed attempts per hour, and overdue work without progress for 15 minutes. No external alerting service, machine learning or inbox-success vanity metrics were introduced.

## 14. Audit behavior

Durable lifecycle activity records job creation, acceptance, signed delivery/bounce/complaint/failure, retry failure and authenticated manual retry. Unique event keys prevent duplicate webhook activity. Job outboxes retain events through ActivityLog interruption. Metadata contains operational IDs/template/provider/generation/failure category, not bodies, notes, recipients, headers or secrets.

## 15. Privacy/security review

Notification routes/history/health remain behind active Admin authentication. Public order and booking receipts retain explicit projections. Full recipients are visible only to authorized administrators. Sender snapshots and idempotency keys are excluded from API summaries. Raw provider diagnostics are mapped to fixed errors. Development request logging excludes query strings so recipient searches do not enter access logs. Raw verified webhook content is never retained. Automatic QA explicitly disables external email, even when local configuration later enables it.

## 16. Provider-degraded behavior

Real order/booking API requests and stock deductions were verified with delivery unconfigured. Business mutations succeed independently and jobs fail visibly. Transient jobs remain durable for eligible retry. Existing stock reservations, cancellation restoration, media cleanup, staff assignments, notes and activity history continue to pass regression tests.

## 17. API changes

- Added signed raw-body `POST /api/v1/webhooks/resend`.
- Added Admin-only `GET /api/v1/admin/operations/notifications/health`.
- Expanded notification GET filters and safe attempt summaries.
- Kept retry POST empty-body-only; responses now use an explicit safe summary.
- Added dashboard health information and richer existing detail history.

No new public customer account, checkout payment, staff-login or automated contact-provider endpoint was introduced.

## 18. Schema changes

NotificationJob adds provider evidence, generation, projection version, retry-window/uncertainty fields, reference, immutable HTML/text content and lifecycle outbox. NotificationAttempt stores immutable generation/provider/sender/key/recipient hash plus evidence and recovery flag. NotificationWebhookEvent stores minimal signed evidence with deduplication and 30-day TTL. NotificationWorkerState stores safe heartbeat/error information. Existing activity metadata allowlist adds notification identifiers and failure categories. Startup initializes new indexes; old jobs remain readable without fabricated evidence.

## 19. Files changed

- `client/src/components/admin/OperationDetails.jsx`
- `client/src/components/admin/OperationsUI.jsx`
- `client/src/hooks/useModalFocus.js`
- `client/src/index.css`
- `client/src/pages/admin/AdminDashboard.jsx`
- `client/src/pages/admin/AdminNotifications.jsx`
- `server/docs/OPERATIONS.md`
- `server/package-lock.json`
- `server/package.json`
- `server/scripts/qa-browser.js`
- `server/scripts/qa-integration.js`
- `server/scripts/qa-operations-browser.js`
- `server/scripts/qa-operations.js`
- `server/scripts/qa-reliability.js`
- `server/scripts/qa-storefront.js`
- `server/src/app.js`
- `server/src/controllers/adminDashboardController.js`
- `server/src/models/NotificationJob.js`
- `server/src/models/operationsFields.js`
- `server/src/routes/adminOperationsRoutes.js`
- `server/src/server.js`
- `server/src/services/notificationTemplates.js`
- `server/src/services/notificationTransports.js`
- `server/src/services/notifications.js`
- `server/src/services/operationEvents.js`
- `server/src/services/operationsOutbox.js`
- `server/src/services/recoveryWorker.js`
- `server/test/README.md`
- `server/test/operations.test.js`

QA screenshots from existing storefront/admin/media runners were refreshed under `qa-artifacts/`; these are test outputs rather than application source changes. Failed-run captures are diagnostic artifacts, not passing screenshots.

## 20. Files created

- `PHASE7D-AUDIT.md`
- `client/src/components/admin/NotificationMonitoring.jsx`
- `client/src/utils/notifications.js`
- `server/.env.example`
- `server/docs/NOTIFICATIONS.md`
- `server/scripts/qa-email-preview.js`
- `server/scripts/qa-live-email.js`
- `server/scripts/qa-notifications.js`
- `server/src/models/NotificationAttempt.js`
- `server/src/models/NotificationWebhookEvent.js`
- `server/src/models/NotificationWorkerState.js`
- `server/src/routes/notificationWebhookRoutes.js`
- `server/src/services/emailConfiguration.js`
- `server/src/services/notificationAttempts.js`
- `server/src/services/notificationAudit.js`
- `server/src/services/notificationDelivery.js`
- `server/src/services/notificationErrors.js`
- `server/src/services/notificationReads.js`
- `server/src/services/notificationState.js`
- `server/src/services/notificationWebhooks.js`
- `server/src/services/resendTransport.js`
- `server/test/notifications.test.js`
- `PHASE7D-REPORT.md`

Also created `qa-artifacts/phase7d/emails/`: 12 HTML previews, 12 text alternatives and 24 screenshots (no customer data or credentials).

## 21. Tests added

15 additional no-database tests (38 total), 17 isolated notification integration groups, 4 added admin-browser functional groups, and the 12-template/24-render preview runner. Coverage includes provider acceptance/ID/classification/timeout, signed webhook validation/deduplication/order/unknown IDs, delivery/bounce/complaint/suppression, safe replay windows, fresh versus uncertain manual retry, body/sender immutability, stale projections, crash/audit recovery, filters/pagination/health/privacy and degraded order/booking/stock behavior. Existing operations tests retain expired lease, stale worker and exhaustion coverage. No real customer email is sent.

## 22. Exact lint result

`npm run lint --prefix client`: exit 0, no errors or warnings, after the final mobile-focus correction.

## 23. Exact server test result

`npm test --prefix server`: **38 tests, 38 passed, 0 failed, 0 skipped, 0 cancelled**, duration **12161.4988 ms**, exit 0. Server syntax validation: **91 JavaScript files, 0 failures** (temporary diagnostic excluded).

## 24. Exact reliability result

`RUN_ISOLATED_QA=1 npm run test:reliability`: **19 tests, 19 passed, 0 failed, 0 skipped, 0 cancelled**, duration **15855.7831 ms**, exit 0. Injected provider failure logs are expected test evidence. Disposable database cleanup succeeded.

## 25. Exact build result

`npm run build --prefix client`: exit 0; **Vite 8.3.0, 2010 modules, 7.17 s**. Main JS **341.81 kB / 111.22 kB gzip**; CSS **57.94 kB / 11.79 kB gzip**. Includes the final mobile-focus correction. Built locally only.

## 26. Exact integration result

| Suite | Final completed result |
| --- | --- |
| Operations | 22/22 passed, 0 failed; 18022.775 ms; exit 0. |
| Notifications/provider | 17/17 passed, 0 failed; 3015.4899 ms; exit 0. Injected HTTP only. |
| General integration with live media | 18/18 checks passed; exit 0. Real Cloudinary upload, delivery, reorder/deletion and logo replacement/removal passed. |

All runners confirmed cleanup of their exact isolated databases. Live media used the established process-only IPv4 preference; Cloudinary application code and credentials were unchanged.

## 27. Exact browser QA result

- Storefront: 26 checks passed, including 70 width checks across ten routes; no unexpected console errors; isolated DB cleaned. Final rerun after shared focus correction pending.
- Operations: **24 checks passed**, including **70 responsive width checks**, initial focus, containment and Escape restoration; no unexpected console errors; isolated DB cleaned. The baseline focus failure is fixed.
- Real media: 25 checks passed using real Cloudinary; expected injected upload failure tested retry UX, no unexpected errors; DB/test assets cleaned. Final shared-focus regression passed.
- Email previews: all 12 HTML/text pairs and 24 renders passed with no overflow or browser exceptions; sample screenshots visually reviewed.

Two simultaneous final runs initially timed out during cold Vite startup before functional checks began. Their initial navigation timeout now allows 60 seconds; interaction assertions remain at 15 seconds. Final browser runs are sequential.

Browser matrix: 320, 375, 390, 430, 768, 1024, 1440 px, headless installed Edge. This is not cross-browser or email-client certification.

## 28. Live provider QA result

**BLOCKED.** Safe preflight found incomplete provider/sender configuration, no local verification declaration, no explicit developer/test recipients and no process opt-in. **0 external email messages sent.** Live acceptance, inbox rendering and external webhook connectivity are unverified. Adapter and signed fixtures passing do not substitute for this evidence. No credentials were requested in chat, edited or exposed.

## 29. Known limitations

Live sender/DNS/provider configuration and inbound webhook reachability are not established. Delivery means recipient-server acceptance, not guaranteed inbox placement or reading. Unknown webhook evidence expires after 30 days; an archive/reconciliation UI and suppression removal are outside this phase. Uncertain outcomes beyond the provider replay window intentionally require human reconciliation. Admin status updates require Refresh. Job/attempt/audit retention remains an operator responsibility. Browser verification covers Edge and local HTML rendering, not all email clients.

Temporary Root Cloudinary credentials remain local-only and must be replaced with a dedicated least-privilege R&J backend key before future deployment. Nothing rotates credentials automatically. No deployment, accounts, online payments, quotes/invoices, returns/refunds, staff login or paid SMS/WhatsApp integration was added.

## 30. Phase status

**INCOMPLETE ? final mobile-focus/browser verification is in progress.** Live external email remains BLOCKED independently of local verification. This report will be updated only after the remaining checks pass.

## 31. Recommendation for Phase 7E

After approval of Phase 7D, scope a separate operational readiness phase: establish verified sender/DNS and developer-only live inbox/webhook evidence, provision the dedicated Cloudinary key, review backups/retention, and document incident/reconciliation procedures. Any production deployment or new commercial/account feature needs separate authorization. **Phase 7E has not started. Nothing is deployed.**
