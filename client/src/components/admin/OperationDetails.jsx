import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import useAdminResource from "../../hooks/useAdminResource";
import {
  Badge,
  Panel,
  Control,
  LoadState,
  Confirmation,
  Timeline,
  NotificationHistory,
} from "./OperationsUI";
import {
  dateTime,
  titleCase,
  money,
  customerKey,
} from "../../utils/operations";
import { phoneHref, whatsappHref } from "../../utils/businessLinks";

export default function OperationDetails({ type, id }) {
  const path = type === "order" ? "orders" : "bookings";
  const resource = useAdminResource(`/admin/${path}/${id}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const mutate = async (url, method, body, success) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.request({ url, method, data: body });
      await resource.reload();
      setMessage(success);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "The change could not be confirmed. Refresh and check the current state before retrying.",
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (resource.loading || resource.error)
    return <LoadState {...resource} retry={resource.reload} />;
  const record = resource.data[type];
  return (
    <div className="ops-page">
      <Link className="ops-link" to={`/admin/${path}`}>
        Back to {titleCase(path)}
      </Link>
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">
            {type === "order" ? "Order details" : "Service booking"}
          </p>
          <h1>{record.orderNumber || record.bookingNumber}</h1>
          <p className="ops-muted">Received {dateTime(record.createdAt)}</p>
        </div>
        <Badge status={record.status} />
      </header>
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
      <Editor
        key={`${record._id}:${record.__v}`}
        record={record}
        type={type}
        path={path}
        busy={busy}
        mutate={mutate}
      />{" "}
    </div>
  );
}

function Editor({ record, type, path, busy, mutate }) {
  const [status, setStatus] = useState(record.status);
  const [payment, setPayment] = useState(record.paymentStatus || "pending");
  const [staffId, setStaffId] = useState(record.assignedStaff || "");
  const [staffSearch, setStaffSearch] = useState("");
  const staff = useAdminResource(
    `/admin/staff?active=true&limit=100&search=${encodeURIComponent(staffSearch)}`,
  );
  const [assignmentNote, setAssignmentNote] = useState("");
  const [note, setNote] = useState("");
  const noteId = useRef(crypto.randomUUID());
  const [confirm, setConfirm] = useState(false);
  const closed = ["cancelled", "completed", "delivered"].includes(
    record.status,
  );
  const endpoint = `/admin/${path}/${record._id}`;
  const operationEndpoint = `/admin/operations/${path}/${record._id}`;
  const customer = record.customer || {};
  const saveStatus = async () => {
    const ok = await mutate(
      endpoint,
      "PATCH",
      { status, ...(type === "order" ? { paymentStatus: payment } : {}) },
      type === "order"
        ? "Order updated successfully."
        : "Service booking updated successfully.",
    );
    if (ok) setConfirm(false);
  };
  const retry = (id) =>
    mutate(
      `/admin/operations/notifications/${id}/retry`,
      "POST",
      {},
      "Notification queued for retry using its stored recipient.",
    );
  return (
    <>
      <div className="ops-detail-grid">
        <div className="space-y-6">
          <Panel title="Customer information">
            <dl className="ops-info">
              <Info label="Name" value={customer.fullName || customer.name} />
              <Info label="Phone" value={customer.phone} />
              <Info label="Email" value={customer.email || "Not provided"} />
            </dl>
            <div className="flex flex-wrap gap-3">
              <Link
                className="ops-link"
                to={`/admin/customers/${customerKey(customer.phone)}`}
              >
                Customer history
              </Link>
              {customer.phone && (
                <>
                  <a className="ops-link" href={phoneHref(customer.phone)}>
                    Call customer
                  </a>
                  <a
                    className="ops-link"
                    href={`sms:${customer.phone.replace(/[^+\d]/g, "")}`}
                  >
                    SMS customer
                  </a>
                  <a
                    className="ops-link"
                    href={whatsappHref(
                      customer.phone,
                      `Hello, we are contacting you about ${record.orderNumber || record.bookingNumber}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp customer
                  </a>
                </>
              )}
              {customer.email && (
                <a className="ops-link" href={`mailto:${customer.email}`}>
                  Email customer
                </a>
              )}
            </div>
            <p className="ops-muted">
              Contact links open a manual conversation. They do not mark
              notifications as sent.
            </p>
          </Panel>
          {type === "order" ? (
            <>
              <Panel title="Ordered products">
                <ul className="space-y-4">
                  {record.items.map((item) => (
                    <li className="ops-line" key={item._id || item.product}>
                      <div>
                        <strong>{item.name}</strong>
                        <p className="ops-muted">
                          {money(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <strong>{money(item.price * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <dl className="ops-info">
                  <Info label="Subtotal" value={money(record.subtotal)} />
                  <Info
                    label="Delivery fee"
                    value={money(record.deliveryFee)}
                  />
                  <Info
                    label="Installation fee"
                    value={money(record.installationFee)}
                  />
                  <Info label="Total" value={money(record.total)} />
                  <Info
                    label="Payment method"
                    value={titleCase(record.paymentMethod)}
                  />
                  <Info
                    label="Payment state"
                    value={titleCase(record.paymentStatus)}
                  />
                </dl>
              </Panel>
              <Panel title="Fulfilment & installation">
                <dl className="ops-info">
                  <Info
                    label="Method"
                    value={titleCase(record.fulfillmentMethod)}
                  />
                  {record.fulfillmentMethod === "delivery" && (
                    <>
                      <Info
                        label="Address"
                        value={record.deliveryAddress?.address}
                      />
                      <Info
                        label="Town / area"
                        value={record.deliveryAddress?.town}
                      />
                      <Info
                        label="Landmark"
                        value={record.deliveryAddress?.landmark}
                      />
                    </>
                  )}
                  <Info
                    label="Installation requested"
                    value={record.installationRequired ? "Yes" : "No"}
                  />
                  {record.installationRequired && (
                    <Info
                      label="Installation address"
                      value={record.installationAddress}
                    />
                  )}
                </dl>
              </Panel>
            </>
          ) : (
            <>
              <Panel title="AC & service details">
                <dl className="ops-info">
                  <Info label="Service" value={titleCase(record.serviceType)} />
                  <Info label="AC type" value={record.acType} />
                  <Info label="Brand" value={record.brand} />
                  <Info label="Units" value={record.units} />
                </dl>
                <h3 className="font-bold">Problem / requirements</h3>
                <p className="whitespace-pre-wrap">{record.description}</p>
              </Panel>
              <Panel title="Requested schedule & location">
                <p className="ops-muted">
                  This is the customer's preferred schedule. Agree visit
                  arrangements directly before confirming.
                </p>
                <dl className="ops-info">
                  <Info
                    label="Preferred date"
                    value={new Date(record.preferredDate).toLocaleDateString(
                      "en-GH",
                    )}
                  />
                  <Info
                    label="Preferred time"
                    value={titleCase(record.preferredTime) || "Not specified"}
                  />
                  <Info label="Location" value={record.location} />
                  <Info label="Landmark" value={record.landmark} />
                </dl>
              </Panel>
            </>
          )}
          <Panel title="Customer-provided notes">
            <p className="whitespace-pre-wrap">
              {record.notes || "No additional notes were provided."}
            </p>
          </Panel>
          <Panel
            title="Internal operational notes"
            description="Only administrators can read these notes. Notes are appended with your name and cannot be edited or deleted."
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await mutate(
                  `${operationEndpoint}/notes`,
                  "POST",
                  { text: note, noteId: noteId.current },
                  "Internal note added.",
                );
                if (ok) {
                  setNote("");
                  noteId.current = crypto.randomUUID();
                }
              }}
            >
              <Control label="New internal note">
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </Control>
              <button
                className="ops-button mt-3"
                disabled={busy || !note.trim()}
              >
                Add internal note
              </button>
            </form>
            {record.internalNotes?.length ? (
              <ol className="ops-timeline">
                {[...record.internalNotes].reverse().map((n) => (
                  <li key={n.noteId || n._id}>
                    <p className="whitespace-pre-wrap">{n.text}</p>
                    <p className="ops-muted">
                      {n.authorName} · {dateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ops-muted">No internal notes yet.</p>
            )}
          </Panel>
          <Panel
            title="Activity history"
            description="Most recent 100 operational events."
          >
            <Timeline events={record.activity} />
          </Panel>
          <Panel
            title="Notification history"
            description="Email updates use the address recorded for each event. Failed attempts remain visible."
          >
            <NotificationHistory
              jobs={record.notifications}
              busy={busy}
              onRetry={retry}
            />
          </Panel>
        </div>
        <aside className="space-y-6">
          <Panel title={type === "order" ? "Manage order" : "Manage booking"}>
            <p className="ops-muted">
              {closed
                ? "This workflow is closed."
                : type === "booking" &&
                    record.status === "confirmed" &&
                    !record.assignedStaff
                  ? "Next: assign an active staff member, then mark technician assigned."
                  : `Next: ${titleCase(record.allowedTransitions?.find((s) => s !== "cancelled") || "Review or cancel")}.`}
            </p>
            <Control
              label={type === "order" ? "Order Status" : "Booking Status"}
            >
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={busy}
              >
                <option value={record.status}>
                  {titleCase(record.status)} (current)
                </option>
                {record.allowedTransitions?.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </Control>
            {type === "order" && (
              <Control label="Payment Status">
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  disabled={busy}
                >
                  {["pending", "paid", "failed", "refunded"].map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </Control>
            )}
            {record.status === "cancelled" && record.stockDeducted && (
              <p role="alert" className="ops-alert">
                Inventory restoration needs to finish. Save again to retry
                safely; restored items will not be counted twice.
              </p>
            )}
            <button
              className="ops-button w-full"
              disabled={
                busy ||
                (status === record.status &&
                  payment === (record.paymentStatus || "pending") &&
                  !record.stockDeducted &&
                  closed)
              }
              onClick={() => setConfirm(true)}
            >
              Save Changes
            </button>
          </Panel>
          <Panel
            title={type === "order" ? "Operational owner" : "Staff assignment"}
          >
            <p>
              <strong>{record.assignedStaffName || "Unassigned"}</strong>
              {record.assignedStaffActive === false && (
                <span className="ops-badge ops-badge-danger ml-2">
                  Inactive
                </span>
              )}
            </p>
            {record.assignedAt && (
              <p className="ops-muted">
                Assigned {dateTime(record.assignedAt)}
              </p>
            )}
            {!closed && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate(
                    `${operationEndpoint}/assignment`,
                    "POST",
                    { staffId, note: assignmentNote },
                    "Assignment saved.",
                  );
                }}
                className="space-y-4"
              >
                <Control
                  label="Find active staff"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search name or contact"
                />
                <Control label="Assign staff">
                  <select
                    required
                    value={staffId}
                    disabled={busy || staff.loading}
                    onChange={(e) => setStaffId(e.target.value)}
                  >
                    <option value="">Choose active staff</option>
                    {record.assignedStaff &&
                      !staff.data?.staff.some(
                        (s) => s._id === record.assignedStaff,
                      ) && (
                        <option value={record.assignedStaff} disabled>
                          {record.assignedStaffName} (current)
                        </option>
                      )}
                    {staff.data?.staff.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} · {s.role}
                      </option>
                    ))}
                  </select>
                </Control>
                {staff.error && <p role="alert">{staff.error}</p>}
                <Control label="Assignment note (internal)">
                  <textarea
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                </Control>
                <button
                  className="ops-button secondary"
                  disabled={
                    busy || !staffId || staffId === record.assignedStaff
                  }
                >
                  Save assignment
                </button>
              </form>
            )}
            <Link className="ops-link" to="/admin/staff">
              Manage staff
            </Link>
            <h3 className="font-bold">Assignment history</h3>
            {record.assignmentHistory?.length ? (
              <ol className="ops-timeline">
                {[...record.assignmentHistory].reverse().map((a) => (
                  <li key={a._id}>
                    <p>
                      {a.name} · {a.role}
                    </p>
                    <p className="ops-muted">
                      {a.actorName} · {dateTime(a.assignedAt)}
                    </p>
                    {a.note && (
                      <p className="whitespace-pre-wrap mt-2">{a.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ops-muted">No assignments yet.</p>
            )}
          </Panel>
        </aside>
      </div>
      {confirm && (
        <Confirmation
          title="Confirm operational change"
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={saveStatus}
        >
          <p>
            Set status to <strong>{titleCase(status)}</strong>
            {type === "order" && (
              <>
                {" "}
                and payment record to <strong>{titleCase(payment)}</strong>
              </>
            )}
            .
          </p>
          {status === "cancelled" && (
            <p>
              {type === "order"
                ? "Cancellation is final. Reserved stock will be restored once; interrupted restoration will be retried safely."
                : "Cancellation closes this service request and cannot be reversed."}
            </p>
          )}
          {["delivered", "completed"].includes(status) && (
            <p>This closes the workflow and cannot be reversed here.</p>
          )}
          <p>
            Eligible status changes queue a customer email update. Payment
            changes update the internal record only; they do not charge or
            refund money.
          </p>
        </Confirmation>
      )}
    </>
  );
}
function Info({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}
