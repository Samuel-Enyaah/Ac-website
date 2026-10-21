# Phase 7C initial audit

Recorded 2026-10-19 before implementation. Phase 7A/7B reports, audits, final closeout and server/test/README.md reviewed. No deployment or changes to credentials.

## Fresh baseline

- Client lint: exit 0, no errors or warnings.
- Server unit/controller tests: 17 passed, 0 failed.
- Client production build: exit 0; Vite 8.3.0, 2004 modules, 2.94 seconds. Main JS 337.98 kB (109.92 kB gzip), CSS 56.28 kB (11.34 kB gzip).
- Server syntax: 56 JavaScript files passed node --check.
- Isolated reliability suite: 19 passed, 0 failed.
- Isolated integration suite with real Cloudinary: 18 passed, assets and temporary database cleaned.

## Existing workflow

Dashboard provides counts, paid revenue, recent requests and low stock, but no assignment or notification context. Orders/bookings have search, status filters, pagination, responsive cards/tables and detail views; order payment status is manually recorded. Detail forms allow almost arbitrary status changes. Cancellation has durable per-product restoration markers and terminal cancelled status; this must remain intact. Booking status has no assignment record and no idempotency. Public booking has click protection but ambiguous network failures can duplicate a request.

Admin authentication checks signed cookies against active Admin records. Staff job assignment must remain separate from these credentials. CRM dynamically groups order/booking contact information by normalized phone; no Customer collection is necessary. Product, inventory and settings workflows are functional and already covered by real-media regression. Internal operational notes, activity logs and notification jobs do not yet exist. Settings expose an explicit public projection; retain it.

Existing admin navigation, tables, status forms, customer links, detail panels, public booking receipt and modal focus hook were inspected. Retain the navy/blue visual language and public Phase 7B layout; improve operational controls, mobile wrapping, labels, links and focus behavior.

## Implementation decisions

- Separate Staff assignment directory with no login/password fields. Existing active admins authorize all operational routes.
- Booking key hash, canonical payload hash and immutable successful receipt live on the same booking document, protected by a partial unique index. Keyless clients remain supported.
- Explicit forward status graphs, with cancellation before terminal completion; booking assignment required before work begins. Orders distinguish pickup and delivery paths.
- Standalone MongoDB requires atomic single-document writes. Embed a small pending-event outbox with each meaningful mutation, then idempotently project to ActivityLog and NotificationJob. Worker recovery closes the gap after process interruption. Do not require transactions.
- Append-only internal notes and assignment snapshots retain authors and historical names. Never include them in public receipts.
- No configured email provider was found (configuration names inspected without printing values). Implement provider interface, durable jobs, templates, safe leases and an explicit simulated test transport. Unconfigured delivery fails visibly; it must never be reported as sent.
- Keep existing reservation and media recovery, add bounded operations recovery to the same non-overlapping worker. Initialize critical unique indexes before accepting traffic.
- New verification uses explicitly named isolated databases and guarded local browser/API origins only.
