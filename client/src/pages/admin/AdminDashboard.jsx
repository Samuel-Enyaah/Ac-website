
import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  CalendarDays,
  ClipboardList,
  Package,
  RefreshCw,
  ShoppingBag,
  Wrench,
} from "lucide-react";

import {
  getAdminDashboard,
} from "../../services/adminDashboardService";

export default function AdminDashboard() {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminDashboard();

        setDashboard(data);
      } catch (error) {
        console.error(
          "Dashboard loading failed:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "We could not load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-10 text-center">

        <AlertTriangle
          size={36}
          className="mx-auto text-red-400"
        />

        <h2 className="mt-5 text-xl font-bold text-[#0B1F33]">
          Dashboard unavailable
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {error}
        </p>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white"
        >
          <RefreshCw
            size={17}
          />

          Try Again
        </button>

      </div>
    );
  }

  const {
    stats,
    recentOrders,
    recentBookings,
    lowStockItems,
  } = dashboard;

  return (
    <div className="space-y-8">

      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33] sm:text-4xl">
            Business Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Monitor products, orders,
            service requests and
            inventory activity across
            R&J AC.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B1F33] transition hover:border-[#1687D9]"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>

      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={Package}
          label="Products"
          value={
            stats.totalProducts
          }
          description="Active products"
        />

        <StatCard
          icon={
            ClipboardList
          }
          label="Orders"
          value={
            stats.totalOrders
          }
          description={`${stats.pendingOrders} pending`}
          attention={
            stats.pendingOrders >
            0
          }
        />

        <StatCard
          icon={Wrench}
          label="Service Requests"
          value={
            stats.totalBookings
          }
          description={`${stats.pendingBookings} pending`}
          attention={
            stats.pendingBookings >
            0
          }
        />

        <StatCard
          icon={Boxes}
          label="Low Stock"
          value={
            stats.lowStockProducts
          }
          description="5 units or fewer"
          attention={
            stats.lowStockProducts >
            0
          }
        />

      </section>

      <section className="overflow-hidden rounded-3xl bg-[#0B1F33] text-white">

        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#74C5FF]">
              <Banknote
                size={23}
              />
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#74C5FF]">
              Recorded Paid Revenue
            </p>

            <p className="mt-2 text-3xl font-black sm:text-4xl">
              GH₵{" "}
              {Number(
                stats.paidRevenue
              ).toLocaleString()}
            </p>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              This amount only includes
              orders marked as paid and
              excludes cancelled orders.
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:min-w-64">

            <p className="text-sm text-white/50">
              Pending Orders
            </p>

            <p className="mt-1 text-3xl font-black">
              {
                stats.pendingOrders
              }
            </p>

            <Link
              to="/admin/orders"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#74C5FF]"
            >
              Manage orders

              <ArrowRight
                size={16}
              />
            </Link>

          </div>

        </div>

      </section>

      <section className="grid gap-6 xl:grid-cols-2">

        <DashboardPanel
          title="Recent Orders"
          description="Latest customer purchases"
          actionLabel="View all orders"
          actionPath="/admin/orders"
        >
          {recentOrders.length ===
          0 ? (
            <EmptyState
              icon={
                ShoppingBag
              }
              title="No orders yet"
              text="New customer orders will appear here."
            />
          ) : (
            <div className="divide-y divide-gray-100">

              {recentOrders.map(
                (order) => (
                  <RecentOrder
                    key={
                      order.id
                    }
                    order={
                      order
                    }
                  />
                )
              )}

            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent Service Requests"
          description="Latest AC service bookings"
          actionLabel="View all bookings"
          actionPath="/admin/bookings"
        >
          {recentBookings.length ===
          0 ? (
            <EmptyState
              icon={Wrench}
              title="No service requests yet"
              text="New service bookings will appear here."
            />
          ) : (
            <div className="divide-y divide-gray-100">

              {recentBookings.map(
                (booking) => (
                  <RecentBooking
                    key={
                      booking.id
                    }
                    booking={
                      booking
                    }
                  />
                )
              )}

            </div>
          )}
        </DashboardPanel>

      </section>

      <DashboardPanel
        title="Inventory Attention"
        description="Active products with 5 units or fewer remaining"
        actionLabel="Open inventory"
        actionPath="/admin/inventory"
      >

        {lowStockItems.length ===
        0 ? (
          <div className="flex items-center gap-4 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Boxes
                size={20}
              />
            </div>

            <div>
              <p className="font-bold text-[#0B1F33]">
                Stock levels look good
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No active products are
                currently at or below the
                low-stock threshold.
              </p>
            </div>

          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">

            {lowStockItems.map(
              (product) => (
                <div
                  key={
                    product.id
                  }
                  className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                      <AlertTriangle
                        size={19}
                      />
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600">
                      {
                        product.stock
                      }{" "}
                      left
                    </span>

                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                    {
                      product.category
                    }
                  </p>

                  <p className="mt-1 font-bold text-[#0B1F33]">
                    {
                      product.name
                    }
                  </p>

                </div>
              )
            )}

          </div>
        )}

      </DashboardPanel>

    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  attention = false,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            attention
              ? "bg-orange-50 text-orange-500"
              : "bg-[#EAF6FF] text-[#1687D9]"
          }`}
        >
          <Icon
            size={21}
          />
        </div>

        {attention && (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
            Attention
          </span>
        )}

      </div>

      <p className="mt-6 text-sm font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-[#0B1F33]">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
}

function DashboardPanel({
  title,
  description,
  actionLabel,
  actionPath,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">

        <div>
          <h2 className="font-bold text-[#0B1F33]">
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <Link
          to={actionPath}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#1687D9]"
        >
          {actionLabel}

          <ArrowRight
            size={14}
          />
        </Link>

      </div>

      {children}

    </section>
  );
}

function RecentOrder({
  order,
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

      <div className="min-w-0">

        <div className="flex flex-wrap items-center gap-2">

          <p className="font-bold text-[#0B1F33]">
            {
              order.orderNumber
            }
          </p>

          <StatusBadge
            status={
              order.status
            }
          />

        </div>

        <p className="mt-2 truncate text-sm font-medium text-gray-600">
          {
            order.customerName
          }
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {formatDateTime(
            order.createdAt
          )}
        </p>

      </div>

      <div className="sm:text-right">

        <p className="font-black text-[#0B1F33]">
          GH₵{" "}
          {Number(
            order.total
          ).toLocaleString()}
        </p>

        <p className="mt-1 text-xs capitalize text-gray-500">
          Payment:{" "}
          {
            order.paymentStatus
          }
        </p>

      </div>

    </div>
  );
}

function RecentBooking({
  booking,
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

      <div className="min-w-0">

        <div className="flex flex-wrap items-center gap-2">

          <p className="font-bold text-[#0B1F33]">
            {
              booking.bookingNumber
            }
          </p>

          <StatusBadge
            status={
              booking.status
            }
          />

        </div>

        <p className="mt-2 text-sm font-medium text-gray-600">
          {
            booking.customerName
          }
        </p>

        <p className="mt-1 truncate text-xs text-gray-400">
          {formatServiceType(
            booking.serviceType
          )}
          {" • "}
          {booking.location}
        </p>

      </div>

      <div className="sm:text-right">

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <CalendarDays
            size={14}
          />

          {formatDate(
            booking.preferredDate
          )}
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Requested{" "}
          {formatDateTime(
            booking.createdAt
          )}
        </p>

      </div>

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

    processing:
      "bg-purple-50 text-purple-700",

    ready:
      "bg-cyan-50 text-cyan-700",

    "out-for-delivery":
      "bg-indigo-50 text-indigo-700",

    delivered:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",

    "technician-assigned":
      "bg-blue-50 text-blue-700",

    "in-progress":
      "bg-purple-50 text-purple-700",

    completed:
      "bg-green-50 text-green-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {String(
        status || ""
      ).replaceAll(
        "-",
        " "
      )}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="p-10 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#1687D9]">
        <Icon
          size={22}
        />
      </div>

      <p className="mt-4 font-bold text-[#0B1F33]">
        {title}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {text}
      </p>

    </div>
  );
}

function DashboardLoading() {
  return (
    <div>

      <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />

      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <div
              key={
                index
              }
              className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          )
        )}

      </div>

      <div className="mt-8 h-56 animate-pulse rounded-3xl bg-gray-200" />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">

        <div className="h-96 animate-pulse rounded-3xl border border-gray-200 bg-white" />

        <div className="h-96 animate-pulse rounded-3xl border border-gray-200 bg-white" />

      </div>

    </div>
  );
}

function formatServiceType(
  value
) {
  if (!value) {
    return "Service";
  }

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
    return "No date";
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