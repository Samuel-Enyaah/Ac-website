import { Link } from "react-router-dom";
import useAdminResource from "../../hooks/useAdminResource";
import {
  Badge,
  LoadState,
  Panel,
  Timeline,
} from "../../components/admin/OperationsUI";
import { dateTime, money, entityPath } from "../../utils/operations";
export default function AdminDashboard() {
  const resource = useAdminResource("/admin/dashboard");
  if (resource.loading || resource.error)
    return <LoadState {...resource} retry={resource.reload} />;
  const d = resource.data.dashboard;
  const cards = [
    [
      "Orders awaiting confirmation",
      d.stats.pendingOrders,
      "/admin/orders?status=pending",
    ],
    [
      "Orders ready for action",
      d.stats.actionOrders,
      "/admin/orders?work=action",
    ],
    [
      "Service requests awaiting confirmation",
      d.stats.pendingBookings,
      "/admin/bookings?status=pending",
    ],
    [
      "Unassigned service bookings",
      d.stats.unassignedBookings,
      "/admin/bookings?assignedStaff=unassigned",
    ],
    [
      "Services in progress",
      d.stats.inProgressBookings,
      "/admin/bookings?status=in-progress",
    ],
    ["Low stock", d.stats.lowStockProducts, "/admin/inventory?stock=low"],
    [
      "Failed notifications",
      d.stats.failedNotifications,
      "/admin/notifications?status=failed",
    ],
  ];
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">Daily operations</p>
          <h1>Work that needs attention</h1>
          <p className="ops-muted">
            Review requests, assign responsibility and keep customers informed.
          </p>
        </div>
        <button className="ops-button secondary" onClick={resource.reload}>
          Refresh
        </button>
      </header>
      <section aria-label="Operational overview" className="ops-card-grid">
        {cards.map(([label, value, to]) => (
          <Link
            key={label}
            className="ops-panel block hover:border-[#1687D9]"
            to={to}
          >
            <h2>{label}</h2>
            <p className="my-3 text-3xl font-black">{value || 0}</p>
            <p className="ops-muted">Review work</p>
          </Link>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent orders">
          <ul className="space-y-4">
            {d.recentOrders.map((o) => (
              <li key={o.id} className="ops-record">
                <div className="flex flex-wrap justify-between gap-2">
                  <Link className="ops-link" to={`/admin/orders/${o.id}`}>
                    {o.orderNumber}
                  </Link>
                  <Badge status={o.status} />
                </div>
                <p>{o.customerName}</p>
                <p className="ops-muted">
                  {money(o.total)} / {dateTime(o.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          {!d.recentOrders.length && (
            <p className="ops-muted">New orders will appear here.</p>
          )}
          <Link className="ops-link" to="/admin/orders">
            All orders
          </Link>
        </Panel>
        <Panel title="Recent service requests">
          <ul className="space-y-4">
            {d.recentBookings.map((b) => (
              <li key={b.id} className="ops-record">
                <div className="flex flex-wrap justify-between gap-2">
                  <Link className="ops-link" to={`/admin/bookings/${b.id}`}>
                    {b.bookingNumber}
                  </Link>
                  <Badge status={b.status} />
                </div>
                <p>{b.customerName}</p>
                <p className="ops-muted">
                  Requested {dateTime(b.preferredDate)}
                </p>
              </li>
            ))}
          </ul>
          {!d.recentBookings.length && (
            <p className="ops-muted">New service requests will appear here.</p>
          )}
          <Link className="ops-link" to="/admin/bookings">
            All service bookings
          </Link>
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent operational activity">
          <Timeline events={d.recentActivity} links />
        </Panel>
        <Panel title="Notification failures">
          <p className="ops-muted">
            A failed notification means customer communication still needs
            attention. Manual contact links are available from the related
            record.
          </p>
          {d.notificationFailures?.map((job) => (
            <div className="ops-record" key={job._id}>
              <p className="font-semibold">{job.template.replace(".", " ")}</p>
              <p className="ops-muted">{job.recipient}</p>
              <p className="mt-2 text-sm text-red-700">{job.lastError}</p>
              <Link
                className="ops-link"
                to={entityPath(job.entityType, job.entityId)}
              >
                Review {job.entityType}
              </Link>
            </div>
          ))}
          {!d.notificationFailures?.length && (
            <p className="ops-muted">No failed notifications recorded.</p>
          )}
          <Link className="ops-link" to="/admin/notifications?status=failed">
            Review notification queue
          </Link>
        </Panel>
      </div>
      <Panel title="Inventory attention">
        <div className="ops-card-grid">
          {d.lowStockItems.map((p) => (
            <Link
              className="ops-record hover:border-[#1687D9]"
              to={`/admin/inventory?search=${encodeURIComponent(p.name)}`}
              key={p.id}
            >
              <strong>{p.name}</strong>
              <p className="ops-muted">{p.stock} units remaining</p>
            </Link>
          ))}
        </div>
        {!d.lowStockItems.length && (
          <p className="ops-muted">
            No active products at or below the low-stock threshold.
          </p>
        )}
      </Panel>
      <Panel title="Recorded paid revenue">
        <p className="text-2xl font-black">{money(d.stats.paidRevenue)}</p>
        <p className="ops-muted">
          Orders marked paid, excluding cancelled orders. This is an internal
          record, not a payment provider balance.
        </p>
        <Link className="ops-link" to="/admin/orders?paymentStatus=paid">
          Review paid orders
        </Link>
      </Panel>
    </div>
  );
}
