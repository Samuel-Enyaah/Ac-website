import {
  notificationStatusLabels,
  notificationTemplateLabels,
} from "../../utils/notifications";
import { cloneElement, useId } from "react";
import { Link } from "react-router-dom";
import useModalFocus from "../../hooks/useModalFocus";
import { dateTime, titleCase, entityPath } from "../../utils/operations";

export function Panel({ title, children, description }) {
  return (
    <section className="ops-panel">
      <h2>{title}</h2>
      {description && <p className="ops-muted mt-2">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
export function Badge({ status }) {
  return (
    <span
      className={`ops-badge ${["cancelled", "failed", "bounced", "complained"].includes(status) ? "ops-badge-danger" : ["delivered", "completed", "paid", "sent"].includes(status) ? "ops-badge-good" : ""}`}
    >
      {titleCase(status)}
    </span>
  );
}
export function Control({ label, children, ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="ops-field">
      <label htmlFor={id}>{label}</label>
      {children ? cloneElement(children, { id }) : <input {...props} id={id} />}
    </div>
  );
}
export function LoadState({ loading, error, retry }) {
  if (loading)
    return (
      <div role="status" className="ops-panel animate-pulse">
        Loading operations...
      </div>
    );
  if (error)
    return (
      <div role="alert" className="ops-panel">
        <p>{error}</p>
        <button className="ops-button mt-4" onClick={retry}>
          Try again
        </button>
      </div>
    );
  return null;
}
export function Confirmation({ title, children, onConfirm, onClose, busy }) {
  const ref = useModalFocus(true, () => {
    if (!busy) onClose();
  });
  return (
    <div className="ops-overlay">
      <div
        className="ops-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="operation-confirm-title"
        ref={ref}
        tabIndex={-1}
      >
        <h2 id="operation-confirm-title">{title}</h2>
        <div className="my-5 leading-7">{children}</div>
        <div className="flex flex-wrap gap-3">
          <button
            className="ops-button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Keep current state
          </button>
          <button className="ops-button" onClick={onConfirm} disabled={busy}>
            {busy ? "Saving..." : "Confirm change"}
          </button>
        </div>
      </div>
    </div>
  );
}
export function Timeline({ events = [], links = false }) {
  return events.length ? (
    <ol className="ops-timeline">
      {events.map((event) => (
        <li key={event.eventId || event._id}>
          <p>{event.summary}</p>
          <p className="ops-muted">
            {dateTime(event.createdAt)} ·{" "}
            {event.actorName || titleCase(event.actorType)}
          </p>
          {links && (
            <Link
              className="ops-link"
              to={entityPath(event.entityType, event.entityId)}
            >
              Open {event.entityType}
            </Link>
          )}
        </li>
      ))}
    </ol>
  ) : (
    <p className="ops-muted">No operational activity recorded yet.</p>
  );
}
export function NotificationHistory({
  jobs = [],
  onRetry,
  busy,
  links = false,
}) {
  if (!jobs.length)
    return (
      <p className="ops-muted">
        No email recipient available, or no email event has been queued yet. Use
        the customer contact links for manual follow-up.
      </p>
    );
  return (
    <ul className="space-y-4">
      {jobs.map((job) => {
        const states = [
          ["Queued", job.createdAt],
          ["Accepted by provider", job.acceptedAt || job.sentAt],
          ["Delivered to mail server", job.deliveredAt],
          ["Failed attempt", job.failedAt],
          ["Bounced", job.bouncedAt],
          ["Spam complaint", job.complainedAt],
        ]
          .filter(([, at]) => at)
          .sort((a, b) => new Date(a[1]) - new Date(b[1]));
        return (
          <li
            key={job._id}
            className="ops-record"
            data-notification-id={job._id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">
                {notificationTemplateLabels[job.template] ||
                  titleCase(job.template.replace(".", " "))}
              </h3>
              <span
                className={`ops-badge ${["failed", "bounced", "complained"].includes(job.status) ? "ops-badge-danger" : job.status === "delivered" ? "ops-badge-good" : ""}`}
              >
                {notificationStatusLabels[job.status] || titleCase(job.status)}
              </span>
            </div>
            {job.reference && (
              <p className="mt-2 font-semibold">{job.reference}</p>
            )}
            <p className="ops-muted mt-2">
              {titleCase(job.channel)} ? {job.recipient}
            </p>
            {job.status === "simulated" ? (
              <p className="ops-muted">
                Test simulation only. No message was sent to the customer.
              </p>
            ) : (
              <p className="ops-muted">
                {job.deliveredAt
                  ? "The provider verified delivery to the recipient's mail server. Inbox placement and reading are not verified."
                  : job.acceptedAt || job.sentAt
                    ? "The provider accepted this message for delivery. Recipient-server delivery is not confirmed yet."
                    : "No provider acceptance or delivery has been confirmed."}
              </p>
            )}
            <ol
              aria-label="Notification timeline"
              className="ops-timeline mt-4"
            >
              {states.map(([label, at]) => (
                <li key={label}>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="ops-muted">{dateTime(at)}</p>
                </li>
              ))}
            </ol>
            <p className="ops-muted mt-3">
              Delivery attempts: {job.attempts || 0} ? This cycle:{" "}
              {job.cycleAttempts || 0}/{job.maxAttempts || 5} ? Manual retries:{" "}
              {job.retryCount || 0}
            </p>
            {job.lastError && (
              <p className="mt-2 text-sm text-red-700">{job.lastError}</p>
            )}
            {["pending", "retrying"].includes(job.status) && (
              <p className="ops-muted">
                Next attempt: {dateTime(job.nextRetryAt)}
              </p>
            )}
            {job.status === "failed" && job.retryReason && (
              <p className="ops-muted mt-2">{job.retryReason}</p>
            )}
            {job.attemptHistory?.length > 1 && (
              <details className="mt-3">
                <summary className="ops-link cursor-pointer">
                  Delivery attempt history
                </summary>
                <ol className="ops-timeline mt-3">
                  {job.attemptHistory.map((attempt) => (
                    <li key={attempt.generation}>
                      <p className="text-sm font-semibold">
                        Attempt {attempt.generation + 1} ?{" "}
                        {notificationStatusLabels[attempt.status] ||
                          titleCase(attempt.status)}
                      </p>
                      <p className="ops-muted">{dateTime(attempt.createdAt)}</p>
                      {attempt.lastError && (
                        <p className="ops-muted">{attempt.lastError}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {job.status === "failed" && job.canRetry && (
                <button
                  className="ops-button secondary"
                  disabled={busy}
                  onClick={() => onRetry(job._id)}
                >
                  Retry notification
                </button>
              )}
              {links && (
                <Link
                  className="ops-link"
                  to={entityPath(job.entityType, job.entityId)}
                >
                  Open {job.entityType}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
