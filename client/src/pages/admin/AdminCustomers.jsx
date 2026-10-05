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
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import {
  getAdminCustomers,
} from "../../services/adminCustomerService";

export default function AdminCustomers() {
  const [
    customers,
    setCustomers,
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

  const loadCustomers =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminCustomers({
            page,
            limit: 10,
            search,
          });

        setCustomers(
          result.customers || []
        );

        setPagination(
          result.pagination
        );
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data
            ?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadCustomers();
  }, [
    page,
    search,
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
            Customers
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Customer Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Customer profiles are
            automatically built from
            orders and service bookings.
          </p>

        </div>

        <button
          type="button"
          onClick={
            loadCustomers
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
          className="flex flex-col gap-4 sm:flex-row"
        >

          <div className="relative flex-1">

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
              placeholder="Search name, phone or email..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
            />

          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#1687D9] px-7 py-3 text-sm font-bold text-white"
          >
            Search
          </button>

        </form>

      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">

          <div>

            <h2 className="font-bold text-[#0B1F33]">
              Customers
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {pagination.total}{" "}
              customer
              {pagination.total ===
              1
                ? ""
                : "s"}
            </p>

          </div>

          <Users
            size={21}
            className="text-[#1687D9]"
          />

        </div>

        {loading ? (
          <CustomerLoading />
        ) : error ? (
          <div className="p-12 text-center">

            <p className="font-semibold text-red-600">
              {error}
            </p>

          </div>
        ) : customers.length ===
          0 ? (
          <div className="p-16 text-center">

            <UserRound
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 font-bold text-[#0B1F33]">
              No customers found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Customers will appear
              after an order or service
              booking is submitted.
            </p>

          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">

              <table className="min-w-full">

                <thead className="bg-[#F8FAFC]">

                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-400">

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Contact
                    </th>

                    <th className="px-6 py-4">
                      Orders
                    </th>

                    <th className="px-6 py-4">
                      Purchases
                    </th>

                    <th className="px-6 py-4">
                      Services
                    </th>

                    <th className="px-6 py-4">
                      Paid Spend
                    </th>

                    <th className="px-6 py-4">
                      Last Activity
                    </th>

                    <th className="px-6 py-4" />

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {customers.map(
                    (customer) => (
                      <CustomerRow
                        key={
                          customer.customerKey
                        }
                        customer={
                          customer
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="divide-y divide-gray-100 lg:hidden">

              {customers.map(
                (customer) => (
                  <CustomerMobileCard
                    key={
                      customer.customerKey
                    }
                    customer={
                      customer
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
                {pagination.page}{" "}
                of{" "}
                {pagination.pages}
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
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
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
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
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

function CustomerRow({
  customer,
}) {
  return (
    <tr className="text-sm">

      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <UserRound
              size={18}
            />
          </div>

          <p className="font-bold text-[#0B1F33]">
            {customer.name}
          </p>

        </div>

      </td>

      <td className="px-6 py-5">

        <p className="font-medium text-[#0B1F33]">
          {customer.phone}
        </p>

        <p className="mt-1 max-w-48 truncate text-xs text-gray-400">
          {customer.email ||
            "No email"}
        </p>

      </td>

      <td className="px-6 py-5 font-semibold">
        {customer.totalOrders}
      </td>

      <td className="px-6 py-5 font-semibold">
        {customer.purchases}
      </td>

      <td className="px-6 py-5 font-semibold">
        {customer.serviceRequests}
      </td>

      <td className="px-6 py-5 font-bold text-[#0B1F33]">
        GH₵{" "}
        {Number(
          customer.totalSpent
        ).toLocaleString()}
      </td>

      <td className="px-6 py-5 text-xs text-gray-500">
        {formatDate(
          customer.lastActivity
        )}
      </td>

      <td className="px-6 py-5">

        <Link
          to={`/admin/customers/${customer.customerKey}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-[#1687D9] hover:text-[#1687D9]"
        >
          <Eye size={17} />
        </Link>

      </td>

    </tr>
  );
}

function CustomerMobileCard({
  customer,
}) {
  return (
    <div className="p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="font-bold text-[#0B1F33]">
            {customer.name}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {customer.phone}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {customer.email ||
              "No email"}
          </p>

        </div>

        <Link
          to={`/admin/customers/${customer.customerKey}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]"
        >
          <Eye size={18} />
        </Link>

      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">

        <MiniStat
          label="Orders"
          value={
            customer.totalOrders
          }
        />

        <MiniStat
          label="Services"
          value={
            customer.serviceRequests
          }
        />

        <MiniStat
          label="Paid"
          value={`GH₵ ${Number(
            customer.totalSpent
          ).toLocaleString()}`}
        />

      </div>

    </div>
  );
}

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-[#F7FAFC] p-3">

      <p className="text-[10px] uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-[#0B1F33]">
        {value}
      </p>

    </div>
  );
}

function CustomerLoading() {
  return (
    <div className="divide-y divide-gray-100">

      {Array.from({
        length: 5,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="flex gap-5 p-6"
          >

            <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />

            <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />

            <div className="ml-auto h-5 w-32 animate-pulse rounded bg-gray-100" />

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