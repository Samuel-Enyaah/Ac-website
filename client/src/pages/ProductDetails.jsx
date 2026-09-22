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
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wrench,
} from "lucide-react";

import { getProductBySlug } from "../services/productService";
import { useCart } from "../context/CartContext";
import ProductVisual from "../components/shop/ProductVisual";

export default function ProductDetails() {
  const { productId } = useParams();

  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProductBySlug(productId);

        if (active) {
          setProduct(data);
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setError("Product not found.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-[#F7FAFC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid animate-pulse gap-8 lg:grid-cols-2">
            <div className="min-h-[450px] rounded-3xl bg-gray-100" />

            <div className="rounded-3xl bg-white p-8">
              <div className="h-4 w-28 rounded bg-gray-100" />
              <div className="mt-5 h-10 w-3/4 rounded bg-gray-100" />
              <div className="mt-6 h-20 rounded bg-gray-100" />
              <div className="mt-6 h-10 w-40 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="flex min-h-[65vh] items-center justify-center bg-[#F7FAFC] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0B1F33]">
            Product not found
          </h1>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to Shop
          </Link>
        </div>
      </section>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <section className="bg-[#F7FAFC] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#1687D9]"
        >
          <ArrowLeft size={17} />
          Back to Shop
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-2">
          <div className="flex min-h-[450px] items-center justify-center rounded-3xl border border-gray-200 bg-gradient-to-br from-[#EAF6FF] to-white p-10">
            <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-[2rem] bg-white text-[#1687D9] shadow-xl">
              <ProductVisual
                product={product}
                iconSize={78}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1687D9]">
              {product.category}
            </p>

            <h1 className="mt-3 text-3xl font-extrabold text-[#0B1F33] sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-5 leading-7 text-gray-600">
              {product.description}
            </p>

            <div className="mt-6 flex items-end gap-4">
              <span className="text-3xl font-black text-[#0B1F33]">
                GH₵{" "}
                {Number(
                  product.price
                ).toLocaleString()}
              </span>

              {product.oldPrice && (
                <span className="pb-1 text-lg text-gray-400 line-through">
                  GH₵{" "}
                  {Number(
                    product.oldPrice
                  ).toLocaleString()}
                </span>
              )}
            </div>

            <div
              className={`mt-5 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
                product.stock > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </div>

            <div className="mt-8">
              <p className="text-sm font-bold text-[#0B1F33]">
                Key Details
              </p>

              <div className="mt-4 space-y-3">
                {product.specifications?.map(
                  (specification) => (
                    <div
                      key={specification}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <CheckCircle2
                        size={17}
                        className="mt-0.5 shrink-0 text-[#1687D9]"
                      />

                      {specification}
                    </div>
                  )
                )}
              </div>
            </div>

            {product.stock > 0 && (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <div className="flex h-12 items-center rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                      )
                    }
                    className="flex h-full w-12 items-center justify-center"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="min-w-12 text-center font-bold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(
                          product.stock,
                          value + 1
                        )
                      )
                    }
                    className="flex h-full w-12 items-center justify-center"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-3.5 font-bold text-white transition hover:bg-[#1176BF]"
                >
                  <ShoppingCart size={19} />

                  {added
                    ? "Added to Cart"
                    : "Add to Cart"}
                </button>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <InfoBox
                icon={ShieldCheck}
                title="Quality"
                text="Carefully selected"
              />

              <InfoBox
                icon={Wrench}
                title="Installation"
                text="Service available"
              />

              <InfoBox
                icon={Truck}
                title="Delivery"
                text="Options available"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBox({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-xl bg-[#F7FAFC] p-4">
      <Icon
        size={19}
        className="text-[#1687D9]"
      />

      <p className="mt-2 text-sm font-bold text-[#0B1F33]">
        {title}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {text}
      </p>
    </div>
  );
}