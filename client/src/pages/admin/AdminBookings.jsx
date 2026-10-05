import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";

import {
  getAdminServiceBookings,
} from "../../services/adminServiceBookingService";

const statusOptions = [
  {
    value: "all",
    label: "All Statuses",
  },
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

const serviceOptions = [
  {
    value: "all",
    label: "All Services",
  },
  {
    value:
      "installation",
    label: "Installation",
  },
  {
    value: "repairs",
    label: "Repairs",
  },
  {
    value:
      "maintenance",
    label: "Maintenance",
  },
  {
    value:
      "diagnosis",
    label: "Diagnosis",
  },
  {
    value:
      "spare-parts",
    label: "Spare Parts",
  },
  {
    value:
      "commercial",
    label: "Commercial",
  },
];

export default function AdminBookings() {
  const [
    bookings,
    setBookings,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    serviceType,
    setServiceType,
  ] = useState("all");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadBookings =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminServiceBookings({
            page,
            limit: 10,
            search,
            status,
            serviceType,
          });

        setBookings(
          result.bookings || []
        );

        setPagination(
          result.pagination
        );
      } catch (error) {
        console.error(
          "Bookings loading failed:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "We could not load service bookings."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadBookings();
  }, [
    page,
    search,
    status,
    serviceType,
  ]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  return (
    <div className="space-y-7">

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Service Bookings
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Service Requests
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review customer AC
            service requests and
            manage their progress.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadBookings
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B1F33]"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>

      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

        <form
          onSubmit={
            handleSearch
          }
          className="grid gap-4 xl:grid-cols-[1fr_220px_220px_auto]"
        >

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={
                searchInput
              }
              onChange={(
                event
              ) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search booking reference, customer, phone or location..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
            />

          </div>

          <select
            value={status}
            onChange={(
              event
            ) => {
              setPage(1);

              setStatus(
                event.target.value
              );
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
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

          <select
            value={
              serviceType
            }
            onChange={(
              event
            ) => {
              setPage(1);

              setServiceType(
                event.target.value
              );
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
          >

            {serviceOptions.map(
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

          <button
            type="submit"
            className="rounded-xl bg-[#1687D9] px-6 py-3 text-sm font-bold text-white"
          >
            Search
          </button>

        </form>

      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">

          <div>
            <h2 className="font-bold text-[#0B1F33]">
              Service Requests
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {
                pagination.total
              }{" "}
              booking
              {pagination.total ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          <Wrench
            size={21}
            className="text-[#1687D9]"
          />

        </div>

        {loading ? (
          <BookingsLoading />
        ) : error ? (
          <div className="p-12 text-center">

            <p className="font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadBookings
              }
              className="mt-5 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>

          </div>
        ) : bookings.length ===
          0 ? (
          <div className="p-16 text-center">

            <Wrench
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-lg font-bold text-[#0B1F33]">
              No service bookings found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your
              search or filters.
            </p>

          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">

              <table className="min-w-full">

                <thead className="bg-[#F8FAFC]">

                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-400">

                    <th className="px-6 py-4">
                      Booking
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Service
                    </th>

                    <th className="px-6 py-4">
                      Preferred Date
                    </th>

                    <th className="px-6 py-4">
                      Location
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4" />

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {bookings.map(
                    (booking) => (
                      <BookingTableRow
                        key={
                          booking._id
                        }
                        booking={
                          booking
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="divide-y divide-gray-100 lg:hidden">

              {bookings.map(
                (booking) => (
                  <BookingMobileCard
                    key={
                      booking._id
                    }
                    booking={
                      booking
                    }
                  />
                )
              )}

            </div>
          </>
        )}

        {!loading &&
          !error &&
          pagination.total > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <p className="text-sm text-gray-500">
                Page{" "}
                {
                  pagination.page
                }{" "}
                of{" "}
                {
                  pagination.pages
                }
              </p>

              <div className="flex gap-2">

                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#0B1F33] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />

                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.pages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          current + 1,
                          pagination.pages
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#0B1F33] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>
          )}

      </section>

    </div>
  );
}

function BookingTableRow({
  booking,
}) {
  return (
    <tr className="text-sm">

      <td className="px-6 py-5">

        <p className="font-bold text-[#0B1F33]">
          {
            booking.bookingNumber
          }
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {formatDate(
            booking.createdAt
          )}
        </p>

      </td>

      <td className="px-6 py-5">

        <p className="font-semibold text-[#0B1F33]">
          {
            booking.customer
              ?.name
          }
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {
            booking.customer
              ?.phone
          }
        </p>

      </td>

      <td className="px-6 py-5">

        <p className="font-semibold text-gray-700">
          {formatText(
            booking.serviceType
          )}
        </p>

        {booking.brand && (
          <p className="mt-1 text-xs text-gray-400">
            {
              booking.brand
            }
          </p>
        )}

      </td>

      <td className="px-6 py-5">

        <div className="flex items-center gap-2 text-gray-600">

          <CalendarDays
            size={15}
          />

          {formatDate(
            booking.preferredDate
          )}

        </div>

        {booking.preferredTime && (
          <p className="mt-1 text-xs capitalize text-gray-400">
            {
              booking.preferredTime
            }
          </p>
        )}

      </td>

      <td className="max-w-48 px-6 py-5">

        <p className="truncate text-gray-600">
          {
            booking.location
          }
        </p>

      </td>

      <td className="px-6 py-5">

        <StatusBadge
          status={
            booking.status
          }
        />

      </td>

      <td className="px-6 py-5">

        <Link
          to={`/admin/bookings/${booking._id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#1687D9] hover:text-[#1687D9]"
        >
          <Eye
            size={17}
          />
        </Link>

      </td>

    </tr>
  );
}

function BookingMobileCard({
  booking,
}) {
  return (
    <div className="p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="font-bold text-[#0B1F33]">
            {
              booking.bookingNumber
            }
          </p>

          <p className="mt-1 text-sm text-gray-600">
            {
              booking.customer
                ?.name
            }
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {
              booking.customer
                ?.phone
            }
          </p>

        </div>

        <Link
          to={`/admin/bookings/${booking._id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]"
        >
          <Eye
            size={18}
          />
        </Link>

      </div>

      <div className="mt-4">

        <StatusBadge
          status={
            booking.status
          }
        />

      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">

        <div>
          <p className="text-xs text-gray-400">
            Service
          </p>

          <p className="mt-1 font-semibold text-[#0B1F33]">
            {formatText(
              booking.serviceType
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">
            Preferred Date
          </p>

          <p className="mt-1 font-semibold text-[#0B1F33]">
            {formatDate(
              booking.preferredDate
            )}
          </p>
        </div>

      </div>

      <p className="mt-4 truncate text-sm text-gray-500">
        {
          booking.location
        }
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
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

function BookingsLoading() {
  return (
    <div className="divide-y divide-gray-100">

      {Array.from({
        length: 6,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 p-6"
          >

            <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />

            <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />

            <div className="ml-auto h-8 w-24 animate-pulse rounded-full bg-gray-100" />

          </div>
        )
      )}

    </div>
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
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}