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
  Banknote,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  getAdminCustomer,
} from "../../services/adminCustomerService";

export default function AdminCustomerDetails() {
  const {
    customerKey,
  } = useParams();

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadCustomer =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminCustomer(
            customerKey
          );

        setData(result);
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load customer."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadCustomer();
  }, [customerKey]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

        <RefreshCw
          size={28}
          className="mx-auto animate-spin text-[#1687D9]"
        />

        <p className="mt-4 text-sm text-gray-500">
          Loading customer...
        </p>

      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div>

        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Customers
        </Link>

        <div className="mt-6 rounded-3xl border border-red-100 bg-white p-12 text-center text-red-600">
          {error}
        </div>

      </div>
    );
  }

  const {
    customer,
    orders,
    bookings,
  } = data;

  return (
    <div className="space-y-7">

      <section>

        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Customers
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#1687D9]">

              <UserRound
                size={28}
              />

            </div>

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
                Customer
              </p>

              <h1 className="mt-1 text-3xl font-black text-[#0B1F33]">
                {customer.name}
              </h1>

            </div>

          </div>

        </div>

      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={
            ClipboardList
          }
          label="Total Orders"
          value={
            customer.totalOrders
          }
        />

        <StatCard
          icon={ShoppingBag}
          label="Purchases"
          value={
            customer.purchases
          }
        />

        <StatCard
          icon={Wrench}
          label="Service Requests"
          value={
            customer.serviceRequests
          }
        />

        <StatCard
          icon={Banknote}
          label="Paid Spend"
          value={`GH₵ ${Number(
            customer.totalSpent
          ).toLocaleString()}`}
        />

      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

        <h2 className="text-lg font-bold text-[#0B1F33]">
          Contact Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          <ContactInfo
            icon={UserRound}
            label="Name"
            value={
              customer.name
            }
          />

          <ContactInfo
            icon={Phone}
            label="Phone"
            value={
              customer.phone
            }
          />

          <ContactInfo
            icon={Mail}
            label="Email"
            value={
              customer.email ||
              "Not provided"
            }
          />

        </div>

      </section>

      <HistoryPanel
        title="Order History"
        icon={ShoppingBag}
      >

        {orders.length ===
        0 ? (
          <EmptyHistory text="No orders for this customer." />
        ) : (
          <div className="divide-y divide-gray-100">

            {orders.map(
              (order) => (
                <div
                  key={
                    order._id
                  }
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >

                  <div>

                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="font-bold text-[#0B1F33] hover:text-[#1687D9]"
                    >
                      {
                        order.orderNumber
                      }
                    </Link>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(
                        order.createdAt
                      )}
                    </p>

                    <p className="mt-2 text-sm capitalize text-gray-500">
                      {
                        order.fulfillmentMethod
                      }
                    </p>

                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">

                    <StatusBadge
                      status={
                        order.status
                      }
                    />

                    <PaymentBadge
                      status={
                        order.paymentStatus
                      }
                    />

                    <p className="min-w-28 text-right font-black text-[#0B1F33]">
                      GH₵{" "}
                      {Number(
                        order.total
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </HistoryPanel>

      <HistoryPanel
        title="Service History"
        icon={Wrench}
      >

        {bookings.length ===
        0 ? (
          <EmptyHistory text="No service requests for this customer." />
        ) : (
          <div className="divide-y divide-gray-100">

            {bookings.map(
              (booking) => (
                <div
                  key={
                    booking._id
                  }
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >

                  <div>

                    <Link
                      to={`/admin/bookings/${booking._id}`}
                      className="font-bold text-[#0B1F33] hover:text-[#1687D9]"
                    >
                      {
                        booking.bookingNumber
                      }
                    </Link>

                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      {formatText(
                        booking.serviceType
                      )}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">

                      <MapPin
                        size={13}
                      />

                      {
                        booking.location
                      }

                    </div>

                  </div>

                  <div className="sm:text-right">

                    <StatusBadge
                      status={
                        booking.status
                      }
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Preferred:{" "}
                      {formatDate(
                        booking.preferredDate
                      )}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </HistoryPanel>

    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
        <Icon size={21} />
      </div>

      <p className="mt-5 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#0B1F33]">
        {value}
      </p>

    </div>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#F7FAFC] p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1687D9]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#0B1F33]">
          {value}
        </p>

      </div>

    </div>
  );
}

function HistoryPanel({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
          <Icon size={19} />
        </div>

        <h2 className="font-bold text-[#0B1F33]">
          {title}
        </h2>

      </div>

      {children}

    </section>
  );
}

function EmptyHistory({
  text,
}) {
  return (
    <div className="p-10 text-center text-sm text-gray-500">
      {text}
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

    completed:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",

    "technician-assigned":
      "bg-cyan-50 text-cyan-700",

    "in-progress":
      "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
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

function PaymentBadge({
  status,
}) {
  const styles = {
    pending:
      "bg-orange-50 text-orange-700",

    paid:
      "bg-green-50 text-green-700",

    failed:
      "bg-red-50 text-red-700",

    refunded:
      "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
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
  return String(value)
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