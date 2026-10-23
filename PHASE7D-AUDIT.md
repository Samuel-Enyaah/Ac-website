# Phase 7D initial audit

Recorded 21 October 2026 before application edits, against commit `0a13356` (approved Phase 7C). Read the Phase 7A audit/report/final closeout, Phase 7B audit/report, Phase 7C audit/report, server/docs/OPERATIONS.md and server/test/README.md. No deployment or credential changes.

## Fresh baseline

- Lint: exit 0, no diagnostics.
- Server tests: 23 passed, 0 failed; 44802.533 ms in this run.
- Build: exit 0, Vite 8.3.0, 2008 modules, 4.88 seconds; main JS 341.51 kB / 111.10 kB gzip; CSS 57.83 kB / 11.76 kB gzip.
- Syntax: 74 server JavaScript files passed.
- Isolated reliability: 19 passed, 0 failed; 25759.3223 ms.
- Isolated operations integration: 22 passed, 0 failed; 11359.9529 ms; database cleaned.
- Storefront browser baseline: functional commerce/booking checks passed; stopped on cart overflow at 768 px during viewport checks. Database cleaned. Investigate layout readiness before concluding a product regression.
- Operations browser baseline: eight functional groups and all 70 responsive checks passed, then final mobile navigation focus assertion failed without diagnostic detail. Unchanged repeat reproduced it; database cleaned both times. Add precise readiness/assertion diagnostics and verify focus behavior during closeout.

## Current architecture

NotificationJob has pending/processing/sent/failed/simulated states, stable event keys, five-attempt retry cycles and two-minute fenced leases. The explicitly injected test transport is honest; normal execution is unconfigured. Twelve templates currently contain plain text only. Status `sent` already means provider acceptance rather than confirmed delivery, but no provider ID, delivery webhook or monitoring exists. Immediate operation outbox projection and worker recovery preserve orders/bookings during notification failures.

Notification UI currently filters only by status and displays job summaries on order/booking details. Dashboard has a failed count/list. Settings supply contact details; server dotenv loads before application imports. All new notification control stays behind existing Admin authentication. Public receipts remain explicit projections.

No email provider, verified sender, webhook secret or QA recipient was found in server/.env. No real credentials will be printed or written. Live email QA is blocked until explicit test configuration exists; local adapter/security tests can proceed.

## Implementation decisions

- Select exactly one provider: Resend, via a server-only HTTP adapter. Sender name/email and reply-to come from environment configuration, separate from BusinessSettings.
- Resend's idempotency retention is 24 hours. Persist a stable delivery attempt and sender/request snapshot; ambiguous attempts may replay only inside a conservative window. Outside it, block resend pending reconciliation. Never silently generate a new key for an uncertain send.
- Retain distinct accepted, delivered-to-recipient-server, bounced, complained, failed and retrying semantics. Delivery does not prove inbox placement or human reading. Keep legacy sent jobs readable as accepted.
- Verify raw-body webhooks using the provider's Svix scheme. Persist only sanitized event identity/type/message ID/time, deduplicate, and recover early/out-of-order events by trusted provider message ID.
- Durable notification lifecycle audit, transparent health rules, admin filters/history and responsive verification extend the existing systems.
- Keep all automatic suites isolated and incapable of sending real email. A separately gated live diagnostic may send only to explicitly configured QA recipients. No SMS/WhatsApp provider, Cloudinary changes, production data or deployment.

Provider references: [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [signature verification](https://resend.com/docs/webhooks/verify-webhooks-requests), [events](https://resend.com/docs/webhooks/event-types), [sender domains](https://resend.com/docs/dashboard/domains/introduction).


## Closeout findings (23 October 2026)

The storefront width failure was resolved by waiting two animation frames after viewport changes before measuring layout; the full 26-check/70-width suite passed. No storefront layout rules were weakened.

The admin focus failure was an application issue: the persistent sidebar's opening target still had computed `visibility:hidden` during the first focus attempts. A cancellable, bounded visibility-aware focus step now waits for the target to become visible, preserves focus already inside, and retains the existing trap/Escape/restoration. The targeted reproduction passes; full browser results are recorded in PHASE7D-REPORT.md.

The installed Svix 2 verifier authenticates without returning parsed JSON. The handler now authenticates raw bytes first and then parses/validates JSON. Notification tests also verified immutable stored content, version-fenced status projections and durable acceptance activity when a webhook wins the projection race. Final verification details and live-email limitations are in the Phase 7D report.
