import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "../../context/CartContext";
import ProductVisual from "./ProductVisual";

export default function ProductCard({
  product,
}) {
  const { addToCart } = useCart();

  return (
    <article className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={`/shop/${product.slug}`}
        className="relative flex h-56 items-center justify-center bg-gradient-to-br from-[#EAF6FF] to-[#F7FBFF] p-7"
      >
        {product.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-[#0B1F33] px-3 py-1.5 text-xs font-bold text-white">
            Featured
          </span>
        )}

        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white text-[#1687D9] shadow-lg transition group-hover:scale-105">
          <ProductVisual
            product={product}
            iconSize={48}
          />
        </div>
      </Link>

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1687D9]">
          {product.category}
        </p>

        <Link
          to={`/shop/${product.slug}`}
          className="mt-2 block text-xl font-bold text-[#0B1F33] transition hover:text-[#1687D9]"
        >
          {product.name}
        </Link>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
          {product.shortDescription}
        </p>

        <div className="mt-5 flex items-end gap-3">
          <span className="text-xl font-extrabold text-[#0B1F33]">
            GH₵{" "}
            {Number(
              product.price
            ).toLocaleString()}
          </span>

          {product.oldPrice && (
            <span className="pb-0.5 text-sm text-gray-400 line-through">
              GH₵{" "}
              {Number(
                product.oldPrice
              ).toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
          <Link
            to={`/shop/${product.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-[#0B1F33] transition hover:border-[#1687D9] hover:text-[#1687D9]"
          >
            View Details
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            disabled={product.stock < 1}
            onClick={() =>
              addToCart(product)
            }
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1687D9] text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <ShoppingCart size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}