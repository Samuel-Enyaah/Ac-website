import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search } from "lucide-react";
import useCatalogue from "../hooks/useCatalogue";
import usePageMeta from "../hooks/usePageMeta";
import ProductCard from "../components/shop/ProductCard";
import {
  Container,
  PageHero,
  Button,
  Drawer,
  Skeleton,
  Alert,
} from "../components/ui/Storefront";
const categories = ["Air Conditioners", "Spare Parts", "Accessories"];

function CatalogueSearch({ value, onChange }) {
  const [text, setText] = useState(value);
  const [observedValue, setObservedValue] = useState(value);
  if (value !== observedValue) {
    setObservedValue(value);
    // Restore cleared/shared/history searches, ignoring an older navigation
    // while a more recent keystroke is already reflected in the browser URL.
    const current = new URLSearchParams(window.location.search).get("search") || "";
    if (current === value) setText(value);
  }
  return (
    <input
      id="product-search"
      type="search"
      className="!pl-10"
      placeholder="Search products or brands"
      value={text}
      onChange={(event) => {
        // Keep the controlled input urgent; router navigation is a transition.
        setText(event.target.value);
        onChange(event.target.value);
      }}
    />
  );
}

export default function Shop() {
  const { products, loading, error, retry } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  usePageMeta(
    "Shop air conditioners, parts & accessories",
    "Explore our current AC catalogue. Search by product or brand, compare prices and check availability.",
  );
  const search = params.get("search") || "",
    category = params.get("category") || "",
    brand = params.get("brand") || "",
    stock = params.get("stock") || "",
    sort = params.get("sort") || "newest";
  const update = (key, value) =>
    setParams(
      () => {
        const next = new URLSearchParams(window.location.search);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: key === "search" },
    );
  const brands = [
    ...new Set(products.map((p) => p.brand).filter(Boolean)),
  ].sort();
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (!category || p.category === category) &&
            (!brand || p.brand === brand) &&
            (stock !== "in" || p.stock > 0) &&
            (!search ||
              `${p.name} ${p.brand} ${p.description}`
                .toLowerCase()
                .includes(search.toLowerCase().trim())),
        )
        .sort((a, b) =>
          sort === "price-asc"
            ? a.price - b.price
            : sort === "price-desc"
              ? b.price - a.price
              : new Date(b.createdAt) - new Date(a.createdAt),
        ),
    [products, category, brand, stock, search, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
  );
  const filters = (prefix) => (
    <div className="grid gap-6">
      <div>
        <label
          className="mb-2 block text-sm font-bold"
          htmlFor={`${prefix}-category`}
        >
          Category
        </label>
        <select
          id={`${prefix}-category`}
          value={category}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {brands.length > 0 && (
        <div>
          <label
            className="mb-2 block text-sm font-bold"
            htmlFor={`${prefix}-brand`}
          >
            Brand
          </label>
          <select
            id={`${prefix}-brand`}
            value={brand}
            onChange={(e) => update("brand", e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      )}
      <label className="choice">
        <input
          type="checkbox"
          checked={stock === "in"}
          onChange={(e) => update("stock", e.target.checked ? "in" : "")}
        />
        In stock only
      </label>
      <Button variant="secondary" onClick={() => setParams({})}>
        Clear filters
      </Button>
    </div>
  );
  return (
    <>
      <PageHero
        eyebrow="The R&J catalogue"
        title="Find your next cooling solution."
      >
        Air conditioners, spare parts and accessories. Explore current prices
        and availability, or contact us for help choosing.
      </PageHero>
      <Container className="section-rj">
        <div className="catalogue-layout">
          <aside className="hidden lg:block">
            <h2 className="!text-xl mb-6">Filter products</h2>
            {filters("desktop")}
          </aside>
          <div className="min-w-0">
            <div className="catalogue-toolbar">
              <div className="relative flex-1">
                <label className="sr-only" htmlFor="product-search">
                  Search products
                </label>
                <Search
                  size={18}
                  className="absolute left-3 top-4 text-[#637381]"
                />
                <CatalogueSearch
                  value={search}
                  onChange={(value) => update("search", value)}
                />
              </div>
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setOpen(true)}
              >
                <SlidersHorizontal size={17} />
                Filters
              </Button>
              <div>
                <label className="sr-only" htmlFor="product-sort">
                  Sort products
                </label>
                <select
                  id="product-sort"
                  value={sort}
                  onChange={(e) => update("sort", e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
            </div>
            <div className="my-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="!text-xl">{category || "All products"}</h2>
              {!loading && (
                <p role="status" className="text-sm text-[#637381]">
                  {filtered.length} products
                  {filtered.length > 0 ? ` / Page ${page} of ${pages}` : ""}
                </p>
              )}
            </div>
            {loading ? (
              <Skeleton count={6} />
            ) : error ? (
              <Alert error>
                {error}
                <button onClick={retry} className="text-link ml-3">
                  Try again
                </button>
              </Alert>
            ) : filtered.length ? (
              <>
                <div className="product-grid catalogue-grid">
                  {filtered.slice((page - 1) * 12, page * 12).map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
                {pages > 1 && (
                  <nav
                    className="mt-10 flex flex-wrap justify-center gap-3"
                    aria-label="Product pagination"
                  >
                    <Button
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => update("page", String(page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-3">
                      {page} / {pages}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={page === pages}
                      onClick={() => update("page", String(page + 1))}
                    >
                      Next
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <div className="empty-state">
                <h2>No products found</h2>
                <p>Try a different search or explore all categories.</p>
                <Button onClick={() => setParams({})}>Clear filters</Button>
              </div>
            )}
          </div>
        </div>
      </Container>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Product filters"
      >
        <div className="mt-8">
          {filters("mobile")}
          <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
            Show {filtered.length} products
          </Button>
        </div>
      </Drawer>
    </>
  );
}
