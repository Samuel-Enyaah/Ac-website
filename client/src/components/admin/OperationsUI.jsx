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
      className={`ops-badge ${["cancelled", "failed"].includes(status) ? "ops-badge-danger" : ["delivered", "completed", "paid", "sent"].includes(status) ? "ops-badge-good" : ""}`}
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
  return jobs.length ? (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li key={job._id} className="ops-record">
          <div className="flex flex-wrap items-center gap-2">
            <strong>{titleCase(job.template.replace(".", " "))}</strong>
            <Badge status={job.status} />
          </div>
          <p className="ops-muted mt-2">
            {titleCase(job.channel)} · {job.recipient}
          </p>
          <p className="ops-muted">
            {job.status === "sent"
              ? `Accepted by provider ${dateTime(job.sentAt)}. Delivery is not independently confirmed.`
              : job.status === "simulated"
                ? "Test simulation only. No message was sent to the customer."
                : `Attempts: ${job.attempts}/${job.maxAttempts} in each retry cycle`}
          </p>
          {job.lastError && (
            <p className="mt-2 text-sm text-red-700">{job.lastError}</p>
          )}
          {job.status === "pending" && (
            <p className="ops-muted">
              Next attempt: {dateTime(job.nextRetryAt)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {job.status === "failed" && (
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
      ))}
    </ul>
  ) : (
    <p className="ops-muted">
      No email notifications recorded. An email address is needed for automatic
      email updates; use the customer contact links for manual follow-up.
    </p>
  );
}
