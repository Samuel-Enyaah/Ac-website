import { Phone, Mail, MessageCircle, MapPin, Clock3 } from "lucide-react";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import {
  phoneHref,
  emailHref,
  whatsappHref,
  fullAddress,
} from "../utils/businessLinks";
import {
  Container,
  PageHero,
  Button,
  Alert,
} from "../components/ui/Storefront";
import usePageMeta from "../hooks/usePageMeta";
export default function Contact() {
  const { settings, loading, error } = useBusinessSettings();
  usePageMeta(
    `Contact ${settings.businessName}`,
    "Find our contact details, service coverage and opening hours. Ask about an AC product or request technical assistance.",
  );
  const contacts = [
    {
      icon: Phone,
      title: "Call our team",
      values: [settings.primaryPhone, settings.secondaryPhone]
        .filter(Boolean)
        .map((value) => ({ label: value, href: phoneHref(value) })),
    },
    {
      icon: Mail,
      title: "Send an email",
      values: settings.email
        ? [{ label: settings.email, href: emailHref(settings.email) }]
        : [],
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      values: settings.whatsapp
        ? [
            {
              label: "Chat with our team",
              href: whatsappHref(settings.whatsapp),
              external: true,
            },
          ]
        : [],
    },
  ].filter((c) => c.values.length);
  const hours = Object.entries(settings.openingHours || {}).filter(
    ([, value]) => value,
  );
  return (
    <>
      <PageHero eyebrow="Contact" title="A conversation can make it clearer.">
        Ask about a product, describe a cooling problem, or discuss the work
        your space needs.
      </PageHero>
      <Container className="section-rj">
        {loading && <Alert>Loading contact information...</Alert>}
        {error && (
          <Alert error>
            Some contact details could not be loaded. Please try again shortly.
          </Alert>
        )}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2>Talk to {settings.businessName}.</h2>
            <p className="lede">{settings.serviceCoverage}</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {contacts.map(({ icon: Icon, title, values }) => (
                <section className="panel" key={title}>
                  <Icon className="text-[#106eaf]" size={25} />
                  <h3 className="mt-4">{title}</h3>
                  {values.map((value) => (
                    <a
                      key={value.href}
                      href={value.href}
                      target={value.external ? "_blank" : undefined}
                      rel={value.external ? "noreferrer" : undefined}
                      className="mt-3 flex min-h-11 items-center break-all text-sm font-semibold text-[#106eaf]"
                    >
                      {value.label}
                    </a>
                  ))}
                </section>
              ))}
              {fullAddress(settings) && (
                <section className="panel">
                  <MapPin size={25} className="text-[#106eaf]" />
                  <h3 className="mt-4">Location</h3>
                  <p className="mt-3 text-sm leading-7 text-[#637381]">
                    {fullAddress(settings)}
                  </p>
                  {settings.mapUrl && (
                    <a
                      href={settings.mapUrl}
                      className="text-link mt-3"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Google Maps
                    </a>
                  )}
                </section>
              )}
            </div>
            <div className="mt-7">
              <Button to="/book-service">Book a Service</Button>
            </div>
          </div>
          {hours.length > 0 && (
            <section className="panel self-start">
              <Clock3 size={26} className="text-[#106eaf]" />
              <h2 className="mt-4 !text-2xl">Opening Hours</h2>
              <dl className="mt-6 divide-y divide-[#E4E9EE]">
                {hours.map(([day, time]) => (
                  <div
                    key={day}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <dt className="font-semibold capitalize">{day}</dt>
                    <dd className="text-[#637381]">{time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 rounded-lg bg-[#EAF6FF] p-4 text-sm leading-7">
                {settings.bookingNote}
              </p>
            </section>
          )}
        </div>
      </Container>
    </>
  );
}
