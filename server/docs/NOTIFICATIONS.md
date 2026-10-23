# Phase 7D notification operations

Resend is the single supported external email provider. Business controllers still write the existing durable operation outbox. Orders, bookings and stock never depend on an email API response. Manual telephone, email, WhatsApp and SMS links remain available; no SMS or WhatsApp transport is installed.

## Configuration and verified sender

Copy variable names from `server/.env.example` into local server configuration. Never commit real credentials. Restart the Node process after changing configuration.

| Variable | Purpose |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` enables the adapter; blank leaves delivery explicitly unconfigured. |
| `RESEND_API_KEY` | Server-only Resend sending credential, restricted to the intended verified domain where possible. |
| `EMAIL_FROM_NAME` | Customer-facing sender name; header control characters are rejected. |
| `EMAIL_FROM_ADDRESS` | Address belonging to the verified sending domain. Never taken from the customer or BusinessSettings. |
| `EMAIL_REPLY_TO` | Optional valid reply address. |
| `EMAIL_TIMEOUT_MS` | 1,000–25,000 ms, default 15,000. Worker deadline remains 30 seconds. |
| `RESEND_WEBHOOK_SECRET` | Separate `whsec_` signing secret for this endpoint. Never the API key. |
| `EMAIL_QA_RECIPIENTS` | One to three comma-separated developer/test inboxes, used only by explicitly invoked live QA. |
| `EMAIL_QA_SENDER_VERIFIED` | Set `true` only after actually verifying the sender in Resend; this is an operator declaration for QA, not an automated DNS check. |

Resend requires a sending domain to be verified using its supplied DNS records. Follow the account's actual SPF/DKIM setup and review its domain status before enabling mail. No domain, DNS record or sender was verified by Phase 7D work. Public BusinessSettings supply contact information inside email content only. [Resend domain documentation](https://resend.com/docs/dashboard/domains/introduction)

Missing or invalid configuration does not stop application startup. Eligible jobs fail with a fixed, safe configuration message. Restoring configuration does not silently retry permanent failures: an administrator requests a controlled retry. Existing accepted messages are not resent.

## Delivery evidence

| Internal state | Meaning |
| --- | --- |
| `pending` (Queued) | Durable work exists; no provider acceptance is confirmed. |
| `processing` | A worker holds a two-minute lease. This does not establish delivery. |
| `retrying` | A transient error or administrator request has scheduled another controlled attempt. |
| `accepted` | A successful send response with a provider ID, or authenticated provider evidence, confirms acceptance for delivery. |
| `delivered` | A signed `email.delivered` event confirms acceptance by the recipient's mail server. Inbox placement and reading remain unverified. |
| `bounced` | A signed bounce event indicates permanent delivery rejection. |
| `complained` | A signed complaint event indicates a spam complaint. |
| `failed` | A permanent error, exhausted retry cycle or provider failure requires review. |
| `simulated` | Explicitly injected QA transport only. No external email was sent. |

Legacy `sent` is read as accepted, with `sentAt` as the acceptance timestamp. Legacy pending jobs with previous cycle attempts are displayed as retrying. No migration invents provider IDs or delivery evidence. The UI never calls acceptance inbox delivery. [Resend event meanings](https://resend.com/docs/webhooks/event-types)

## Sending and retry safety

The adapter uses native HTTPS fetch against `https://api.resend.com/emails`, without redirects. It sends HTML and plain text and requires a valid response message ID. It maps provider errors to fixed categories; no response body, authorization header, key or signature is persisted or logged.

Each job has immutable recipient, event identity, template and content. A `NotificationAttempt` identifies a controlled delivery generation. Its sender snapshot and provider key are immutable. The key is the stored operation event key plus `:delivery:<generation>`. Automatic retries reuse that exact key and request body even if sender configuration changes.

Resend retains idempotency keys for 24 hours. The worker uses a conservative 23-hour deadline, persisted before the first network call and never extended. A timeout, network failure, temporary 5xx, ambiguous response or interrupted send leaves an uncertain outcome. Outside that deadline both automatic and manual resend are blocked until a human reconciles provider records. There is no unsafe force-resend endpoint. A provider key is not an unlimited exactly-once guarantee. [Resend idempotency contract](https://resend.com/docs/dashboard/emails/idempotency-keys)

429 responses honor Retry-After. Transient errors use the existing exponential delay starting at 30 seconds, capped at 24 hours; five worker attempts exhaust a cycle. Authentication, sender/configuration and recipient rejection stop automatic retries. Bounce, complaint and suppression prevent further automatic email to the normalized recipient, using a server-only recipient hash. No suppression-clearing UI is included.

Manual retry accepts an empty body only and reads the stored recipient/content. It records the authenticated administrator and preserves history. Definitively failed deliveries start a new generation; uncertain outcomes within the safe window replay the same generation/key to avoid duplicate email. At most 25 manual retries are allowed per job. Legacy failures with unexplained real-provider history require reconciliation.

Attempts persist acceptance before projecting the job summary. A durable `projectionPending` flag lets recovery find interrupted projections independently of queue size. Version fencing prevents an older projection from replacing newer evidence. Current worker lease tokens fence send completion. Acceptance repair never sends another email. Acceptance activity is retained in the job outbox before the attempt/job projection, so a webhook winning the lease race cannot lose the acceptance audit. Audit events remain in that outbox until their unique ActivityLog projection succeeds.

## Signed webhook

`POST /api/v1/webhooks/resend` accepts raw `application/json` up to 128 KB. It is mounted before JSON parsing and the browser API limiter, requires no admin cookie and has its own 600 requests/minute/IP limit. Configure only the supported event types: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.failed`, `email.suppressed`, `email.delivery_delayed`.

Svix verifies the exact raw bytes and the `svix-id`, `svix-timestamp` and `svix-signature` headers, including timestamp tolerance. The installed Svix 2 API verifies without returning parsed JSON, so parsing and schema validation follow successful authentication. Invalid signatures return 401; malformed signed events return 400; unconfigured or unavailable processing returns 503. Responses contain no customer information. HTTP 202 means the minimal verified event was durably recorded, not that delivery happened. [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)

Only event ID, provider, provider message ID, supported event type and event time are retained with processing fields. Raw bodies, recipient arrays, subjects and provider diagnostic text are discarded. Event IDs are unique. Pending evidence is retried by the existing worker, including events arriving before the send response. Unknown provider IDs never select arbitrary job IDs; they remain unresolved for up to 30 days, then expire. Minimal webhook receipts have a 30-day TTL; attempt evidence and audit IDs remain durable, so later replays do not duplicate activity.

Evidence precedence is complaint → bounce → delivered → provider failure → accepted. Older acceptance cannot regress terminal evidence. Separate timestamps remain available. Events for an older generation update its history and audit without replacing the current generation. Provider delivery delays do not enqueue another email because Resend is already managing delivery.

## Admin and monitoring

All notification lists, details, retries and health data require the existing active Admin session. Staff remain assignment records, not login identities. Full recipient addresses are displayed only inside that authorized admin context. Public receipts never contain notification jobs or attempt data.

`GET /api/v1/admin/operations/notifications` accepts `channel`, `entityType`, `template`, `status`, `reference`, `recipient`, `from`, `to`, `sort` and `page`. Dates filter the queued date in UTC; `to` includes the whole day. Text searches are escaped literal matches. Pages contain 25 jobs. Summaries omit bodies, sender snapshots, keys, lease tokens and outbox contents. `GET /api/v1/admin/operations/notifications/health` returns counts, recent problems, safe configuration flags and heartbeat information. The dashboard includes the same health summary.

Transparent alert rules:

- Missing configuration: warning; configured sender without webhook secret: delivery-confirmation warning.
- At least 3 authentication, sender or configuration attempt failures in 15 minutes: critical alert.
- At least 5 failed delivery attempts in one hour: warning.
- Due work older than 15 minutes with no worker progress during that period: critical alert.

Counts describe current job states, not unique customers or guaranteed inbox delivery. These are fixed rules, not statistical anomaly detection. Configuration checks cannot prove DNS verification or that a webhook URL is reachable. There is no external alert service. An administrator uses Refresh to obtain later webhook results; there is no live push stream.

## QA and operational limits

See `server/test/README.md` for isolated suites. All automated regression scripts explicitly disable real email after loading `.env`; HTTP responses and signed webhook fixtures are injected. The template preview produces local HTML/plain text and browser screenshots without external requests. Browser rendering is not Gmail/Outlook inbox certification.

`node scripts/qa-live-email.js` performs a safe preflight by default. Sending additionally requires `RUN_LIVE_EMAIL_QA=1`, complete provider configuration, a declared verified sender and explicit test recipients. It sends one developer-labelled email per configured recipient, in an isolated database, reports HTTP status and provider-ID persistence without printing addresses or secrets, then removes that QA database. Reconcile provider records before repeating an interrupted diagnostic; each invocation creates a new test event. No reachable endpoint, tunnel or deployment is created. Actual recipient inbox inspection and provider webhook connectivity require separately configured external access. Never use customer contacts for QA.

The normal worker checks every 10 seconds, runs one pass at a time per process and preserves reservation/media recovery. Multi-process state is fenced in MongoDB. Long outages can outlast the provider idempotency window and intentionally require reconciliation. Unresolved webhook work and general audit history are not currently exposed through a separate archive UI. Job/attempt data have no automatic retention cleanup; deleting them may remove deduplication or suppression evidence. MongoDB access and retention therefore remain operator responsibilities.

The temporary Root Cloudinary API key remains local-only. Replace it with a dedicated least-privilege R&J backend key before any future deployment. Phase 7D does not change Cloudinary code, rotate credentials or deploy anything.
