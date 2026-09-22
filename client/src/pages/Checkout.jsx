import {
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  useCart,
} from "../context/CartContext";

import ProductVisual from "../components/shop/ProductVisual";

import {
  createOrder,
} from "../services/orderService";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",

  fulfillmentMethod:
    "delivery",

  address: "",
  town: "",
  landmark: "",

  installationRequired:
    false,

  installationAddress: "",

  paymentMethod:
    "pay-on-delivery",

  notes: "",
};

export default function Checkout() {
  const {
    cartItems,
    subtotal,
    clearCart,
  } = useCart();

  const [form, setForm] =
    useState(initialForm);

  const [errors, setErrors] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    completedOrder,
    setCompletedOrder,
  ] = useState(null);

  const deliveryFee =
    useMemo(() => {
      return 0;
    }, []);

  const installationFee = 0;

  const total =
    subtotal +
    deliveryFee +
    installationFee;

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName =
        "Please enter your full name.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone =
        "Please enter your phone number.";
    } else if (
      form.phone.replace(
        /\D/g,
        ""
      ).length < 9
    ) {
      nextErrors.phone =
        "Please enter a valid phone number.";
    }

    if (
      form.fulfillmentMethod ===
      "delivery"
    ) {
      if (!form.address.trim()) {
        nextErrors.address =
          "Please enter your delivery address.";
      }

      if (!form.town.trim()) {
        nextErrors.town =
          "Please enter your town or area.";
      }
    }

    if (
      form.installationRequired &&
      !form.installationAddress.trim()
    ) {
      nextErrors.installationAddress =
        "Please enter the installation address.";
    }

    return nextErrors;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const nextErrors =
      validate();

    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {
      setErrors(nextErrors);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const orderPayload = {
        customer: {
          fullName:
            form.fullName.trim(),

          phone:
            form.phone.trim(),

          email:
            form.email.trim(),
        },

        items: cartItems.map(
          (item) => ({
            product: item._id,
            quantity:
              item.quantity,
          })
        ),

        fulfillmentMethod:
          form.fulfillmentMethod,

        deliveryAddress: {
          address:
            form.address.trim(),

          town:
            form.town.trim(),

          landmark:
            form.landmark.trim(),
        },

        installationRequired:
          form.installationRequired,

        installationAddress:
          form.installationAddress.trim(),

        paymentMethod:
          form.paymentMethod,

        notes:
          form.notes.trim(),
      };

      const order =
        await createOrder(
          orderPayload
        );

      setCompletedOrder(order);

      clearCart();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Order submission failed:",
        error
      );

      setSubmitError(
        error.response?.data
          ?.message ||
          "We could not submit your order. Please try again."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <OrderSuccess
        order={
          completedOrder
        }
      />
    );
  }

  if (
    cartItems.length === 0
  ) {
    return <EmptyCheckout />;
  }

  return (
    <>
      <section className="bg-[#0B1F33] py-14 text-white sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            <ArrowLeft
              size={17}
            />

            Back to Cart
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#74C5FF]">
              Secure Checkout
            </p>

            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
              Complete Your Order
            </h1>

            <p className="mt-4 max-w-2xl leading-8 text-white/65">
              Enter your contact,
              delivery and installation
              information so R&J AC can
              process your order.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F7FAFC] py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">

          <form
            onSubmit={
              handleSubmit
            }
            noValidate
            className="space-y-6"
          >
            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            <CheckoutCard>
              <SectionTitle
                icon={UserRound}
                title="Customer Information"
                description="Tell us who is placing the order."
              />

              <div className="mt-7 grid gap-5 sm:grid-cols-2">

                <Field
                  label="Full Name"
                  required
                  error={
                    errors.fullName
                  }
                >
                  <input
                    type="text"
                    name="fullName"
                    value={
                      form.fullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                    className={inputClasses(
                      errors.fullName
                    )}
                  />
                </Field>

                <Field
                  label="Phone Number"
                  required
                  error={
                    errors.phone
                  }
                >
                  <input
                    type="tel"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. 024 XXX XXXX"
                    className={inputClasses(
                      errors.phone
                    )}
                  />
                </Field>

                <Field
                  label="Email Address"
                >
                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="you@example.com"
                    className={inputClasses()}
                  />
                </Field>

              </div>
            </CheckoutCard>

            <CheckoutCard>
              <SectionTitle
                icon={Truck}
                title="Delivery Method"
                description="Choose how you would like to receive your order."
              />

              <div className="mt-7 grid gap-4 sm:grid-cols-2">

                <SelectionCard
                  active={
                    form.fulfillmentMethod ===
                    "delivery"
                  }
                  icon={Truck}
                  title="Delivery"
                  description="R&J delivers the order to your location."
                  onClick={() =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        fulfillmentMethod:
                          "delivery",
                      })
                    )
                  }
                />

                <SelectionCard
                  active={
                    form.fulfillmentMethod ===
                    "pickup"
                  }
                  icon={
                    ShoppingBag
                  }
                  title="Pickup"
                  description="Collect your order from R&J."
                  onClick={() =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        fulfillmentMethod:
                          "pickup",
                      })
                    )
                  }
                />

              </div>

              {form.fulfillmentMethod ===
                "delivery" && (
                <div className="mt-7 grid gap-5 sm:grid-cols-2">

                  <Field
                    label="Delivery Address"
                    required
                    error={
                      errors.address
                    }
                  >
                    <input
                      type="text"
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="House, street or location"
                      className={inputClasses(
                        errors.address
                      )}
                    />
                  </Field>

                  <Field
                    label="Town / Area"
                    required
                    error={
                      errors.town
                    }
                  >
                    <input
                      type="text"
                      name="town"
                      value={
                        form.town
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter town or area"
                      className={inputClasses(
                        errors.town
                      )}
                    />
                  </Field>

                  <Field
                    label="Nearest Landmark"
                  >
                    <input
                      type="text"
                      name="landmark"
                      value={
                        form.landmark
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Optional landmark"
                      className={inputClasses()}
                    />
                  </Field>

                </div>
              )}
            </CheckoutCard>

            <CheckoutCard>
              <SectionTitle
                icon={Wrench}
                title="Installation"
                description="Would you like R&J to install your AC?"
              />

              <label className="mt-7 flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 bg-[#F9FBFC] p-5">

                <input
                  type="checkbox"
                  name="installationRequired"
                  checked={
                    form.installationRequired
                  }
                  onChange={
                    handleChange
                  }
                  className="mt-1 h-4 w-4 accent-[#1687D9]"
                />

                <div>
                  <p className="font-bold text-[#0B1F33]">
                    Add professional
                    installation
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    R&J will review
                    the AC type,
                    location and
                    installation
                    requirements
                    before confirming
                    the final
                    installation
                    charge.
                  </p>
                </div>

              </label>

              {form.installationRequired && (
                <div className="mt-5">

                  <Field
                    label="Installation Address"
                    required
                    error={
                      errors.installationAddress
                    }
                  >
                    <input
                      type="text"
                      name="installationAddress"
                      value={
                        form.installationAddress
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Where should the AC be installed?"
                      className={inputClasses(
                        errors.installationAddress
                      )}
                    />
                  </Field>

                </div>
              )}
            </CheckoutCard>

            <CheckoutCard>
              <SectionTitle
                icon={
                  CreditCard
                }
                title="Payment Method"
                description="Choose how you would like to pay."
              />

              <div className="mt-7 space-y-3">

                <PaymentOption
                  value="pay-on-delivery"
                  title="Pay on Delivery / Confirmation"
                  description="Payment details will be confirmed before delivery or installation."
                  form={form}
                  handleChange={
                    handleChange
                  }
                />

                <PaymentOption
                  value="mobile-money"
                  title="Mobile Money"
                  description="Mobile Money payment will be enabled later."
                  form={form}
                  handleChange={
                    handleChange
                  }
                  disabled
                />

                <PaymentOption
                  value="card"
                  title="Card Payment"
                  description="Secure online card payments will be connected later."
                  form={form}
                  handleChange={
                    handleChange
                  }
                  disabled
                />

              </div>
            </CheckoutCard>

            <CheckoutCard>
              <SectionTitle
                icon={MapPin}
                title="Order Notes"
                description="Add any useful information about your order."
              />

              <div className="mt-7">

                <textarea
                  name="notes"
                  value={
                    form.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="5"
                  placeholder="Example: Please call before delivery..."
                  className={inputClasses()}
                />

              </div>
            </CheckoutCard>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="w-full rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white shadow-sm transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Placing Order..."
                : "Place Order"}
            </button>

          </form>

          <aside>
            <div className="sticky top-28 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1687D9]">
                Your Order
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#0B1F33]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-5">

                {cartItems.map(
                  (item) => (
                    <div
                      key={
                        item._id
                      }
                      className="flex gap-3"
                    >

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EAF6FF] p-3 text-[#1687D9]">

                        <ProductVisual
                          product={
                            item
                          }
                          iconSize={
                            26
                          }
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-bold text-[#0B1F33]">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#0B1F33]">
                          GH₵{" "}
                          {(
                            Number(
                              item.price
                            ) *
                            item.quantity
                          ).toLocaleString()}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

              <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">

                <SummaryRow
                  label="Subtotal"
                  value={`GH₵ ${subtotal.toLocaleString()}`}
                />

                <SummaryRow
                  label="Delivery"
                  value={
                    form.fulfillmentMethod ===
                    "pickup"
                      ? "Pickup"
                      : "To be confirmed"
                  }
                />

                <SummaryRow
                  label="Installation"
                  value={
                    form.installationRequired
                      ? "To be confirmed"
                      : "Not requested"
                  }
                />

              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">

                <span className="font-bold text-[#0B1F33]">
                  Current Total
                </span>

                <span className="text-2xl font-black text-[#0B1F33]">
                  GH₵{" "}
                  {total.toLocaleString()}
                </span>

              </div>

              <div className="mt-6 rounded-2xl bg-[#EAF6FF] p-4">

                <div className="flex gap-3">

                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-[#1687D9]"
                  />

                  <p className="text-xs leading-5 text-gray-600">
                    Final delivery
                    and installation
                    charges will be
                    confirmed before
                    payment.
                  </p>

                </div>

              </div>

            </div>
          </aside>

        </div>
      </section>
    </>
  );
}

function CheckoutCard({
  children,
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="font-bold text-[#0B1F33]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

    </div>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </span>

      {children}

      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-500">
          {error}
        </span>
      )}

    </label>
  );
}

function SelectionCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-[#1687D9] bg-[#EAF6FF]"
          : "border-gray-200 bg-white hover:border-[#1687D9]/40"
      }`}
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1687D9] shadow-sm">
        <Icon size={19} />
      </div>

      <p className="mt-4 font-bold text-[#0B1F33]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

    </button>
  );
}

function PaymentOption({
  value,
  title,
  description,
  form,
  handleChange,
  disabled = false,
}) {
  return (
    <label
      className={`flex items-start gap-4 rounded-2xl border p-5 ${
        disabled
          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
          : "cursor-pointer border-gray-200 bg-white"
      }`}
    >

      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={
          form.paymentMethod ===
          value
        }
        onChange={
          handleChange
        }
        disabled={
          disabled
        }
        className="mt-1 accent-[#1687D9]"
      />

      <div>

        <div className="flex items-center gap-2">

          <p className="font-bold text-[#0B1F33]">
            {title}
          </p>

          {disabled && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
              Coming Soon
            </span>
          )}

        </div>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>

      </div>

    </label>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="text-right font-semibold text-[#0B1F33]">
        {value}
      </span>

    </div>
  );
}

function inputClasses(
  error
) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:ring-4 ${
    error
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1687D9] focus:ring-[#1687D9]/10"
  }`;
}

function EmptyCheckout() {
  return (
    <section className="min-h-[70vh] bg-[#F7FAFC] py-20">

      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

          <ShoppingBag
            size={40}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-3xl font-bold text-[#0B1F33]">
            Your cart is empty
          </h1>

          <p className="mt-3 text-gray-500">
            Add products before
            continuing to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-7 inline-flex rounded-xl bg-[#1687D9] px-6 py-3.5 font-semibold text-white"
          >
            Browse Products
          </Link>

        </div>

      </div>

    </section>
  );
}

function OrderSuccess({
  order,
}) {
  return (
    <section className="flex min-h-[75vh] items-center bg-[#F7FAFC] px-4 py-20">

      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">

          <PackageCheck
            size={34}
          />

        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
          Order Received
        </p>

        <h1 className="mt-3 text-3xl font-bold text-[#0B1F33]">
          Your order has been
          submitted successfully.
        </h1>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-600">
          Keep your order reference.
          R&J AC can use it to identify
          and manage your order.
        </p>

        <div className="mt-8 rounded-2xl bg-[#EAF6FF] p-6">

          <p className="text-sm font-semibold text-gray-600">
            Order Reference
          </p>

          <p className="mt-2 text-xl font-black text-[#1687D9] sm:text-2xl">
            {
              order.orderNumber
            }
          </p>

          <div className="mt-5 border-t border-[#1687D9]/10 pt-5">

            <p className="text-sm text-gray-500">
              Order Total
            </p>

            <p className="mt-1 text-2xl font-black text-[#0B1F33]">
              GH₵{" "}
              {Number(
                order.total
              ).toLocaleString()}
            </p>

          </div>

        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <Link
            to="/shop"
            className="rounded-xl bg-[#1687D9] px-6 py-3 font-semibold text-white"
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-[#0B1F33]"
          >
            Return Home
          </Link>

        </div>

      </div>

    </section>
  );
}