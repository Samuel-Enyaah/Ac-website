import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, MessageCircle, Wrench } from "lucide-react";
import { getProductBySlug } from "../services/productService";
import { useCart } from "../context/CartState";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import { whatsappHref } from "../utils/businessLinks";
import usePageMeta from "../hooks/usePageMeta";
import useCatalogue from "../hooks/useCatalogue";
import ProductGallery from "../components/shop/ProductGallery";
import ProductCard from "../components/shop/ProductCard";
import {
  Container,
  Breadcrumb,
  Button,
  PriceDisplay,
  QuantitySelector,
  Alert,
  Skeleton,
  SectionHeading,
} from "../components/ui/Storefront";
export default function ProductDetails() {
  const { productId } = useParams();
  return <ProductPage key={productId} slug={productId} />;
}
function ProductPage({ slug }) {
  const [state, setState] = useState({
    loading: true,
    product: null,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { products } = useCatalogue();
  const { cartItems, addToCart } = useCart();
  const { settings } = useBusinessSettings();
  const product = state.product;
  usePageMeta(
    product?.name || "Product details",
    product?.shortDescription ||
      product?.description ||
      "View product information, images, availability and cooling assistance.",
  );
  useEffect(() => {
    let active = true;
    getProductBySlug(slug)
      .then((product) => {
        if (active) setState({ loading: false, product, error: "" });
      })
      .catch(() => {
        if (active)
          setState({
            loading: false,
            product: null,
            error: "This product is unavailable or could not be loaded.",
          });
      });
    return () => {
      active = false;
    };
  }, [slug, attempt]);
  if (state.loading)
    return (
      <Container className="section-rj">
        <Skeleton count={2} />
      </Container>
    );
  if (!product)
    return (
      <Container className="section-rj">
        <Alert error>{state.error}</Alert>
        <Button
          className="mt-6"
          onClick={() => {
            setState({ loading: true, product: null, error: "" });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
        <Button className="ml-3 mt-6" variant="secondary" to="/shop">
          Back to Shop
        </Button>
      </Container>
    );
  const remaining = Math.max(
    0,
    product.stock -
      (cartItems.find((p) => p._id === product._id)?.quantity || 0),
  );
  const related = products
    .filter((p) => p._id !== product._id && p.category === product.category)
    .slice(0, 4);
  return (
    <>
      <Container className="py-9">
        <Breadcrumb
          items={[
            { label: "Shop", to: "/shop" },
            {
              label: product.category,
              to: `/shop?category=${encodeURIComponent(product.category)}`,
            },
            { label: product.name },
          ]}
        />
        <div className="product-detail-grid">
          <ProductGallery product={product} />
          <div className="min-w-0">
            <p className="eyebrow">{product.brand || product.category}</p>
            <h1 className="!text-3xl sm:!text-4xl">{product.name}</h1>
            {product.shortDescription && (
              <p className="lede">{product.shortDescription}</p>
            )}
            <div className="my-6">
              <PriceDisplay
                large
                price={product.price}
                oldPrice={product.oldPrice}
              />
              {product.oldPrice > product.price && (
                <p className="mt-2 text-sm text-[#106eaf]">
                  Save{" "}
                  {Math.round((1 - product.price / product.oldPrice) * 100)}% on
                  the previous price
                </p>
              )}
            </div>
            <p className="badge">
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </p>
            <div className="my-7 flex flex-wrap gap-3">
              <QuantitySelector
                value={Math.min(quantity, Math.max(1, remaining))}
                max={remaining}
                disabled={!remaining}
                name={product.name}
                onChange={setQuantity}
              />
              <Button
                disabled={!remaining}
                onClick={() => {
                  addToCart(product, Math.min(quantity, remaining));
                  setAdded(true);
                }}
              >
                <ShoppingCart size={18} />
                {product.stock < 1
                  ? "Out of stock"
                  : remaining < 1
                    ? "Stock limit in cart"
                    : "Add to Cart"}
              </Button>
            </div>
            {added && (
              <Alert>
                Added to Cart.{" "}
                <Link className="font-bold underline" to="/cart">
                  Review your cart
                </Link>
              </Alert>
            )}
            <div className="mt-6 grid gap-3">
              {product.category === "Air Conditioners" && (
                <Button
                  variant="secondary"
                  to="/book-service?service=installation"
                >
                  <Wrench size={17} />
                  Book Installation
                </Button>
              )}
              {settings.whatsapp ? (
                <Button
                  variant="secondary"
                  href={whatsappHref(
                    settings.whatsapp,
                    `Hello, I would like help with ${product.name}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={17} />
                  Ask about this product
                </Button>
              ) : (
                <Button variant="secondary" to="/contact">
                  Product assistance
                </Button>
              )}
            </div>
            <div className="mt-7 border-t border-[#E4E9EE] pt-5 text-sm text-[#637381]">
              <p>{settings.deliveryNote}</p>
              <p className="mt-2">
                Installation can be requested at checkout. Arrangements and
                charges are confirmed with our team.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="panel">
            <h2 className="!text-xl">Product description</h2>
            <p className="mt-5 whitespace-pre-line leading-8 text-[#637381]">
              {product.description}
            </p>
          </section>
          {product.specifications?.length > 0 && (
            <section className="panel">
              <h2 className="!text-xl">Specifications</h2>
              <ul className="mt-4 divide-y divide-[#E4E9EE]">
                {product.specifications.map((spec, i) => (
                  <li key={i} className="py-3 text-sm">
                    {spec}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
      {related.length > 0 && (
        <section className="section-rj bg-[#F5F8FA]">
          <Container>
            <SectionHeading
              eyebrow="Explore more"
              title="Related products"
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              action="View category"
            />
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
