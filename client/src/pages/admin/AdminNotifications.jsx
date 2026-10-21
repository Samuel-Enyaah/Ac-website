import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import useAdminResource from "../../hooks/useAdminResource";
import {
  Control,
  LoadState,
  NotificationHistory,
} from "../../components/admin/OperationsUI";
import { titleCase } from "../../utils/operations";

export default function AdminNotifications() {
  const [params, setParams] = useSearchParams();
  const resource = useAdminResource(
    `/admin/operations/notifications?${params}`,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/admin/operations/notifications/${id}/retry`, {});
      await resource.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retry notification.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">Customer communication</p>
          <h1>Notifications</h1>
          <p className="ops-muted">
            Review queued updates and failures. Test simulations never represent
            customer delivery.
          </p>
        </div>
        <button className="ops-button secondary" onClick={resource.reload}>
          Refresh
        </button>
      </header>
      <Control label="Notification status">
        <select
          value={params.get("status") || ""}
          onChange={(e) =>
            setParams(e.target.value ? { status: e.target.value } : {})
          }
        >
          <option value="">All statuses</option>
          {["failed", "pending", "processing", "sent", "simulated"].map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
      </Control>
      {error && (
        <p role="alert" className="ops-alert error">
          {error}
        </p>
      )}
      <LoadState {...resource} retry={resource.reload} />
      {!resource.loading && !resource.error && (
        <>
          <NotificationHistory
            jobs={resource.data.notifications}
            busy={busy}
            onRetry={retry}
            links
          />
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className="ops-button secondary"
              disabled={resource.data.pagination.page <= 1}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", resource.data.pagination.page - 1);
                setParams(next);
              }}
            >
              Previous
            </button>
            <span>
              Page {resource.data.pagination.page} of{" "}
              {resource.data.pagination.pages}
            </span>
            <button
              className="ops-button secondary"
              disabled={
                resource.data.pagination.page >= resource.data.pagination.pages
              }
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", resource.data.pagination.page + 1);
                setParams(next);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
