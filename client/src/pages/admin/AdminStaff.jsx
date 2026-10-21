import { useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import api from "../../services/api";
import useAdminResource from "../../hooks/useAdminResource";
import {
  Control,
  Panel,
  LoadState,
  Confirmation,
  Timeline,
} from "../../components/admin/OperationsUI";
import { staffRoles } from "../../utils/operations";

export default function AdminStaff({ creating = false }) {
  const { staffId } = useParams();
  if (creating) return <StaffEditor key="new" />;
  if (staffId) return <StaffDetails key={staffId} id={staffId} />;
  return <StaffList />;
}
function StaffList() {
  const [params, setParams] = useSearchParams();
  const resource = useAdminResource(`/admin/staff?${params}`);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">People & responsibility</p>
          <h1>Staff directory</h1>
          <p className="ops-muted">
            Assignment records only. Creating staff does not grant admin login
            access.
          </p>
        </div>
        <Link className="ops-button" to="/admin/staff/new">
          Add staff
        </Link>
      </header>
      <div className="ops-panel ops-filters">
        <Control
          label="Search staff"
          value={params.get("search") || ""}
          onChange={(e) => update("search", e.target.value)}
        />
        <Control label="Role">
          <select
            value={params.get("role") || ""}
            onChange={(e) => update("role", e.target.value)}
          >
            <option value="">All roles</option>
            {staffRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </Control>
        <Control
          label="Skill / specialization"
          value={params.get("skill") || ""}
          onChange={(e) => update("skill", e.target.value)}
        />
        <Control label="Staff status">
          <select
            value={params.get("active") || ""}
            onChange={(e) => update("active", e.target.value)}
          >
            <option value="">Active and inactive</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Control>
        <button className="ops-button secondary" onClick={() => setParams({})}>
          Clear filters
        </button>
      </div>
      <LoadState {...resource} retry={resource.reload} />
      {!resource.loading && !resource.error && (
        <>
          <div className="ops-card-grid">
            {resource.data.staff.map((staff) => (
              <article className="ops-panel" key={staff._id}>
                <Link className="ops-link" to={`/admin/staff/${staff._id}`}>
                  {staff.name}
                </Link>
                <p className="ops-muted">{staff.role}</p>
                <span
                  className={`ops-badge mt-3 ${staff.active ? "ops-badge-good" : "ops-badge-danger"}`}
                >
                  {staff.active ? "Active" : "Inactive"}
                </span>
                <p className="mt-4">{staff.phone || "No phone"}</p>
                <p className="ops-muted">{staff.email || "No email"}</p>
                <p className="ops-muted mt-3">
                  {staff.skills.join(", ") || "No skills listed"}
                </p>
              </article>
            ))}
          </div>
          {!resource.data.staff.length && (
            <p className="ops-panel">
              No matching staff. Add a staff record or clear your filters.
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className="ops-button secondary"
              disabled={resource.data.pagination.page <= 1}
              onClick={() =>
                update("page", String(resource.data.pagination.page - 1))
              }
            >
              Previous
            </button>
            <p>
              Page {resource.data.pagination.page} of{" "}
              {resource.data.pagination.pages}
            </p>
            <button
              className="ops-button secondary"
              disabled={
                resource.data.pagination.page >= resource.data.pagination.pages
              }
              onClick={() =>
                update("page", String(resource.data.pagination.page + 1))
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function StaffDetails({ id }) {
  const resource = useAdminResource(`/admin/staff/${id}`);
  if (resource.loading || resource.error)
    return <LoadState {...resource} retry={resource.reload} />;
  return (
    <StaffEditor
      key={`${id}:${resource.data.staff.__v}`}
      staff={resource.data.staff}
      activity={resource.data.activity}
      reload={resource.reload}
    />
  );
}
function StaffEditor({ staff, activity = [], reload }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(
    staff
      ? {
          name: staff.name,
          phone: staff.phone,
          email: staff.email,
          role: staff.role,
          active: staff.active,
          skills: staff.skills.join(", "),
          notes: staff.notes,
        }
      : {
          name: "",
          phone: "",
          email: "",
          role: "Technician",
          active: true,
          skills: "",
          notes: "",
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const lock = useRef(false);
  const field = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        skills: [
          ...new Set(
            form.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ],
      };
      const result = await api.request({
        url: `/admin/staff${staff ? `/${staff._id}` : ""}`,
        method: staff ? "PATCH" : "POST",
        data,
      });
      setConfirmation(false);
      if (reload) await reload();
      else navigate(`/admin/staff/${result.data.staff._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save staff record.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="ops-page">
      <Link className="ops-link justify-self-start" to="/admin/staff">
        Back to Staff
      </Link>
      <header className="ops-heading">
        <div>
          <p className="ops-eyebrow">Staff assignment record</p>
          <h1>{staff ? staff.name : "Add staff"}</h1>
          <p className="ops-muted">
            No login account or password is created. Deactivation preserves
            previous assignments.
          </p>
        </div>
      </header>
      {error && (
        <p role="alert" className="ops-alert error">
          {error}
        </p>
      )}
      <Panel title="Staff details">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (staff && staff.active !== form.active) setConfirmation(true);
            else save();
          }}
        >
          <fieldset disabled={busy} className="ops-filters">
            <Control
              label="Staff name"
              value={form.name}
              required
              minLength={2}
              maxLength={120}
              onChange={(e) => field("name", e.target.value)}
            />
            <Control
              label="Phone"
              value={form.phone}
              type="tel"
              maxLength={40}
              onChange={(e) => field("phone", e.target.value)}
            />
            <Control
              label="Email"
              value={form.email}
              type="email"
              maxLength={254}
              onChange={(e) => field("email", e.target.value)}
            />
            <Control label="Role">
              <select
                value={form.role}
                onChange={(e) => field("role", e.target.value)}
              >
                {staffRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </Control>
            <Control
              label="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => field("skills", e.target.value)}
            />
            <Control label="Staff status">
              <select
                value={String(form.active)}
                onChange={(e) => field("active", e.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Control>
          </fieldset>
          <Control label="Internal directory notes">
            <textarea
              value={form.notes}
              onChange={(e) => field("notes", e.target.value)}
              maxLength={2000}
              rows={4}
              disabled={busy}
            />
          </Control>
          <button className="ops-button" disabled={busy}>
            {busy ? "Saving..." : "Save staff"}
          </button>
        </form>
      </Panel>
      {staff && (
        <Panel title="Staff activity">
          <Timeline events={activity} />
        </Panel>
      )}
      {confirmation && (
        <Confirmation
          title={
            form.active ? "Reactivate staff member" : "Deactivate staff member"
          }
          busy={busy}
          onConfirm={save}
          onClose={() => setConfirmation(false)}
        >
          {form.active
            ? "This person will become available for new assignments."
            : "This person will no longer be available for new assignments. Existing responsibilities and assignment history remain visible; review open work for reassignment."}
        </Confirmation>
      )}
    </div>
  );
}
