import { Link } from "react-router-dom";
import { ArrowUpRight, Snowflake } from "lucide-react";
import { useBusinessSettings } from "../../context/BusinessSettingsState";
import { phoneHref, emailHref, fullAddress } from "../../utils/businessLinks";
import { Container } from "../ui/Storefront";
export default function Footer() {
  const { settings } = useBusinessSettings();
  const socials = Object.entries(settings.socialLinks || {}).filter(([, url]) =>
    /^https?:\/\//.test(url),
  );
  return (
    <footer className="bg-[#0B1F33] text-white">
      <Container className="pb-7 pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  className="h-12 w-12 rounded bg-white object-contain"
                />
              ) : (
                <Snowflake size={32} className="text-[#72c5ff]" />
              )}
              <span className="text-xl font-bold">{settings.businessName}</span>
            </Link>
            <p className="mt-5 text-sm text-slate-300">{settings.slogan}</p>
            <p className="mt-3 text-sm text-slate-300">
              AC products, spare parts and technical support for homes and
              businesses.
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {socials.map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 text-sm capitalize"
                  >
                    {name}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-4 font-bold">Explore</p>
            <div className="grid gap-1 text-sm text-slate-300">
              {[
                ["Shop", "/shop"],
                ["Services", "/services"],
                ["Book Service", "/book-service"],
                ["About us", "/about"],
                ["Contact", "/contact"],
              ].map(([name, to]) => (
                <Link
                  className="inline-flex min-h-11 items-center hover:text-white"
                  key={to}
                  to={to}
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 font-bold">Shop by category</p>
            <div className="grid gap-2 text-sm text-slate-300">
              {["Air Conditioners", "Spare Parts", "Accessories"].map(
                (category) => (
                  <Link
                    className="inline-flex min-h-11 items-center hover:text-white"
                    key={category}
                    to={`/shop?category=${encodeURIComponent(category)}`}
                  >
                    {category}
                  </Link>
                ),
              )}
            </div>
            <Link
              to="/book-service?service=installation"
              className="mt-4 inline-flex min-h-11 items-center text-sm text-[#92d1ff]"
            >
              Need installation? <ArrowUpRight size={16} />
            </Link>
          </div>
          <div>
            <p className="mb-4 font-bold">Talk to our team</p>
            <div className="grid gap-3 break-words text-sm text-slate-300">
              {settings.primaryPhone && (
                <a href={phoneHref(settings.primaryPhone)} className="min-h-11">
                  {settings.primaryPhone}
                </a>
              )}
              {settings.email && (
                <a
                  className="inline-flex min-h-11 items-center break-all"
                  href={emailHref(settings.email)}
                >
                  {settings.email}
                </a>
              )}
              {fullAddress(settings) && <p>{fullAddress(settings)}</p>}
              {settings.openingHours?.monday && (
                <p>
                  Monday: {settings.openingHours.monday}
                  <br />
                  <Link
                    className="inline-flex min-h-11 items-center underline"
                    to="/contact"
                  >
                    View all opening hours
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs text-slate-300">
          <p>
            &copy; {new Date().getFullYear()} {settings.legalName}. All rights
            reserved.
          </p>
          <p>Products. Parts. Service.</p>
        </div>
      </Container>
    </footer>
  );
}
