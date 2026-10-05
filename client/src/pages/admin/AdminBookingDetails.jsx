import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Snowflake,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  getAdminServiceBooking,
  updateAdminServiceBooking,
} from "../../services/adminServiceBookingService";

const statusOptions = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value:
      "technician-assigned",
    label:
      "Technician Assigned",
  },
  {
    value:
      "in-progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function AdminBookingDetails() {
  const {
    bookingId,
  } = useParams();

  const [
    booking,
    setBooking,
  ] = useState(null);

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const loadBooking =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminServiceBooking(
            bookingId
          );

        setBooking(data);

        setStatus(
          data.status
        );
      } catch (error) {
        console.error(
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Unable to load the service booking."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const handleSave =
    async () => {
      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const updated =
          await updateAdminServiceBooking(
            bookingId,
            {
              status,
            }
          );

        setBooking(
          updated
        );

        setStatus(
          updated.status
        );

        setSuccess(
          "Service booking updated successfully."
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to update the service booking."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

        <RefreshCw
          size={28}
          className="mx-auto animate-spin text-[#1687D9]"
        />

        <p className="mt-4 text-sm text-gray-500">
          Loading service booking...
        </p>

      </div>
    );
  }

  if (
    error &&
    !booking
  ) {
    return (
      <div>

        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Service Bookings
        </Link>

        <div className="mt-6 rounded-3xl border border-red-100 bg-white p-12 text-center">

          <p className="font-semibold text-red-600">
            {error}
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">

      <div>

        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Service Bookings
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
              Service Booking
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
              {
                booking.bookingNumber
              }
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Submitted{" "}
              {formatDateTime(
                booking.createdAt
              )}
            </p>

          </div>

          <StatusBadge
            status={
              booking.status
            }
          />

        </div>

      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        <div className="space-y-6">

          <Section
            icon={UserRound}
            title="Customer Information"
          >

            <InfoGrid>

              <Info
                label="Full Name"
                value={
                  booking.customer
                    ?.name
                }
              />

              <Info
                label="Phone"
                value={
                  booking.customer
                    ?.phone
                }
              />

              <Info
                label="Email"
                value={
                  booking.customer
                    ?.email ||
                  "Not provided"
                }
              />

            </InfoGrid>

          </Section>

          <Section
            icon={Snowflake}
            title="AC & Service Details"
          >

            <InfoGrid>

              <Info
                label="Service Type"
                value={
                  formatText(
                    booking.serviceType
                  )
                }
              />

              <Info
                label="AC Type"
                value={
                  booking.acType
                    ? formatText(
                        booking.acType
                      )
                    : "Not provided"
                }
              />

              <Info
                label="Brand"
                value={
                  booking.brand ||
                  "Not provided"
                }
              />

              <Info
                label="Number of Units"
                value={
                  booking.units
                }
              />

            </InfoGrid>

            <div className="mt-6 border-t border-gray-100 pt-5">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Problem / Service Description
              </p>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                {
                  booking.description
                }
              </p>

            </div>

          </Section>

          <Section
            icon={
              CalendarDays
            }
            title="Preferred Schedule"
          >

            <InfoGrid>

              <Info
                label="Preferred Date"
                value={
                  formatDate(
                    booking.preferredDate
                  )
                }
              />

              <Info
                label="Preferred Time"
                value={
                  booking.preferredTime
                    ? formatText(
                        booking.preferredTime
                      )
                    : "Not specified"
                }
              />

            </InfoGrid>

          </Section>

          <Section
            icon={MapPin}
            title="Service Location"
          >

            <InfoGrid>

              <Info
                label="Location"
                value={
                  booking.location
                }
              />

              <Info
                label="Nearest Landmark"
                value={
                  booking.landmark ||
                  "Not provided"
                }
              />

            </InfoGrid>

          </Section>

          <Section
            icon={Wrench}
            title="Additional Notes"
          >

            <p className="text-sm leading-7 text-gray-600">
              {booking.notes ||
                "No additional notes were provided."}
            </p>

          </Section>

        </div>

        <aside className="space-y-6">

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1687D9]">
              Manage Request
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#0B1F33]">
              Service Status
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Update this request as
              it moves through the
              service process.
            </p>

            <label className="mt-6 block">

              <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Current Status
              </span>

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
              >

                {statusOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}

              </select>

            </label>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                handleSave
              }
              className="mt-6 w-full rounded-xl bg-[#1687D9] px-5 py-3.5 font-bold text-white transition hover:bg-[#1176BF] disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </section>

          <section className="rounded-3xl bg-[#0B1F33] p-6 text-white">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#74C5FF]">

              <Clock
                size={21}
              />

            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[#74C5FF]">
              Appointment
            </p>

            <p className="mt-3 text-xl font-black">
              {formatDate(
                booking.preferredDate
              )}
            </p>

            <p className="mt-2 capitalize text-white/60">
              {booking.preferredTime
                ? formatText(
                    booking.preferredTime
                  )
                : "Time not specified"}
            </p>

            <div className="mt-6 border-t border-white/10 pt-5">

              <p className="text-xs uppercase tracking-wider text-white/40">
                Service
              </p>

              <p className="mt-2 font-semibold">
                {formatText(
                  booking.serviceType
                )}
              </p>

            </div>

            <div className="mt-5">

              <p className="text-xs uppercase tracking-wider text-white/40">
                Location
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                {
                  booking.location
                }
              </p>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
          <Icon
            size={19}
          />
        </div>

        <h2 className="font-bold text-[#0B1F33]">
          {title}
        </h2>

      </div>

      <div className="pt-5">
        {children}
      </div>

    </section>
  );
}

function InfoGrid({
  children,
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-[#0B1F33]">
        {value ||
          "Not provided"}
      </p>

    </div>
  );
}

function StatusBadge({
  status,
}) {
  const styles = {
    pending:
      "bg-orange-50 text-orange-700",

    confirmed:
      "bg-blue-50 text-blue-700",

    "technician-assigned":
      "bg-cyan-50 text-cyan-700",

    "in-progress":
      "bg-purple-50 text-purple-700",

    completed:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {formatText(
        status
      )}
    </span>
  );
}

function formatText(
  value = ""
) {
  return value
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

function formatDateTime(
  value
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}