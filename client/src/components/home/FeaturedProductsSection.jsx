import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingCart,
  Snowflake,
  Package,
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Split Air Conditioner",
    category: "Air Conditioners",
    description:
      "Efficient cooling solution suitable for homes and small offices.",
    icon: Snowflake,
  },
  {
    id: 2,
    name: "Standing Air Conditioner",
    category: "Air Conditioners",
    description:
      "Powerful cooling option for larger rooms and commercial spaces.",
    icon: Snowflake,
  },
  {
    id: 3,
    name: "AC Spare Parts",
    category: "Parts & Accessories",
    description:
      "Replacement parts and accessories for different AC systems.",
    icon: Package,
  },
];

export default function FeaturedProductsSection() {
  return (
    <section className="bg-[#F7FAFC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
            Shop R&J
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#0B1F33] sm:text-4xl">
            Featured Products
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Shop air conditioners, replacement parts and accessories for
            residential and commercial cooling systems.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#EAF6FF] to-[#F8FCFF]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-[#1687D9] shadow-lg">
                    <Icon size={45} />
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1687D9]">
                    {product.category}
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-[#0B1F33]">
                    {product.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {product.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-bold text-[#0B1F33]">
                      Contact for price
                    </span>

                    <button
                      type="button"
                      aria-label={`Add ${product.name} to cart`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1687D9] text-white transition hover:bg-[#1176BF]"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1687D9] px-6 py-3 font-semibold text-[#1687D9] transition hover:bg-[#1687D9] hover:text-white"
          >
            Browse All Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}