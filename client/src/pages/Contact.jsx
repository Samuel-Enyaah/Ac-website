import {
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import {
  useBusinessSettings,
} from "../context/BusinessSettingsContext";

import {
  emailHref,
  fullAddress,
  phoneHref,
  whatsappHref,
} from "../utils/businessLinks";

const days = [
  ["Monday", "monday"],
  ["Tuesday", "tuesday"],
  ["Wednesday", "wednesday"],
  ["Thursday", "thursday"],
  ["Friday", "friday"],
  ["Saturday", "saturday"],
  ["Sunday", "sunday"],
];

export default function Contact() {
  const {
    settings,
    loading,
  } = useBusinessSettings();

  const address =
    fullAddress(settings);

  return (
    <main className="bg-[#F8FAFC]">

      {/* Hero */}
      <section className="bg-[#0B1F33] px-5 py-16 text-white sm:px-6 lg:px-8 lg:py-20">

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#58B7F3]">
            Contact Us
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            We&apos;re here to help
            with your cooling needs.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
            Reach out for product
            enquiries, installation,
            repairs, maintenance,
            diagnosis or general air
            conditioning assistance.
          </p>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading contact
            information...
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">

            {/* Contact information */}
            <div className="space-y-6">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
                  Get In Touch
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#0B1F33]">
                  Contact{" "}
                  {
                    settings.businessName
                  }
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-gray-500">
                  {
                    settings.serviceCoverage
                  }
                </p>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <ContactCard
                  icon={Phone}
                  title="Call Us"
                >
                  {settings.primaryPhone ? (
                    <a
                      href={phoneHref(
                        settings.primaryPhone
                      )}
                      className="font-semibold text-[#0B1F33] hover:text-[#1687D9]"
                    >
                      {
                        settings.primaryPhone
                      }
                    </a>
                  ) : (
                    <span>
                      Contact number
                      coming soon
                    </span>
                  )}

                  {settings.secondaryPhone && (
                    <a
                      href={phoneHref(
                        settings.secondaryPhone
                      )}
                      className="mt-1 block font-semibold text-[#0B1F33] hover:text-[#1687D9]"
                    >
                      {
                        settings.secondaryPhone
                      }
                    </a>
                  )}
                </ContactCard>

                <ContactCard
                  icon={Mail}
                  title="Email"
                >
                  {settings.email ? (
                    <a
                      href={emailHref(
                        settings.email
                      )}
                      className="break-all font-semibold text-[#0B1F33] hover:text-[#1687D9]"
                    >
                      {
                        settings.email
                      }
                    </a>
                  ) : (
                    <span>
                      Email coming soon
                    </span>
                  )}
                </ContactCard>

                <ContactCard
                  icon={MapPin}
                  title="Location"
                >
                  <p>
                    {address ||
                      "Business location coming soon"}
                  </p>
                </ContactCard>

                <ContactCard
                  icon={
                    MessageCircle
                  }
                  title="WhatsApp"
                >
                  {settings.whatsapp ? (
                    <a
                      href={whatsappHref(
                        settings.whatsapp
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#1687D9]"
                    >
                      Chat with us on
                      WhatsApp
                    </a>
                  ) : (
                    <span>
                      WhatsApp contact
                      coming soon
                    </span>
                  )}
                </ContactCard>

              </div>

              {settings.mapUrl && (
                <a
                  href={
                    settings.mapUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1176BF]"
                >
                  <MapPin
                    size={18}
                  />

                  View on Google Maps

                  <ExternalLink
                    size={15}
                  />
                </a>
              )}

            </div>

            {/* Opening Hours */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
                  <Clock3
                    size={21}
                  />
                </div>

                <div>

                  <h2 className="text-xl font-black text-[#0B1F33]">
                    Opening Hours
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Our normal
                    operating hours.
                  </p>

                </div>

              </div>

              <div className="mt-7 space-y-4">

                {days.map(
                  ([
                    label,
                    key,
                  ]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-5 border-b border-gray-100 pb-4 text-sm last:border-0"
                    >
                      <span className="font-semibold text-[#0B1F33]">
                        {label}
                      </span>

                      <span
                        className={`text-right ${
                          settings
                            .openingHours?.[
                            key
                          ] ===
                          "Closed"
                            ? "font-semibold text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {
                          settings
                            .openingHours?.[
                            key
                          ] ||
                          "Not specified"
                        }
                      </span>

                    </div>
                  )
                )}

              </div>

              {settings.bookingNote && (
                <div className="mt-7 rounded-2xl bg-[#EAF6FF] p-5">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1687D9]">
                    Service Requests
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#0B1F33]">
                    {
                      settings.bookingNote
                    }
                  </p>

                </div>
              )}

            </div>

          </div>
        )}

      </section>

    </main>
  );
}

function ContactCard({
  icon: Icon,
  title,
  children,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
        <Icon size={19} />
      </div>

      <h3 className="mt-4 font-bold text-[#0B1F33]">
        {title}
      </h3>

      <div className="mt-2 text-sm leading-6 text-gray-500">
        {children}
      </div>

    </div>
  );
}