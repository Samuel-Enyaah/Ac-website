# Phase 7C operations

All operational endpoints require the existing active Admin cookie. A Staff record is an assignment directory entry, never a login account. Administrator, Operations, Technician and Customer Support are job roles, not authorization roles. Staff have no passwords; deactivation preserves assignments and history.

## Booking retries

`POST /api/v1/service-bookings` accepts an optional `Idempotency-Key` of 16-128 ASCII letters, digits, hyphens or underscores. The public form generates a UUID. A partial unique index on SHA-256 `keyHash` protects concurrent requests. Canonical normalized `requestHash`, immutable receipt and creation event are inserted with the booking in one atomic write. Same-key same-payload replay returns the original HTTP 201 receipt, even after operational status or calendar date changes. Changed details return 409. Keyless callers work but independent requests cannot be deduplicated.

`rj-service-attempt` in sessionStorage retains the key and exact payload after ambiguous failures. Reload restores and locks those details; the retry button resends them. Successful receipt or a definitive 400 clears the attempt. A 409/transient error retains it. Storage-disabled browsers retain retries in memory while the page remains open; they cannot guarantee recovery after the tab closes. Staff should help the customer locate an existing request before starting another one in that case.

## Status rules

| Entity | Forward path | Exceptions |
| --- | --- | --- |
| Pickup order | pending → confirmed → processing → ready → delivered | Cancellation from any pre-delivered status; delivered/cancelled are terminal. |
| Delivery order | pending → confirmed → processing → ready → out-for-delivery → delivered | Cancellation from any pre-delivered status; delivered/cancelled are terminal. |
| Service booking | pending → confirmed → technician-assigned → in-progress → completed | Actual assignment required before technician-assigned/in-progress; cancellation before completion. Completed/cancelled are terminal. |

Assignment does not itself change customer status or the requested appointment date. Admin explicitly advances the workflow after reviewing arrangements. Legacy technician-assigned records without real staff must be assigned before work can progress. Deactivated historical assignees remain visible; an admin can reassign open work to active staff. Eligibility is checked by an atomic active-staff claim: a deactivation serialized before that claim blocks assignment; overlapping deactivation afterward preserves that accepted assignment.

Payment states remain manual records. Updating them neither charges nor refunds funds. Cancellation retains the Phase 7A per-product stock markers, partial-failure recovery and terminal cancellation rules.

## Admin API additions

All paths below are under `/api/v1/admin`.

| Method/path | Input / result |
| --- | --- |
| GET `/staff` | `search`, `role`, `skill`, `active=true/false`, `page`, `limit` (max 100). |
| POST `/staff` | name, phone, email, role, active, skills array, optional directory notes. Strict allowlist; no credentials accepted. |
| GET/PATCH `/staff/:staffId` | Read staff/activity or update directory fields. No permanent deletion endpoint. |
| POST `/operations/orders/:id/assignment` | `staffId`, optional internal `note`; active staff only. |
| POST `/operations/bookings/:id/assignment` | Same contract, with historical assignment snapshots. |
| POST `/operations/orders/:id/notes` | `text` (1-2000 characters), optional UUID `noteId` for deduplicating retries. Author comes from the session. |
| POST `/operations/bookings/:id/notes` | Same contract. No update/delete route. |
| GET `/operations/notifications` | `status`, `page`; 25 jobs per page. |
| POST `/operations/notifications/:id/retry` | Empty body only. Failed jobs only. Recipient, event key and payload are read from the stored job. |

Existing order/booking PATCH routes now enforce forward transitions. Detail responses add `allowedTransitions`, assignment fields/history, internal notes, the latest 100 activity entries and 100 notification summaries. Public receipts never include these fields. Existing lists accept `assignedStaff` (ID or `unassigned`) and `sort=oldest/newest`; order `work=action` selects confirmed/processing/ready/out-for-delivery. The inventory `stock=attention` filter includes active products with zero through five units.

New staff mutations are limited to 30/minute; assignment/note/notification-retry mutations to 60/minute. Existing global API limits continue to apply. Admin-only detail/list routes contain customer contacts. The public settings API remains explicitly projected.

## Atomic activity and recovery

This application supports standalone MongoDB. Each meaningful mutation writes its pending `eventOutbox` entries in the same atomic document write. Version conditions protect competing updates. Outbox projection uses unique event IDs to create ActivityLog records and NotificationJob records once. It removes an event only after both projections succeed. A crash between writes is replayable; concurrent projectors cannot duplicate the event/job. Immediate projection failure does not undo the business operation; the durable event remains for recovery.

Audit data includes entity/type, action, authenticated actor/name when applicable, summary, timestamp, and allowlisted operational metadata. Metadata contains status/payment changes, staff IDs, note IDs or changed field names. It excludes note bodies, customer contacts, request bodies, passwords, tokens, credentials and provider error bodies. Internal notes store text separately with their authenticated author and timestamp. No historical backfill is attempted for actions performed before Phase 7C.

The existing non-overlapping recovery worker additionally projects up to 25 pending records per entity type and processes up to 20 notifications per pass. The timer checks every 10 seconds; a running pass finishes before another begins. Provider delays can extend a pass. Startup initializes the booking, activity, notification and staff indexes before accepting requests. Existing reservation/media recovery and shutdown draining remain in place.

History is retained without TTL deletion. Detail histories are limited to the newest 100 activity/notification records; the notification queue is paginated. Each order/booking allows 500 internal notes and 500 assignments to avoid unbounded embedded histories. A larger operational archive/search UI is future work. Do not manually remove idempotency keys, stock markers, event keys or completed notification jobs while retries may occur.

## Notification transport boundary (updated in Phase 7D)

The existing outbox, leases, stock and media recovery remain in place. Phase 7D adds one Resend email adapter, signed delivery webhooks, controlled attempt history, provider-degraded operation and admin monitoring. Read [NOTIFICATIONS.md](NOTIFICATIONS.md) for the current configuration, status meanings, 23-hour safe replay window, permanent failures, suppression and manual retry rules. The Phase 7C reports preserve the historical unconfigured-adapter baseline.

Notification list filters now include channel, entity type, template, status, queued date range in UTC, reference, recipient, ordering and page. GET `/api/v1/admin/operations/notifications/health` requires Admin authentication. POST `/api/v1/webhooks/resend` instead uses raw-body provider signature verification and its own rate limit; it does not use the Admin cookie. Public order/booking receipts are unchanged.

Legacy `sent` means provider acceptance and is displayed as accepted. Delivered means signed confirmation of recipient-mail-server delivery, never guaranteed inbox placement or reading. Explicit test injection remains labelled simulated. No paid WhatsApp/SMS integration, deployment, customer accounts, payment integration, quotes/invoices, returns or credential rotation is included.
