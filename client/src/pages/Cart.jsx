import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import ProductVisual from "../components/shop/ProductVisual";

export default function Cart() {
  const {
    cartItems,
    subtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <section className="min-h-[70vh] bg-[#F7FAFC] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#1687D9]">
              <ShoppingCart size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#0B1F33]">
              Your cart is empty
            </h1>

            <p className="mt-3 text-gray-500">
              Add an air conditioner, spare part
              or accessory to get started.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-6 py-3.5 font-semibold text-white"
            >
              <ShoppingBag size={18} />
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F7FAFC] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1687D9]">
              Shopping Cart
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#0B1F33]">
              Your Products
            </h1>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="text-left text-sm font-semibold text-red-500 hover:text-red-600"
          >
            Clear Cart
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row">
                  <Link
                    to={`/shop/${item.slug}`}
                    className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF6FF] p-5 text-[#1687D9] sm:w-36"
                  >
                    <ProductVisual
                      product={item}
                      iconSize={45}
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#1687D9]">
                          {item.category}
                        </p>

                        <Link
                          to={`/shop/${item.slug}`}
                          className="mt-1 block text-lg font-bold text-[#0B1F33]"
                        >
                          {item.name}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            item._id
                          )
                        }
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex h-10 w-fit items-center rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity - 1
                            )
                          }
                          className="flex h-full w-10 items-center justify-center"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-10 text-center text-sm font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity + 1
                            )
                          }
                          className="flex h-full w-10 items-center justify-center"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          GH₵{" "}
                          {Number(
                            item.price
                          ).toLocaleString()}{" "}
                          each
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-[#0B1F33]">
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
                  </div>
                </div>
              </article>
            ))}

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1687D9]"
            >
              <ArrowLeft size={17} />
              Continue Shopping
            </Link>
          </div>

          <aside>
            <div className="sticky top-28 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#0B1F33]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>

                  <span className="font-semibold text-[#0B1F33]">
                    GH₵{" "}
                    {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>
                    Calculated later
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Installation
                  </span>
                  <span>Optional</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-6">
                <span className="font-bold text-[#0B1F33]">
                  Total
                </span>

                <span className="text-2xl font-extrabold text-[#0B1F33]">
                  GH₵{" "}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <Link
                to="/checkout"
                className="flex w-full items-center justify-center rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF]"
              >
                Proceed to Checkout
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}