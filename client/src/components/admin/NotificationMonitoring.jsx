import { Link } from "react-router-dom";
import { Panel } from "./OperationsUI";
import { dateTime } from "../../utils/operations";

export default function NotificationMonitoring({ health }) {
  if (!health) return null;
  return (
    <Panel
      title="Notification health"
      description="Delivery to a mail server does not verify inbox placement or that a customer read the message."
    >
      {health.alerts.map((alert) => (
        <div
          key={alert.code}
          role={alert.severity === "critical" ? "alert" : "status"}
          className={`ops-alert ${alert.severity === "critical" ? "error" : "warning"}`}
        >
          <p className="font-semibold">
            {alert.severity === "critical"
              ? "Action needed"
              : "Delivery notice"}
          </p>
          <p className="mt-1">{alert.message}</p>
        </div>
      ))}
      <div className="ops-card-grid">
        {[
          ["pending", "Queued emails"],
          ["retrying", "Retrying emails"],
          ["failed", "Failed emails"],
          ["bounced", "Bounced emails"],
          ["complained", "Spam complaints"],
        ].map(([status, label]) => (
          <Link
            key={status}
            className="ops-record hover:border-[#1687D9]"
            to={`/admin/notifications?status=${status}`}
          >
            <strong>{label}</strong>
            <p className="my-2 text-2xl font-black">
              {health.counts[status] || 0}
            </p>
            <span className="ops-muted">Review notifications</span>
          </Link>
        ))}
      </div>
      <p className="ops-muted">
        Last worker pass:{" "}
        {health.worker?.completedAt
          ? dateTime(health.worker.completedAt)
          : "No completed pass recorded"}
        . Alerts use explicit failure counts and a 15-minute overdue-work
        threshold.
      </p>
    </Panel>
  );
}
