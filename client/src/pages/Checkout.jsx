import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { useCart } from "../context/CartState";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import {
  createOrder,
  pendingCheckoutForm,
  pendingOrderData,
} from "../services/orderService";
import { contactErrors, focusFirstError } from "../utils/formValidation";
import { phoneHref, whatsappHref } from "../utils/businessLinks";
import usePageMeta from "../hooks/usePageMeta";
import ProductVisual from "../components/shop/ProductVisual";
import {
  Container,
  PageHero,
  Button,
  FormControl,
  FormSection,
  PriceDisplay,
  Alert,
  EmptyState,
} from "../components/ui/Storefront";
const initial = {
  fullName: "",
  phone: "",
  email: "",
  fulfillmentMethod: "delivery",
  address: "",
  town: "",
  landmark: "",
  installationRequired: false,
  installationAddress: "",
  paymentMethod: "pay-on-delivery",
  notes: "",
};
export default function Checkout() {
  const cart = useCart();
  const { settings } = useBusinessSettings();
  const { refreshCart } = cart;
  const [form, setForm] = useState(() => ({
    ...initial,
    ...pendingCheckoutForm(),
  }));
  const [pending, setPending] = useState(pendingOrderData);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const busy = useRef(false);
  usePageMeta(
    order ? "Order received" : "Checkout",
    "Review your products, choose delivery or pickup, and send your order to R&J AC.",
  );
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((old) => ({ ...old, [name]: "" }));
    setError("");
  };
  const field = (name, label, props = {}) => (
    <FormControl
      name={name}
      label={label}
      value={form[name]}
      onChange={change}
      error={errors[name]}
      {...props}
    />
  );
  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    if (!pending) {
      const found = contactErrors(form);
      if (form.fulfillmentMethod === "delivery") {
        if (!form.address.trim())
          found.address = "Enter your delivery address.";
        if (!form.town.trim()) found.town = "Enter your town or area.";
      }
      if (form.installationRequired && !form.installationAddress.trim())
        found.installationAddress = "Enter the installation address.";
      setErrors(found);
      if (Object.keys(found).length) {
        setError("Please check the highlighted fields.");
        focusFirstError(found);
        return;
      }
    }
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      let payload = pending;
      if (!payload) {
        const fresh = await refreshCart();
        if (!fresh)
          throw new Error(
            "We could not verify availability. Please try again.",
          );
        if (
          !fresh.length ||
          fresh.some(
            (p) => p.unavailable || p.quantity > p.stock || p.stock < 1,
          )
        )
          throw new Error(
            "Your cart has changed. Review unavailable products or quantities before ordering.",
          );
        if (
          fresh.some(
            (p) =>
              cart.cartItems.find((old) => old._id === p._id)?.price !==
              p.price,
          )
        )
          throw new Error(
            "A product price has changed. Review the updated summary, then submit again.",
          );
        payload = {
          customer: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
          },
          items: fresh.map((p) => ({ product: p._id, quantity: p.quantity })),
          fulfillmentMethod: form.fulfillmentMethod,
          deliveryAddress:
            form.fulfillmentMethod === "delivery"
              ? {
                  address: form.address.trim(),
                  town: form.town.trim(),
                  landmark: form.landmark.trim(),
                }
              : null,
          installationRequired: form.installationRequired,
          installationAddress: form.installationRequired
            ? form.installationAddress.trim()
            : "",
          paymentMethod: "pay-on-delivery",
          notes: form.notes.trim(),
        };
      }
      const result = await createOrder(payload);
      setOrder(result);
      setPending(null);
      cart.clearCart();
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (err) {
      setPending(pendingOrderData());
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to place your order. Please retry.",
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };
  if (order)
    return (
      <Container className="section-rj">
        <div className="receipt panel">
          <CheckCircle2 className="mx-auto text-[#1687D9]" size={44} />
          <p className="eyebrow mt-6">Order received</p>
          <h1 className="!text-3xl">Thank you for your order.</h1>
          <p className="my-5 text-[#637381]">
            Keep this reference when contacting our team. We will review your
            order and confirm fulfilment details and any additional charges.
          </p>
          <p className="reference">{order.orderNumber}</p>
          <PriceDisplay large price={order.total} />
          <p className="mt-3 text-sm text-[#637381]">
            Products total. Delivery and installation arrangements will be
            confirmed.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to="/shop">Continue Shopping</Button>
            <Button variant="secondary" to="/contact">
              Contact our team
            </Button>
          </div>
        </div>
      </Container>
    );
  if (!cart.cartItems.length && !pending)
    return (
      <Container className="section-rj">
        <EmptyState heading="h1" title="Your cart is empty">
          Choose your products before proceeding to checkout.
        </EmptyState>
      </Container>
    );
  return (
    <>
      <PageHero eyebrow="Checkout" title="Review. Send. Stay comfortable.">
        No account needed. We will confirm your order details with you.
      </PageHero>
      <Container className="section-rj">
        <div className="commerce-layout">
          <form
            onSubmit={submit}
            noValidate
            className="space-y-5"
            aria-label="Checkout"
          >
            {error && (
              <Alert error>
                {error}{" "}
                <Link className="underline" to="/cart">
                  Review cart
                </Link>
              </Alert>
            )}
            {pending && (
              <Alert>
                Your previous order needs confirmation. Retry below to check the
                same order without creating a duplicate. Your original details
                are preserved.
              </Alert>
            )}
            <fieldset
              disabled={submitting || Boolean(pending)}
              className="space-y-5"
            >
              <FormSection number="01" title="Contact Details">
                <div className="form-grid">
                  {field("fullName", "Full name *", {
                    autoComplete: "name",
                    required: true,
                  })}
                  {field("phone", "Phone number *", {
                    type: "tel",
                    autoComplete: "tel",
                    required: true,
                    hint: "Ghana: 020 123 4567 or +233 20 123 4567.",
                  })}
                  {field("email", "Email (optional)", {
                    type: "email",
                    autoComplete: "email",
                  })}
                </div>
              </FormSection>
              <FormSection number="02" title="Fulfillment">
                <div className="form-grid">
                  {["delivery", "pickup"].map((value) => (
                    <label key={value} className="choice">
                      <input
                        name="fulfillmentMethod"
                        type="radio"
                        value={value}
                        checked={form.fulfillmentMethod === value}
                        onChange={change}
                      />
                      <span className="capitalize font-semibold">{value}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#637381]">
                  {form.fulfillmentMethod === "delivery"
                    ? settings.deliveryNote
                    : "Arrange collection with our team after your order is reviewed."}
                </p>
                {form.fulfillmentMethod === "delivery" && (
                  <div className="form-grid mt-6">
                    {field("address", "Delivery address *", {
                      required: true,
                      autoComplete: "street-address",
                    })}
                    {field("town", "Town / area *", {
                      required: true,
                      autoComplete: "address-level2",
                    })}
                    {field("landmark", "Landmark (optional)")}
                  </div>
                )}
              </FormSection>
              <FormSection number="03" title="Installation">
                <label className="choice">
                  <input
                    type="checkbox"
                    name="installationRequired"
                    checked={form.installationRequired}
                    onChange={change}
                  />
                  <span>Request installation assistance</span>
                </label>
                <p className="mt-3 text-sm text-[#637381]">
                  Our team will confirm the work, schedule and charges before
                  proceeding.
                </p>
                {form.installationRequired && (
                  <div className="mt-5">
                    {field("installationAddress", "Installation address *", {
                      required: true,
                    })}
                  </div>
                )}
              </FormSection>
              <FormSection number="04" title="Payment">
                <label className="choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked
                    readOnly
                    value="pay-on-delivery"
                  />
                  <span>Pay on delivery / collection</span>
                </label>
                <p className="mt-4 text-sm text-[#637381]">
                  No online payment is taken here. Mobile Money and card
                  checkout are currently unavailable.
                </p>
              </FormSection>
              <FormSection number="05" title="Notes & review">
                {field("notes", "Anything else we should know?", {
                  multiline: true,
                })}
                <p className="mt-4 text-sm text-[#637381]">
                  Check your items, contact details and address before
                  submitting.
                </p>
                {!pending && (
                  <div className="mt-5 border-t border-[#E4E9EE] pt-5 lg:hidden">
                    <p className="text-sm font-semibold">Products total</p>
                    <PriceDisplay large price={cart.subtotal} />
                    <p className="mt-2 text-sm text-[#637381]">
                      {settings.deliveryNote}
                    </p>
                  </div>
                )}
              </FormSection>
            </fieldset>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || (!pending && cart.checking)}
            >
              {submitting
                ? "Checking your order..."
                : pending
                  ? "Retry original order"
                  : "Place Order"}
            </Button>
          </form>
          <aside className="order-summary panel">
            <h2 className="!text-xl">Order Summary</h2>
            <div className="my-5 divide-y divide-[#E4E9EE]">
              {cart.cartItems.map((item) => (
                <div key={item._id} className="flex gap-3 py-4">
                  <div className="h-16 w-16 shrink-0 bg-[#F5F8FA] p-2">
                    <ProductVisual product={item} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#637381]">
                      Qty: {item.quantity}
                    </p>
                    <PriceDisplay price={item.price * item.quantity} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#637381]">
              Products total
            </p>
            <PriceDisplay large price={cart.subtotal} />
            <p className="mt-4 text-sm text-[#637381]">
              {pending
                ? "The original order and its recorded prices will be used for this retry."
                : settings.deliveryNote}
            </p>
            <Link className="text-link mt-3" to="/cart">
              Review cart
            </Link>
            <div className="mt-5 border-t border-[#E4E9EE] pt-4">
              <p className="text-sm font-bold">Need a hand?</p>
              {settings.primaryPhone && (
                <a
                  className="text-link mr-4"
                  href={phoneHref(settings.primaryPhone)}
                >
                  <Phone size={15} />
                  Call us
                </a>
              )}
              {settings.whatsapp && (
                <a
                  className="text-link"
                  href={whatsappHref(settings.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
