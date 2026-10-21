import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartState";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import usePageMeta from "../hooks/usePageMeta";
import ProductVisual from "../components/shop/ProductVisual";
import {
  Container,
  PageHero,
  Button,
  PriceDisplay,
  QuantitySelector,
  Alert,
  EmptyState,
} from "../components/ui/Storefront";
export default function Cart() {
  const cart = useCart();
  const { settings } = useBusinessSettings();
  const { refreshCart } = cart;
  usePageMeta(
    "Your cart",
    "Review your AC products, check current stock and continue to checkout.",
  );
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);
  if (!cart.cartItems.length)
    return (
      <Container className="section-rj">
        <EmptyState heading="h1" title="Your cart is empty">
          Explore air conditioners, parts and accessories for your next project.
        </EmptyState>
      </Container>
    );
  return (
    <>
      <PageHero eyebrow="Your cart" title="A step closer to better cooling.">
        Review your products before sending your order.
      </PageHero>
      <Container className="section-rj">
        <div className="commerce-layout">
          <div className="space-y-5">
            {cart.checking && (
              <Alert>Checking current prices and availability...</Alert>
            )}
            {cart.checkError && (
              <Alert error>
                {cart.checkError}
                <button className="text-link ml-3" onClick={refreshCart}>
                  Try again
                </button>
              </Alert>
            )}
            {cart.invalid && (
              <Alert error>
                Some products need your attention. Update their quantities or
                remove unavailable items before checkout.
              </Alert>
            )}
            {cart.cartItems.map((item) => (
              <article key={item._id} className="cart-line">
                <Link className="cart-line-image" to={`/shop/${item.slug}`}>
                  <ProductVisual product={item} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#637381]">{item.category}</p>
                      <Link
                        className="mt-1 block font-bold leading-snug"
                        to={`/shop/${item.slug}`}
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => cart.removeFromCart(item._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {item.unavailable || item.stock < 1 ? (
                    <p className="field-error">
                      This product is no longer available. Please remove it.
                    </p>
                  ) : item.quantity > item.stock ? (
                    <p className="field-error">
                      Only {item.stock} available.{" "}
                      <button
                        className="underline"
                        onClick={() =>
                          cart.updateQuantity(item._id, item.stock)
                        }
                      >
                        Update to {item.stock}
                      </button>
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-[#637381]">
                      {item.stock} available
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <QuantitySelector
                      name={item.name}
                      value={item.quantity}
                      max={item.stock}
                      disabled={item.stock < 1}
                      onChange={(qty) => cart.updateQuantity(item._id, qty)}
                    />
                    <PriceDisplay price={item.price * item.quantity} />
                  </div>
                  <p className="mt-2 text-xs text-[#637381]">
                    Unit price: GHS {item.price.toFixed(2)}
                  </p>
                </div>
              </article>
            ))}
            <Link className="text-link" to="/shop">
              <ArrowLeft size={17} />
              Continue Shopping
            </Link>
          </div>
          <aside className="order-summary panel">
            <h2 className="!text-xl">Order Summary</h2>
            <div className="my-6 flex flex-wrap justify-between gap-3">
              <span>Products subtotal</span>
              <PriceDisplay price={cart.subtotal} />
            </div>
            <p className="text-sm leading-7 text-[#637381]">
              {settings.deliveryNote}
            </p>
            <p className="mt-3 text-sm text-[#637381]">
              Need installation? Add your request at checkout.
            </p>
            <div className="mt-7">
              {cart.checking ||
              cart.checkError ||
              !cart.checked ||
              cart.invalid ? (
                <Button className="w-full" disabled>
                  Check products to continue
                </Button>
              ) : (
                <Button className="w-full" to="/checkout">
                  Proceed to Checkout
                </Button>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
