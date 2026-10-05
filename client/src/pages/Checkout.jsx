import {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CheckCircle2,
  ChevronLeft,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  Wrench,
} from "lucide-react";

import {
  useCart,
} from "../context/CartContext";

import {
  useBusinessSettings,
} from "../context/BusinessSettingsContext";

import ProductVisual from "../components/shop/ProductVisual";

import * as orderService from "../services/orderService";

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

  installationAddress:
    "",

  paymentMethod:
    "pay-on-delivery",

  notes: "",
};

export default function Checkout() {
  const cart =
    useCart();

  const {
    settings,
  } = useBusinessSettings();

  /*
   * These fallbacks make this file
   * compatible with the cart naming
   * used during earlier phases.
   */
  const items =
    cart.cartItems ||
    cart.items ||
    cart.cart ||
    [];

  const clearCart =
    cart.clearCart ||
    (() => {});

  const [
    form,
    setForm,
  ] = useState(initialForm);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completedOrder,
    setCompletedOrder,
  ] = useState(null);

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (total, item) =>
            total +
            Number(
              item.price || 0
            ) *
              Number(
                item.quantity ||
                  1
              ),
          0
        ),
      [items]
    );

  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        items.length === 0
      ) {
        setError(
          "Your cart is empty."
        );

        return;
      }

      if (
        !form.fullName.trim() ||
        !form.phone.trim()
      ) {
        setError(
          "Please enter your name and phone number."
        );

        return;
      }

      if (
        form.fulfillmentMethod ===
          "delivery" &&
        (!form.address.trim() ||
          !form.town.trim())
      ) {
        setError(
          "Please provide your delivery address and town."
        );

        return;
      }

      if (
        form.installationRequired &&
        !form.installationAddress.trim()
      ) {
        setError(
          "Please provide the installation address."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const createOrder =
          orderService.createOrder ||
          orderService.submitOrder;

        if (!createOrder) {
          throw new Error(
            "Order service function was not found."
          );
        }

        const payload = {
          customer: {
            fullName:
              form.fullName.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim(),
          },

          items: items.map(
            (item) => ({
              product:
                item._id ||
                item.id,

              quantity:
                Number(
                  item.quantity ||
                    1
                ),
            })
          ),

          fulfillmentMethod:
            form.fulfillmentMethod,

          deliveryAddress:
            form.fulfillmentMethod ===
            "delivery"
              ? {
                  address:
                    form.address.trim(),

                  town:
                    form.town.trim(),

                  landmark:
                    form.landmark.trim(),
                }
              : null,

          installationRequired:
            form.installationRequired,

          installationAddress:
            form.installationRequired
              ? form.installationAddress.trim()
              : "",

          paymentMethod:
            form.paymentMethod,

          notes:
            form.notes.trim(),
        };

        const result =
          await createOrder(
            payload
          );

        const order =
          result?.order ||
          result?.data?.order ||
          result;

        setCompletedOrder(
          order
        );

        clearCart();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to place your order. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (completedOrder) {
    return (
      <main className="min-h-[70vh] bg-[#F8FAFC] px-5 py-16 sm:px-6">

        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2
              size={34}
            />
          </div>

          <h1 className="mt-6 text-3xl font-black text-[#0B1F33]">
            Order Received
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-500">
            Thank you. Your order
            has been submitted
            successfully.
          </p>

          {completedOrder.orderNumber && (
            <div className="mt-7 rounded-2xl bg-[#EAF6FF] p-5">

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1687D9]">
                Order Reference
              </p>

              <p className="mt-2 text-xl font-black text-[#0B1F33]">
                {
                  completedOrder.orderNumber
                }
              </p>

            </div>
          )}

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#1687D9] px-6 py-3 text-sm font-bold text-white"
          >
            Continue Shopping
          </Link>

        </div>

      </main>
    );
  }

  if (
    items.length === 0
  ) {
    return (
      <main className="min-h-[65vh] bg-[#F8FAFC] px-5 py-16">

        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-10 text-center">

          <ShoppingBag
            size={42}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-black text-[#0B1F33]">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add products before
            proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-xl bg-[#1687D9] px-6 py-3 text-sm font-bold text-white"
          >
            Browse Products
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="bg-[#F8FAFC]">

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">

        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1687D9]"
        >
          <ChevronLeft
            size={17}
          />

          Back to Cart
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_420px]">

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-6"
          >

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
                Checkout
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
                Complete Your Order
              </h1>

            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Customer */}
            <CheckoutSection
              title="Customer Information"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Full Name"
                  required
                >
                  <input
                    name="fullName"
                    value={
                      form.fullName
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </Field>

                <Field
                  label="Phone"
                  required
                >
                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </Field>

              </div>

              <div className="mt-5">

                <Field label="Email">

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    className={
                      inputClass
                    }
                  />

                </Field>

              </div>

            </CheckoutSection>

            {/* Fulfillment */}
            <CheckoutSection
              title="Fulfillment"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <ChoiceCard
                  icon={Truck}
                  title="Delivery"
                  description="Deliver the order to your location."
                  checked={
                    form.fulfillmentMethod ===
                    "delivery"
                  }
                >
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="delivery"
                    checked={
                      form.fulfillmentMethod ===
                      "delivery"
                    }
                    onChange={
                      handleChange
                    }
                    className="sr-only"
                  />
                </ChoiceCard>

                <ChoiceCard
                  icon={
                    PackageCheck
                  }
                  title="Pickup"
                  description="Arrange collection directly with R&J AC."
                  checked={
                    form.fulfillmentMethod ===
                    "pickup"
                  }
                >
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="pickup"
                    checked={
                      form.fulfillmentMethod ===
                      "pickup"
                    }
                    onChange={
                      handleChange
                    }
                    className="sr-only"
                  />
                </ChoiceCard>

              </div>

              {settings.deliveryNote && (
                <div className="mt-5 rounded-xl bg-[#EAF6FF] p-4 text-sm leading-6 text-[#0B1F33]">
                  {
                    settings.deliveryNote
                  }
                </div>
              )}

              {form.fulfillmentMethod ===
                "delivery" && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">

                  <Field
                    label="Delivery Address"
                    required
                  >
                    <input
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field
                    label="Town / Area"
                    required
                  >
                    <input
                      name="town"
                      value={
                        form.town
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <div className="sm:col-span-2">

                    <Field label="Landmark">

                      <input
                        name="landmark"
                        value={
                          form.landmark
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Optional landmark"
                        className={
                          inputClass
                        }
                      />

                    </Field>

                  </div>

                </div>
              )}

            </CheckoutSection>

            {/* Installation */}
            <CheckoutSection
              title="Installation"
            >

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 p-5">

                <input
                  type="checkbox"
                  name="installationRequired"
                  checked={
                    form.installationRequired
                  }
                  onChange={
                    handleChange
                  }
                  className="mt-1"
                />

                <div>

                  <div className="flex items-center gap-2 font-bold text-[#0B1F33]">
                    <Wrench
                      size={18}
                      className="text-[#1687D9]"
                    />

                    I need installation
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    R&J AC can contact
                    you to arrange
                    professional
                    installation.
                  </p>

                </div>

              </label>

              {form.installationRequired && (
                <div className="mt-5">

                  <Field
                    label="Installation Address"
                    required
                  >
                    <input
                      name="installationAddress"
                      value={
                        form.installationAddress
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />
                  </Field>

                </div>
              )}

            </CheckoutSection>

            {/* Payment */}
            <CheckoutSection
              title="Payment"
            >

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-[#1687D9] bg-[#EAF6FF] p-5">

                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay-on-delivery"
                  checked={
                    form.paymentMethod ===
                    "pay-on-delivery"
                  }
                  onChange={
                    handleChange
                  }
                  className="mt-1"
                />

                <div>

                  <p className="font-bold text-[#0B1F33]">
                    Pay on Delivery /
                    Collection
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Payment
                    arrangements will
                    be confirmed by
                    R&J AC.
                  </p>

                </div>

              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
                  Mobile Money —
                  Coming Soon
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
                  Card Payment —
                  Coming Soon
                </div>

              </div>

            </CheckoutSection>

            <CheckoutSection
              title="Additional Notes"
            >

              <textarea
                name="notes"
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                rows="4"
                placeholder="Anything else we should know?"
                className={
                  inputClass
                }
              />

            </CheckoutSection>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingBag
                size={19}
              />

              {submitting
                ? "Placing Order..."
                : "Place Order"}
            </button>

          </form>

          {/* Summary */}
          <aside>

            <div className="sticky top-24 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 p-6">

                <h2 className="text-lg font-black text-[#0B1F33]">
                  Order Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {items.length} item
                  {items.length ===
                  1
                    ? ""
                    : "s"}
                </p>

              </div>

              <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">

                {items.map(
                  (item) => (
                    <div
                      key={
                        item._id ||
                        item.id
                      }
                      className="flex gap-4 p-5"
                    >

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F5F8FA]">

                        <ProductVisual
                          product={
                            item
                          }
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="line-clamp-2 text-sm font-bold text-[#0B1F33]">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </p>

                        <p className="mt-2 text-sm font-black text-[#0B1F33]">
                          GH₵{" "}
                          {(
                            Number(
                              item.price ||
                                0
                            ) *
                            Number(
                              item.quantity ||
                                1
                            )
                          ).toLocaleString()}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

              <div className="border-t border-gray-100 p-6">

                <div className="flex justify-between text-sm text-gray-500">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    GH₵{" "}
                    {subtotal.toLocaleString()}
                  </span>

                </div>

                <div className="mt-3 flex justify-between text-sm text-gray-500">

                  <span>
                    Delivery
                  </span>

                  <span>
                    To be confirmed
                  </span>

                </div>

                <div className="mt-5 flex justify-between border-t border-gray-100 pt-5">

                  <span className="font-bold text-[#0B1F33]">
                    Products Total
                  </span>

                  <span className="text-xl font-black text-[#0B1F33]">
                    GH₵{" "}
                    {subtotal.toLocaleString()}
                  </span>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10";

function CheckoutSection({
  title,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

      <h2 className="text-lg font-black text-[#0B1F33]">
        {title}
      </h2>

      <div className="mt-5">
        {children}
      </div>

    </section>
  );
}

function Field({
  label,
  required,
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

    </label>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  checked,
  children,
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border-2 p-5 transition ${
        checked
          ? "border-[#1687D9] bg-[#EAF6FF]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >

      {children}

      <Icon
        size={22}
        className={
          checked
            ? "text-[#1687D9]"
            : "text-gray-400"
        }
      />

      <p className="mt-3 font-bold text-[#0B1F33]">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {description}
      </p>

    </label>
  );
}