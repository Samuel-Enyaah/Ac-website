import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../../services/productService";
import ProductCard from "../shop/ProductCard";
import StatusMessage from "../ui/StatusMessage";
export default function FeaturedProductsSection() {
  const [state, setState] = useState({ loading: true, products: [], error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getProducts({ featured: true }).then((products) => {
      if (active) setState({ loading: false, products, error: "" });
    }).catch(() => {
      if (active) setState({ loading: false, products: [], error: "We could not load featured products." });
    });
    return () => { active = false; };
  }, [attempt]);
  const retry = () => { setState({ loading: true, products: [], error: "" }); setAttempt((n) => n + 1); };
  return <section className="bg-[#F7FAFC] py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#1687D9]">Shop R&J</p>
        <h2 className="mt-3 text-3xl font-bold text-[#0B1F33] sm:text-4xl">Featured Products</h2>
        <p className="mt-4 text-gray-600">Air conditioners, replacement parts and accessories for your cooling needs.</p>
      </div>
      <div className="mt-10">
        {state.loading ? <StatusMessage title="Loading featured products?" /> : state.error ? <StatusMessage error title={state.error} onRetry={retry} /> : !state.products.length ? <StatusMessage title="No featured products right now">Browse the shop to see our available catalogue.</StatusMessage> :
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{state.products.slice(0, 6).map((product) => <ProductCard key={product._id} product={product} />)}</div>}
      </div>
      <div className="mt-8 text-center"><Link className="inline-flex min-h-11 items-center font-semibold text-[#1687D9] underline" to="/shop">Browse all products</Link></div>
    </div>
  </section>;
}
