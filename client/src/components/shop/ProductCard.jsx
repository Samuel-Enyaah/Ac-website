import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "../../context/CartState";
import ProductVisual from "./ProductVisual";
import { PriceDisplay } from "../ui/Storefront";
export default function ProductCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const [added, setAdded] = useState(false);
  const remaining =
    product.stock -
    (cartItems.find((item) => item._id === product._id)?.quantity || 0);
  return (
    <article className="product-card">
      <Link
        to={`/shop/${product.slug}`}
        className="product-image"
        aria-label={`View ${product.name}`}
      >
        <ProductVisual product={product} iconSize={64} />
        {Number(product.oldPrice) > Number(product.price) ? (
          <span className="badge absolute left-4 top-4">Sale</span>
        ) : (
          product.featured && (
            <span className="badge absolute left-4 top-4">Featured</span>
          )
        )}
      </Link>
      <div className="product-body">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#637381]">
          {product.category}
          {product.brand ? ` / ${product.brand}` : ""}
        </p>
        <h3>
          <Link to={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <PriceDisplay price={product.price} oldPrice={product.oldPrice} />
        <p className="text-xs text-[#637381]">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <Link className="text-link" to={`/shop/${product.slug}`}>
            View Details
          </Link>
          <button
            type="button"
            className="icon-button bg-[#EAF6FF] text-[#106eaf]"
            aria-label={`Add ${product.name} to cart`}
            disabled={remaining < 1}
            onClick={() => {
              addToCart(product);
              setAdded(true);
            }}
          >
            {added ? <Check size={20} /> : <ShoppingCart size={20} />}
          </button>
        </div>
        {added && (
          <p role="status" className="text-xs text-[#106eaf]">
            Added to cart.{" "}
            <Link className="underline" to="/cart">
              View cart
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
