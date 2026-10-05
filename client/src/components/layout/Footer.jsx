import {
  Link,
} from "react-router-dom";

import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";

import {
  useBusinessSettings,
} from "../../context/BusinessSettingsContext";

import {
  emailHref,
  fullAddress,
  phoneHref,
  whatsappHref,
} from "../../utils/businessLinks";

export default function Footer() {
  const {
    settings,
  } = useBusinessSettings();

  const address =
    fullAddress(settings);

  const year =
    new Date().getFullYear();

  const socialLinks = [
    {
      label: "Facebook",
      url:
        settings.socialLinks
          ?.facebook,
    },
    {
      label: "Instagram",
      url:
        settings.socialLinks
          ?.instagram,
    },
    {
      label: "TikTok",
      url:
        settings.socialLinks
          ?.tiktok,
    },
    {
      label: "X",
      url:
        settings.socialLinks
          ?.x,
    },
  ].filter(
    (item) => item.url
  );

  return (
    <footer className="bg-[#071726] text-white">

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Business */}
          <div>

            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >

              {settings.logoUrl ? (
                <img
                  src={
                    settings.logoUrl
                  }
                  alt={
                    settings.businessName
                  }
                  className="h-12 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1687D9] font-black text-white">
                  R&J
                </div>
              )}

              <div>

                <p className="text-xl font-black">
                  {
                    settings.businessName
                  }
                </p>

                <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Air Conditioning
                </p>

              </div>

            </Link>

            {settings.slogan && (
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                {
                  settings.slogan
                }
              </p>
            )}

            {socialLinks.length >
              0 && (
              <div className="mt-6">

                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                  <Share2
                    size={14}
                  />
                  Follow Us
                </p>

                <div className="flex flex-wrap gap-2">

                  {socialLinks.map(
                    (social) => (
                      <a
                        key={
                          social.label
                        }
                        href={
                          social.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#1687D9] hover:text-white"
                      >
                        {
                          social.label
                        }

                        <ExternalLink
                          size={12}
                        />
                      </a>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* Navigation */}
          <div>

            <h3 className="font-bold">
              Quick Links
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">

              <Link
                to="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                to="/shop"
                className="transition hover:text-white"
              >
                Shop
              </Link>

              <Link
                to="/services"
                className="transition hover:text-white"
              >
                Services
              </Link>

              <Link
                to="/book-service"
                className="transition hover:text-white"
              >
                Book Service
              </Link>

              <Link
                to="/about"
                className="transition hover:text-white"
              >
                About Us
              </Link>

              <Link
                to="/contact"
                className="transition hover:text-white"
              >
                Contact
              </Link>

            </div>

          </div>

          {/* Contact */}
          <div>

            <h3 className="font-bold">
              Contact
            </h3>

            <div className="mt-5 space-y-4">

              {settings.primaryPhone && (
                <a
                  href={phoneHref(
                    settings.primaryPhone
                  )}
                  className="flex items-start gap-3 text-sm text-white/60 transition hover:text-white"
                >
                  <Phone
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1687D9]"
                  />

                  <span>
                    {
                      settings.primaryPhone
                    }
                  </span>
                </a>
              )}

              {settings.secondaryPhone && (
                <a
                  href={phoneHref(
                    settings.secondaryPhone
                  )}
                  className="flex items-start gap-3 text-sm text-white/60 transition hover:text-white"
                >
                  <Phone
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1687D9]"
                  />

                  <span>
                    {
                      settings.secondaryPhone
                    }
                  </span>
                </a>
              )}

              {settings.email && (
                <a
                  href={emailHref(
                    settings.email
                  )}
                  className="flex items-start gap-3 text-sm text-white/60 transition hover:text-white"
                >
                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1687D9]"
                  />

                  <span className="break-all">
                    {
                      settings.email
                    }
                  </span>
                </a>
              )}

              {address && (
                <div className="flex items-start gap-3 text-sm leading-6 text-white/60">

                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1687D9]"
                  />

                  <span>
                    {address}
                  </span>

                </div>
              )}

            </div>

          </div>

          {/* Assistance */}
          <div>

            <h3 className="font-bold">
              Need Assistance?
            </h3>

            <p className="mt-5 text-sm leading-7 text-white/60">
              Need help choosing an
              air conditioner, spare
              part or AC service?
              Contact our team.
            </p>

            {settings.whatsapp && (
              <a
                href={whatsappHref(
                  settings.whatsapp
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1176BF]"
              >
                <MessageCircle
                  size={18}
                />

                WhatsApp Us
              </a>
            )}

          </div>

        </div>

        <div className="mt-12 border-t border-white/10 pt-6">

          <div className="flex flex-col gap-3 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {year}{" "}
              {
                settings.legalName
              }
              . All rights reserved.
            </p>

            <p>
              Cooling solutions for
              homes and businesses.
            </p>

          </div>

        </div>

      </div>

    </footer>
  );
}