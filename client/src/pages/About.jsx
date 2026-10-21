import { Snowflake, Wrench, Building2, ArrowRight } from "lucide-react";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import {
  Container,
  PageHero,
  Button,
  SectionHeading,
} from "../components/ui/Storefront";
import usePageMeta from "../hooks/usePageMeta";
export default function About() {
  const { settings } = useBusinessSettings();
  usePageMeta(
    `About ${settings.businessName}`,
    "Meet the business behind your AC products, spare parts, installation and technical service support.",
  );
  return (
    <>
      <PageHero
        eyebrow={`About ${settings.businessName}`}
        title="Cooling products. People who can help."
      >
        We bring AC equipment, essential parts and technical services together,
        so you can move from a question to a practical next step.
      </PageHero>
      <Container className="section-rj">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">{settings.legalName}</p>
            <h2>
              Here for the system.
              <br />
              Here for the space.
            </h2>
            <p className="lede">
              An air conditioner is part of everyday comfort at home and at
              work. Choosing it, installing it and keeping it working all
              deserve attention.
            </p>
            <p className="mt-5 leading-8 text-[#637381]">
              {settings.businessName} combines air-conditioner sales with spare
              parts, installation, repairs, maintenance and diagnosis. Whether
              you are planning a new installation or looking into a fault, our
              focus is on understanding the requirement and agreeing clear next
              steps.
            </p>
          </div>
          <div className="panel bg-[#F5F8FA]">
            <p className="eyebrow">Our service philosophy</p>
            <h2 className="!text-3xl">Start with the right questions.</h2>
            <p className="mt-6 leading-8 text-[#637381]">
              The space, the system, the symptoms and the intended use all
              matter. Tell us what you need; we can discuss products or arrange
              a service request for review.
            </p>
            <Button to="/contact" className="mt-7">
              Talk to our team <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        <div className="mt-16">
          <SectionHeading
            eyebrow="What we do"
            title="Connected support for your cooling."
          />
          <div className="category-grid">
            {[
              [
                Snowflake,
                "Products & parts",
                "Explore air conditioners, replacement parts and accessories in our current catalogue.",
              ],
              [
                Wrench,
                "Technical services",
                "Request installation, repair, maintenance or diagnosis through one service form.",
              ],
              [
                Building2,
                "Home & business",
                "Share residential or commercial requirements, including requests for multiple units.",
              ],
            ].map(([Icon, title, text]) => (
              <div className="panel" key={title}>
                <Icon size={30} className="text-[#106eaf]" />
                <h3 className="mt-5">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#637381]">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="assistance-banner mt-14">
          <div>
            <h2>Your next step starts here.</h2>
            <p className="lede">
              Find a product or tell us which service you need.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to="/shop">Shop Products</Button>
            <Button to="/book-service" variant="secondary">
              Book Service
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
