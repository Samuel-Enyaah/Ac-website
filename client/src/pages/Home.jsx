import { Link } from "react-router-dom";
import {
  ArrowRight,
  Snowflake,
  Wrench,
  Package,
  Building2,
  Phone,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Container,
  Button,
  SectionHeading,
  Skeleton,
  Alert,
} from "../components/ui/Storefront";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import { phoneHref, whatsappHref } from "../utils/businessLinks";
import useCatalogue from "../hooks/useCatalogue";
import usePageMeta from "../hooks/usePageMeta";
import ProductCard from "../components/shop/ProductCard";
import { services } from "../data/services";
const categories = [
  {
    name: "Air Conditioners",
    description: "Find the right cooling system for your space.",
    icon: Snowflake,
  },
  {
    name: "Spare Parts",
    description: "Replacement parts to get your system running.",
    icon: Wrench,
  },
  {
    name: "Accessories",
    description: "The essentials for installation and everyday use.",
    icon: Package,
  },
];
export default function Home() {
  const { settings } = useBusinessSettings();
  const { products, loading, error, retry } = useCatalogue();
  usePageMeta(
    "Air conditioning products & services",
    "Shop air conditioners, spare parts and accessories. Request installation, repairs, maintenance and diagnosis for homes and businesses.",
  );
  const featured = products.filter((p) => p.featured);
  const hero =
    products.find(
      (p) => p.category === "Air Conditioners" && p.images?.[0]?.url,
    ) || products.find((p) => p.images?.[0]?.url);
  return (
    <>
      <section className="home-hero">
        <Container className="home-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              {settings.businessName} / Cooling made practical
            </p>
            <h1>
              Better cooling.
              <br />
              <span>From the right people.</span>
            </h1>
            <p className="lede">
              Air conditioners, the parts that keep them working, and technical
              support when you need it. One place for your home and business
              cooling needs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/shop">
                Shop Products <ArrowRight size={18} />
              </Button>
              <Button to="/book-service" variant="secondary">
                Book a Service
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-1">
              {settings.primaryPhone && (
                <a
                  className="text-link"
                  href={phoneHref(settings.primaryPhone)}
                >
                  <Phone size={15} />
                  {settings.primaryPhone}
                </a>
              )}
              {settings.whatsapp && (
                <a
                  className="text-link"
                  href={whatsappHref(settings.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  Ask us on WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="hero-product">
            <div className="flex items-center justify-between">
              <span className="eyebrow">
                {hero ? "In the catalogue" : "Products & technical support"}
              </span>
              <Snowflake size={28} className="text-[#1687D9]" />
            </div>
            {hero ? (
              <>
                <Link to={`/shop/${hero.slug}`} className="hero-media">
                  <img
                    src={hero.images[0].url}
                    alt={hero.name}
                    fetchPriority="high"
                  />
                </Link>
                <div className="hero-caption">
                  <div>
                    <p className="text-xs text-[#637381]">
                      {hero.category}
                      {hero.brand ? ` / ${hero.brand}` : ""}
                    </p>
                    <Link
                      to={`/shop/${hero.slug}`}
                      className="mt-2 block text-lg font-bold leading-snug"
                    >
                      {hero.name}
                    </Link>
                  </div>
                  <Link
                    to={`/shop/${hero.slug}`}
                    className="icon-button bg-white"
                    aria-label={`Explore ${hero.name}`}
                  >
                    <ArrowRight />
                  </Link>
                </div>
              </>
            ) : (
              <div className="hero-service-panel">
                <Snowflake size={92} strokeWidth={1} />
                <h2>Comfort starts with the right solution.</h2>
                <p>
                  Tell us about your space, system or repair. We will help you
                  decide what comes next.
                </p>
                <Button to="/services" variant="secondary">
                  Explore our services <ArrowRight size={18} />
                </Button>
              </div>
            )}
          </div>
        </Container>
      </section>
      <div className="border-y border-[#E4E9EE]">
        <Container className="trust-strip">
          {[
            [Snowflake, "AC products & spare parts"],
            [Wrench, "Installation & repairs"],
            [Building2, "Residential & commercial"],
            [MessageCircle, "Product & service assistance"],
          ].map(([Icon, title]) => (
            <div key={title}>
              <Icon size={21} />
              <span>{title}</span>
            </div>
          ))}
        </Container>
      </div>
      <section className="section-rj">
        <Container>
          <SectionHeading
            eyebrow="Find what you need"
            title="Cooling, down to the details."
            to="/shop"
            action="Explore the shop"
          />
          <div className="category-grid">
            {categories.map(({ name, description, icon: Icon }, i) => (
              <Link
                key={name}
                to={`/shop?category=${encodeURIComponent(name)}`}
                className="category-card"
              >
                <div className="flex items-center justify-between">
                  <Icon size={35} strokeWidth={1.4} />
                  <span className="text-xs text-[#637381]">0{i + 1}</span>
                </div>
                <h3>{name}</h3>
                <p>{description}</p>
                <span className="text-link">
                  Shop category <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <section className="section-rj bg-[#F5F8FA]">
        <Container>
          <SectionHeading
            eyebrow="From our catalogue"
            title="Featured Products"
            to="/shop"
            action="Browse all products"
          >
            Explore current products, with prices and availability from our
            shop.
          </SectionHeading>
          {loading ? (
            <Skeleton />
          ) : error ? (
            <Alert error>
              {error}
              <button className="text-link ml-3" onClick={retry}>
                Try again
              </button>
            </Alert>
          ) : featured.length ? (
            <div className="product-grid">
              {featured.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="panel">
              <p>No featured products right now.</p>
              <Link className="text-link" to="/shop">
                Browse the current catalogue <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </Container>
      </section>
      <section className="section-rj">
        <Container>
          <SectionHeading
            eyebrow="Beyond the product"
            title="Service for every stage."
            to="/services"
            action="All services"
          >
            From a first installation to a system that needs attention, tell us
            what you need.
          </SectionHeading>
          <div className="service-grid">
            {services
              .slice(0, 4)
              .map(({ id, title, shortDescription, icon: Icon }) => (
                <Link
                  className="service-tile"
                  key={id}
                  to={`/book-service?service=${id}`}
                >
                  <Icon size={28} strokeWidth={1.5} />
                  <h3>{title}</h3>
                  <p>{shortDescription}</p>
                  <span className="text-link">
                    Request service <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
          </div>
        </Container>
      </section>
      <section className="section-rj bg-[#0B1F33] text-white">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-[#92d1ff]">A practical approach</p>
            <h2 className="!text-white">
              Good products.
              <br />
              Thoughtful technical support.
            </h2>
            <p className="mt-6 max-w-lg leading-8 text-slate-300">
              Choosing a unit is only part of the job. We help with
              installation, diagnosis, repairs and the parts your system needs
              along the way.
            </p>
            <Button to="/about" variant="secondary" className="mt-7">
              Meet {settings.businessName}
              <ArrowRight size={17} />
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              [
                "One place for AC support",
                "Shop equipment and parts, or request a service through the same team.",
              ],
              [
                "A conversation first",
                "Share your requirements so the next steps can be confirmed with you.",
              ],
              [
                "For your space",
                "Support for home cooling and commercial systems, including multi-unit requests.",
              ],
              [
                "Clear next steps",
                "Order and service references make it easier to follow up with our team.",
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <CheckCircle2 className="mb-4 text-[#92d1ff]" size={22} />
                <h3 className="!text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="section-rj">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="From your request to the next step."
          />
          <ol className="process-grid">
            {[
              [
                "Choose or describe",
                "Find a product, or tell us which service you need.",
              ],
              [
                "Send your request",
                "Place an order or submit a service request and keep your reference.",
              ],
              [
                "Confirm the details",
                "Our team reviews availability, location, timing and any charges with you.",
              ],
              [
                "Arrange delivery or service",
                "Proceed with the delivery, collection or visit agreed with our team.",
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="pb-20">
        <Container>
          <div className="assistance-banner">
            <div>
              <p className="eyebrow">Homes, workplaces & commercial spaces</p>
              <h2>Let us help you plan your cooling.</h2>
              <p className="lede">{settings.serviceCoverage}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/book-service">
                Book Service <ArrowRight size={17} />
              </Button>
              <Button to="/contact" variant="secondary">
                Talk to our team
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
