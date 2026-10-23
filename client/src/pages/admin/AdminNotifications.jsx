import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import useAdminResource from "../../hooks/useAdminResource";
import {
  Control,
  LoadState,
  NotificationHistory,
} from "../../components/admin/OperationsUI";
import NotificationMonitoring from "../../components/admin/NotificationMonitoring";
import {
  notificationStatusLabels,
  notificationTemplateLabels,
} from "../../utils/notifications";

export default function AdminNotifications() {
  const [params, setParams] = useSearchParams();
  const resource = useAdminResource(
    `/admin/operations/notifications?${params}`,
  );
  const health = useAdminResource("/admin/operations/notifications/health");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reload = () => Promise.all([resource.reload(), health.reload()]);
  const retry = async (id) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post(`/admin/operations/notifications/${id}/retry`, {});
      await reload();
      setMessage(
        "Notification queued for a controlled retry using its stored recipient and message.",
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retry notification.");
    } finally {
      setBusy(false);
    }
  };
  const apply = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget))
      if (value) next.set(key, value);
    setParams(next);
  };
  const select = (event) => event.currentTarget.form.requestSubmit();
  const paginate = (page) => {
    const next = new URLSearchParams(params);
    next.set("page", page);
    setParams(next);
  };
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">Customer communication</p>
          <h1>Notifications</h1>
          <p className="ops-muted">
            Review delivery evidence and problems. Refresh to load the latest
            provider events.
          </p>
        </div>
        <button className="ops-button secondary" onClick={reload}>
          Refresh
        </button>
      </header>
      {health.error ? (
        <LoadState {...health} retry={health.reload} />
      ) : (
        <NotificationMonitoring health={health.data?.health} />
      )}
      <form
        key={params.toString()}
        onSubmit={apply}
        className="ops-panel ops-filters"
        aria-label="Notification filters"
      >
        <Control label="Notification status">
          <select
            name="status"
            defaultValue={params.get("status") || ""}
            onChange={select}
          >
            <option value="">All statuses</option>
            {Object.entries(notificationStatusLabels)
              .filter(([s]) => s !== "sent")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </Control>
        <Control label="Channel">
          <select
            name="channel"
            defaultValue={params.get("channel") || ""}
            onChange={select}
          >
            <option value="">All channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </Control>
        <Control label="Record type">
          <select
            name="entityType"
            defaultValue={params.get("entityType") || ""}
            onChange={select}
          >
            <option value="">All records</option>
            <option value="order">Orders</option>
            <option value="booking">Bookings</option>
          </select>
        </Control>
        <Control label="Notification event">
          <select
            name="template"
            defaultValue={params.get("template") || ""}
            onChange={select}
          >
            <option value="">All events</option>
            {Object.entries(notificationTemplateLabels).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </Control>
        <Control
          label="Reference search"
          name="reference"
          defaultValue={params.get("reference") || ""}
          maxLength={100}
        />
        <Control
          label="Recipient search"
          name="recipient"
          defaultValue={params.get("recipient") || ""}
          maxLength={254}
        />
        <Control
          label="From date (UTC)"
          type="date"
          name="from"
          defaultValue={params.get("from") || ""}
        />
        <Control
          label="To date (UTC)"
          type="date"
          name="to"
          defaultValue={params.get("to") || ""}
        />
        <Control label="Notification ordering">
          <select
            name="sort"
            defaultValue={params.get("sort") || "newest"}
            onChange={select}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </Control>
        <button className="ops-button" type="submit">
          Apply filters
        </button>
        <button
          className="ops-button secondary"
          type="button"
          onClick={() => setParams({})}
        >
          Clear filters
        </button>
      </form>
      {error && (
        <p role="alert" className="ops-alert error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="ops-alert">
          {message}
        </p>
      )}
      <LoadState {...resource} retry={resource.reload} />
      {!resource.loading && !resource.error && (
        <>
          <p className="ops-muted">
            {resource.data.pagination.total} matching notifications
          </p>
          {resource.data.notifications.length ? (
            <NotificationHistory
              jobs={resource.data.notifications}
              busy={busy}
              onRetry={retry}
              links
            />
          ) : (
            <p className="ops-panel">No notifications match these filters.</p>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className="ops-button secondary"
              disabled={resource.data.pagination.page <= 1}
              onClick={() => paginate(resource.data.pagination.page - 1)}
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
              onClick={() => paginate(resource.data.pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
