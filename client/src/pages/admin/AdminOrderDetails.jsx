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
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  getAdminOrder,
  updateAdminOrder,
} from "../../services/adminOrderService";

const orderStatusOptions = [
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

const paymentOptions = [
  {
    value: "pending",
    label: "Pending",
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

export default function AdminOrderDetails() {
  const { orderId } =
    useParams();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    paymentStatus,
    setPaymentStatus,
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

  const loadOrder =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminOrder(
            orderId
          );

        setOrder(data);

        setStatus(
          data.status
        );

        setPaymentStatus(
          data.paymentStatus
        );
      } catch (error) {
        console.error(
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Unable to load the order."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleSave =
    async () => {
      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const updated =
          await updateAdminOrder(
            orderId,
            {
              status,
              paymentStatus,
            }
          );

        setOrder(updated);

        setStatus(
          updated.status
        );

        setPaymentStatus(
          updated.paymentStatus
        );

        setSuccess(
          "Order updated successfully."
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to update the order."
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
          Loading order...
        </p>

      </div>
    );
  }

  if (
    error &&
    !order
  ) {
    return (
      <div>

        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Orders
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
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#1687D9]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Orders
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
              Order Details
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
              {
                order.orderNumber
              }
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Created{" "}
              {formatDateTime(
                order.createdAt
              )}
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

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
                  order.customer
                    ?.fullName
                }
              />

              <Info
                label="Phone"
                value={
                  order.customer
                    ?.phone
                }
              />

              <Info
                label="Email"
                value={
                  order.customer
                    ?.email ||
                  "Not provided"
                }
              />

            </InfoGrid>

          </Section>

          <Section
            icon={ShoppingBag}
            title="Ordered Products"
          >

            <div className="divide-y divide-gray-100">

              {order.items?.map(
                (item) => (
                  <div
                    key={
                      item._id ||
                      item.product
                    }
                    className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0"
                  >

                    <div>

                      <p className="font-bold text-[#0B1F33]">
                        {
                          item.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        GH₵{" "}
                        {Number(
                          item.price
                        ).toLocaleString()}{" "}
                        ×{" "}
                        {
                          item.quantity
                        }
                      </p>

                    </div>

                    <p className="font-black text-[#0B1F33]">
                      GH₵{" "}
                      {(
                        Number(
                          item.price
                        ) *
                        item.quantity
                      ).toLocaleString()}
                    </p>

                  </div>
                )
              )}

            </div>

          </Section>

          <Section
            icon={Truck}
            title="Fulfillment"
          >

            <InfoGrid>

              <Info
                label="Method"
                value={
                  capitalize(
                    order.fulfillmentMethod
                  )
                }
              />

              {order.fulfillmentMethod ===
                "delivery" && (
                <>
                  <Info
                    label="Address"
                    value={
                      order.deliveryAddress
                        ?.address
                    }
                  />

                  <Info
                    label="Town / Area"
                    value={
                      order.deliveryAddress
                        ?.town
                    }
                  />

                  <Info
                    label="Landmark"
                    value={
                      order.deliveryAddress
                        ?.landmark ||
                      "Not provided"
                    }
                  />
                </>
              )}

            </InfoGrid>

          </Section>

          <Section
            icon={Wrench}
            title="Installation"
          >

            <InfoGrid>

              <Info
                label="Installation Requested"
                value={
                  order.installationRequired
                    ? "Yes"
                    : "No"
                }
              />

              {order.installationRequired && (
                <Info
                  label="Installation Address"
                  value={
                    order.installationAddress
                  }
                />
              )}

            </InfoGrid>

          </Section>

          <Section
            icon={MapPin}
            title="Order Notes"
          >

            <p className="text-sm leading-7 text-gray-600">
              {order.notes ||
                "No additional notes were provided."}
            </p>

          </Section>

        </div>

        <aside className="space-y-6">

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1687D9]">
              Manage Order
            </p>

            <div className="mt-6">

              <label className="block">

                <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                  Order Status
                </span>

                <select
                  value={
                    status
                  }
                  onChange={(
                    event
                  ) =>
                    setStatus(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
                >

                  {orderStatusOptions.map(
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

            </div>

            <div className="mt-5">

              <label className="block">

                <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                  Payment Status
                </span>

                <select
                  value={
                    paymentStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentStatus(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1687D9]"
                >

                  {paymentOptions.map(
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

            </div>

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
              <CreditCard
                size={21}
              />
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[#74C5FF]">
              Order Total
            </p>

            <p className="mt-2 text-3xl font-black">
              GH₵{" "}
              {Number(
                order.total
              ).toLocaleString()}
            </p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">

              <SummaryRow
                label="Subtotal"
                value={`GH₵ ${Number(
                  order.subtotal
                ).toLocaleString()}`}
              />

              <SummaryRow
                label="Delivery"
                value={`GH₵ ${Number(
                  order.deliveryFee ||
                    0
                ).toLocaleString()}`}
              />

              <SummaryRow
                label="Installation"
                value={`GH₵ ${Number(
                  order.installationFee ||
                    0
                ).toLocaleString()}`}
              />

              <SummaryRow
                label="Payment Method"
                value={capitalize(
                  String(
                    order.paymentMethod ||
                      ""
                  ).replaceAll(
                    "-",
                    " "
                  )
                )}
              />

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

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex justify-between gap-4">

      <span className="text-white/50">
        {label}
      </span>

      <span className="text-right font-semibold">
        {value}
      </span>

    </div>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold capitalize text-blue-700">
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
  const paid =
    status === "paid";

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
        paid
          ? "bg-green-50 text-green-700"
          : "bg-orange-50 text-orange-700"
      }`}
    >
      Payment {status}
    </span>
  );
}

function capitalize(
  value = ""
) {
  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
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