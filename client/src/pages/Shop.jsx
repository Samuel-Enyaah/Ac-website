import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";

import ProductCard from "../components/shop/ProductCard";
import { getProducts } from "../services/productService";

const categories = [
  "All",
  "Air Conditioners",
  "Spare Parts",
  "Accessories",
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (active) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setError(
            "We could not load the products. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" ||
        product.category === category;

      const matchesSearch =
        !search ||
        product.name
          ?.toLowerCase()
          .includes(search) ||
        product.brand
          ?.toLowerCase()
          .includes(search) ||
        product.shortDescription
          ?.toLowerCase()
          .includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, searchTerm]);

  return (
    <>
      <section className="bg-[#0B1F33] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#74C5FF]">
              <ShoppingBag size={16} />
              R&J AC Shop
            </div>

            <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
              Air Conditioners, Spare Parts & Accessories
            </h1>

            <p className="mt-5 max-w-2xl leading-8 text-white/65">
              Browse cooling systems, replacement parts
              and installation accessories for residential
              and commercial AC needs.
            </p>
          </div>
        </div>
      </section>

      <section className="min-h-[600px] bg-[#F7FAFC] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search air conditioners, parts or accessories..."
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <SlidersHorizontal
                  size={18}
                  className="shrink-0 text-gray-400"
                />

                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      category === item
                        ? "bg-[#1687D9] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-[#0B1F33]">
              {category === "All"
                ? "All Products"
                : category}
            </h2>

            {!loading && !error && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {loading && <LoadingProducts />}

          {!loading && error && (
            <div className="mt-8 rounded-3xl border border-red-100 bg-white px-6 py-16 text-center">
              <p className="font-semibold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-[#1687D9] px-5 py-3 font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
            )}

          {!loading &&
            !error &&
            filteredProducts.length === 0 && (
              <div className="mt-10 rounded-3xl border border-gray-200 bg-white py-20 text-center">
                <Search
                  size={40}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-5 text-xl font-bold text-[#0B1F33]">
                  No products found
                </h3>

                <p className="mt-2 text-gray-500">
                  Try another search or category.
                </p>
              </div>
            )}
        </div>
      </section>
    </>
  );
}

function LoadingProducts() {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-white"
          >
            <div className="h-56 animate-pulse bg-gray-100" />

            <div className="space-y-4 p-6">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-7 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        )
      )}
    </div>
  );
}