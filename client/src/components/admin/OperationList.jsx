import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useAdminResource from "../../hooks/useAdminResource";
import { Badge, Control, LoadState } from "./OperationsUI";
import {
  orderStatuses,
  bookingStatuses,
  titleCase,
  dateTime,
  money,
} from "../../utils/operations";
import { services } from "../../data/services";

export default function OperationList({ type }) {
  const path = type === "order" ? "orders" : "bookings";
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const resource = useAdminResource(`/admin/${path}?${params.toString()}`);
  const staff = useAdminResource("/admin/staff?limit=100");
  const change = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    if (key === "status") next.delete("work");
    setParams(next);
  };
  const records = resource.data?.[path] || [];
  const pagination = resource.data?.pagination;
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">Operations</p>
          <h1>{type === "order" ? "Orders" : "Service Bookings"}</h1>
          <p className="ops-muted">
            {type === "order"
              ? "Confirm requests, prepare fulfilment and track responsibility."
              : "Review service requests, assign staff and follow each visit."}
          </p>
        </div>
        <button className="ops-button secondary" onClick={resource.reload}>
          Refresh
        </button>
      </header>
      <form
        className="ops-panel ops-filters"
        onSubmit={(e) => {
          e.preventDefault();
          change("search", search.trim());
        }}
      >
        <Control
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Reference, customer or contact"
        />
        <Control label="Status">
          <select
            value={params.get("status") || ""}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {(type === "order" ? orderStatuses : bookingStatuses).map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </Control>
        {type === "order" ? (
          <Control label="Payment">
            <select
              value={params.get("paymentStatus") || ""}
              onChange={(e) => change("paymentStatus", e.target.value)}
            >
              <option value="">All payment states</option>
              {["pending", "paid", "failed", "refunded"].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </Control>
        ) : (
          <Control label="Service type">
            <select
              value={params.get("serviceType") || ""}
              onChange={(e) => change("serviceType", e.target.value)}
            >
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Control>
        )}
        <Control label="Assigned staff">
          <select
            value={params.get("assignedStaff") || ""}
            onChange={(e) => change("assignedStaff", e.target.value)}
          >
            <option value="">All staff</option>
            <option value="unassigned">Unassigned active work</option>
            {staff.data?.staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {!s.active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </Control>
        <Control label="Order by">
          <select
            value={params.get("sort") || "newest"}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </Control>
        <button className="ops-button">Search records</button>
        <button
          type="button"
          className="ops-button secondary"
          onClick={() => {
            setSearch("");
            setParams({});
          }}
        >
          Clear filters
        </button>
      </form>
      {params.get("work") === "action" && (
        <p className="ops-alert">
          Showing confirmed orders that need preparation, collection or
          delivery.
        </p>
      )}
      <LoadState {...resource} retry={resource.reload} />
      {!resource.loading && !resource.error && (
        <>
          <p className="ops-muted">
            {pagination?.total || 0} matching {path}
          </p>
          {!records.length ? (
            <div className="ops-panel">
              <h2 className="font-bold">No matching {path}</h2>
              <p className="ops-muted mt-2">
                Try clearing a filter or searching another reference.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <article className="ops-panel" key={record._id}>
                  <div className="ops-heading">
                    <div>
                      <Link
                        className="ops-link"
                        to={`/admin/${path}/${record._id}`}
                      >
                        {record.orderNumber || record.bookingNumber}
                      </Link>
                      <p className="font-semibold">
                        {record.customer?.fullName || record.customer?.name}
                      </p>
                      <p className="ops-muted">{record.customer?.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge status={record.status} />
                      {type === "order" && (
                        <Badge status={record.paymentStatus} />
                      )}
                    </div>
                  </div>
                  <dl className="ops-info mt-5">
                    <div>
                      <dt>
                        {type === "order"
                          ? "Fulfilment / total"
                          : "Service / preferred date"}
                      </dt>
                      <dd>
                        {type === "order"
                          ? `${titleCase(record.fulfillmentMethod)} · ${money(record.total)}`
                          : `${titleCase(record.serviceType)} · ${new Date(record.preferredDate).toLocaleDateString("en-GH")}`}
                      </dd>
                    </div>
                    <div>
                      <dt>Responsible staff</dt>
                      <dd>{record.assignedStaffName || "Unassigned"}</dd>
                    </div>
                    <div>
                      <dt>Latest activity</dt>
                      <dd>
                        {record.lastActivity?.summary || "Request received"}
                      </dd>
                      <p className="ops-muted">
                        {dateTime(record.lastActivity?.at || record.createdAt)}
                      </p>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <Link
                      className="ops-link"
                      to={`/admin/${path}/${record._id}`}
                    >
                      {record.status === "pending"
                        ? "Review and confirm"
                        : record.status === "confirmed" &&
                            type === "booking" &&
                            !record.assignedStaff
                          ? "Assign service staff"
                          : ["cancelled", "delivered", "completed"].includes(
                                record.status,
                              )
                            ? "View history"
                            : "Manage next step"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          <nav
            aria-label="Records pagination"
            className="flex flex-wrap items-center gap-3"
          >
            <button
              className="ops-button secondary"
              disabled={!pagination?.hasPreviousPage}
              onClick={() => change("page", String(pagination.page - 1))}
            >
              Previous
            </button>
            <span className="ops-muted">
              Page {pagination?.page || 1} of {pagination?.pages || 1}
            </span>
            <button
              className="ops-button secondary"
              disabled={!pagination?.hasNextPage}
              onClick={() => change("page", String(pagination.page + 1))}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
