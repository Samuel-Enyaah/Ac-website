import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";

import {
  getAdminOrders,
} from "../../services/adminOrderService";

const orderStatuses = [
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
    value: "processing",
    label: "Processing",
  },
  {
    value: "ready",
    label: "Ready",
  },
  {
    value:
      "out-for-delivery",
    label:
      "Out for Delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const paymentStatuses = [
  {
    value: "all",
    label: "All Payments",
  },
  {
    value: "pending",
    label:
      "Payment Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

export default function AdminOrders() {
  const [
    orders,
    setOrders,
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
    paymentStatus,
    setPaymentStatus,
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

  const loadOrders =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminOrders({
            page,
            limit: 10,
            search,
            status,
            paymentStatus,
          });

        setOrders(
          result.orders || []
        );

        setPagination(
          result.pagination
        );
      } catch (error) {
        console.error(
          "Orders loading failed:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "We could not load orders."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadOrders();
  }, [
    page,
    search,
    status,
    paymentStatus,
  ]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  const handleStatusChange =
    (event) => {
      setPage(1);

      setStatus(
        event.target.value
      );
    };

  const handlePaymentChange =
    (event) => {
      setPage(1);

      setPaymentStatus(
        event.target.value
      );
    };

  return (
    <div className="space-y-7">

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Orders
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Customer Orders
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review purchases,
            customer information,
            payments and order
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadOrders
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
                  event.target
                    .value
                )
              }
              placeholder="Search order number, customer, phone or email..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
            />

          </div>

          <select
            value={status}
            onChange={
              handleStatusChange
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
          >
            {orderStatuses.map(
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
              paymentStatus
            }
            onChange={
              handlePaymentChange
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
          >
            {paymentStatuses.map(
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
              Orders
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {
                pagination.total
              }{" "}
              total order
              {pagination.total ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          <ShoppingBag
            size={21}
            className="text-[#1687D9]"
          />

        </div>

        {loading ? (
          <OrdersLoading />
        ) : error ? (
          <div className="p-12 text-center">

            <p className="font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadOrders
              }
              className="mt-5 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>

          </div>
        ) : orders.length ===
          0 ? (
          <div className="p-16 text-center">

            <PackageSearch
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-lg font-bold text-[#0B1F33]">
              No orders found
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
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Items
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Order Status
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4" />

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {orders.map(
                    (order) => (
                      <OrderTableRow
                        key={
                          order._id
                        }
                        order={
                          order
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="divide-y divide-gray-100 lg:hidden">

              {orders.map(
                (order) => (
                  <OrderMobileCard
                    key={
                      order._id
                    }
                    order={
                      order
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
                          current -
                            1,
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
                          current +
                            1,
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

function OrderTableRow({
  order,
}) {
  return (
    <tr className="text-sm">

      <td className="px-6 py-5">

        <p className="font-bold text-[#0B1F33]">
          {
            order.orderNumber
          }
        </p>

        <p className="mt-1 text-xs capitalize text-gray-400">
          {
            order.fulfillmentMethod
          }
        </p>

      </td>

      <td className="px-6 py-5">

        <p className="font-semibold text-[#0B1F33]">
          {
            order.customer
              ?.fullName
          }
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {
            order.customer
              ?.phone
          }
        </p>

      </td>

      <td className="px-6 py-5 text-gray-600">
        {
          order.items?.reduce(
            (
              total,
              item
            ) =>
              total +
              item.quantity,
            0
          ) || 0
        }
      </td>

      <td className="px-6 py-5 font-bold text-[#0B1F33]">
        GH₵{" "}
        {Number(
          order.total
        ).toLocaleString()}
      </td>

      <td className="px-6 py-5">
        <StatusBadge
          status={
            order.status
          }
        />
      </td>

      <td className="px-6 py-5">
        <PaymentBadge
          status={
            order.paymentStatus
          }
        />
      </td>

      <td className="px-6 py-5 text-xs text-gray-500">
        {formatDate(
          order.createdAt
        )}
      </td>

      <td className="px-6 py-5">

        <Link
          to={`/admin/orders/${order._id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#1687D9] hover:text-[#1687D9]"
        >
          <Eye size={17} />
        </Link>

      </td>

    </tr>
  );
}

function OrderMobileCard({
  order,
}) {
  return (
    <div className="p-5">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="font-bold text-[#0B1F33]">
            {
              order.orderNumber
            }
          </p>

          <p className="mt-1 text-sm text-gray-600">
            {
              order.customer
                ?.fullName
            }
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {
              order.customer
                ?.phone
            }
          </p>
        </div>

        <Link
          to={`/admin/orders/${order._id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]"
        >
          <Eye size={18} />
        </Link>

      </div>

      <div className="mt-5 flex flex-wrap gap-2">

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

      </div>

      <div className="mt-5 flex items-end justify-between">

        <div>
          <p className="text-xs text-gray-400">
            {
              formatDate(
                order.createdAt
              )
            }
          </p>

          <p className="mt-1 text-xs capitalize text-gray-500">
            {
              order.fulfillmentMethod
            }
          </p>
        </div>

        <p className="text-lg font-black text-[#0B1F33]">
          GH₵{" "}
          {Number(
            order.total
          ).toLocaleString()}
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
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function OrdersLoading() {
  return (
    <div className="divide-y divide-gray-100">

      {Array.from({
        length: 6,
      }).map(
        (_, index) => (
          <div
            key={
              index
            }
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