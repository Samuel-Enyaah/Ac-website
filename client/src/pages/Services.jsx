import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { services } from "../data/services";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import {
  Container,
  PageHero,
  Button,
  SectionHeading,
} from "../components/ui/Storefront";
import usePageMeta from "../hooks/usePageMeta";
const guidance = {
  installation: "For a new unit, a move, or a space that needs better cooling.",
  repairs:
    "For leaks, unusual noise, electrical faults or an AC that is not cooling.",
  maintenance:
    "For routine cleaning, performance checks and ongoing system care.",
  diagnosis: "When you need to understand a fault before deciding on a repair.",
  "spare-parts":
    "When you need help identifying a replacement part or installation accessory.",
  commercial:
    "For offices, shops and commercial premises with one or multiple units.",
};
export default function Services() {
  const { settings } = useBusinessSettings();
  usePageMeta(
    "AC installation, repair & maintenance",
    "Request AC installation, repairs, maintenance, diagnosis, spare parts assistance and commercial cooling services.",
  );
  return (
    <>
      <PageHero
        eyebrow="Technical services"
        title="Keep your cooling working for you."
      >
        From the first installation to ongoing care, choose the support your
        system needs.
      </PageHero>
      <Container className="section-rj">
        <SectionHeading
          eyebrow="How we can help"
          title="Practical support. Clear next steps."
        >
          {settings.serviceCoverage}
        </SectionHeading>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ id, title, description, features, icon: Icon }) => (
            <article key={id} className="panel flex flex-col">
              <Icon size={32} strokeWidth={1.4} className="text-[#106eaf]" />
              <h2 className="!text-2xl mt-5">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#637381]">
                {guidance[id]}
              </p>
              <p className="mt-3 text-sm leading-7">{description}</p>
              <ul className="my-6 space-y-3">
                {features.slice(0, 4).map((feature) => (
                  <li
                    className="flex items-start gap-2 text-sm text-[#637381]"
                    key={feature}
                  >
                    <Check size={17} className="mt-1 shrink-0 text-[#106eaf]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                className="text-link mt-auto"
                to={`/book-service?service=${id}`}
              >
                Book This Service <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
        <div className="assistance-banner mt-12">
          <div>
            <h2>Not sure where to start?</h2>
            <p className="lede">
              Describe the issue in a diagnosis request, or speak with our team
              before booking.
            </p>
          </div>
          <Button to="/book-service?service=diagnosis">
            Request a diagnosis
          </Button>
        </div>
        <section className="mt-14">
          <h2 className="!text-2xl">Before you request a service</h2>
          <div className="mt-6 divide-y divide-[#E4E9EE]">
            {[
              [
                "Is my preferred time confirmed?",
                settings.bookingNote ||
                  "A request is reviewed before a visit is confirmed. Our team will contact you to agree the details.",
              ],
              [
                "What information should I include?",
                "Tell us the unit type, brand, number of units and the issue. Add your location and a useful landmark.",
              ],
              [
                "How are charges agreed?",
                "Describe the work you need. Our team will discuss the scope and charges with you before proceeding.",
              ],
            ].map(([question, answer]) => (
              <details className="py-5" key={question}>
                <summary className="cursor-pointer font-semibold">
                  {question}
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#637381]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
