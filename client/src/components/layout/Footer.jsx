import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Snowflake,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B1F33] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link
            to="/"
            className="mb-5 flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1687D9] text-white">
              <Snowflake size={23} />
            </div>

            <div>
              <h2 className="font-bold">
                R&J AC
              </h2>

              <p className="text-[10px] tracking-wide text-white/60">
                ACCESSARIES COM. LTD
              </p>
            </div>
          </Link>

          <p className="max-w-sm text-sm leading-7 text-white/70">
            Reliable air-conditioning sales, spare parts,
            installation, repairs, servicing and maintenance
            solutions for homes and businesses.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="#"
              aria-label="R&J AC WhatsApp"
              className="rounded-lg bg-white/10 p-2.5 text-white transition hover:bg-[#1687D9]"
            >
              <MessageCircle size={18} />
            </a>

            <a
              href="#"
              aria-label="R&J AC social media"
              className="rounded-lg bg-white/10 p-2.5 text-white transition hover:bg-[#1687D9]"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-5 font-semibold">
            Quick Links
          </h3>

          <div className="flex flex-col gap-3 text-sm text-white/70">
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
              Book a Service
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

        <div>
          <h3 className="mb-5 font-semibold">
            Our Services
          </h3>

          <div className="flex flex-col gap-3 text-sm text-white/70">
            <span>Air Conditioner Sales</span>
            <span>AC Installation</span>
            <span>AC Repairs</span>
            <span>Servicing & Maintenance</span>
            <span>AC Spare Parts</span>
            <span>Commercial AC Solutions</span>
          </div>
        </div>

        <div>
          <h3 className="mb-5 font-semibold">
            Contact Us
          </h3>

          <div className="space-y-4 text-sm text-white/70">
            <div className="flex items-start gap-3">
              <Phone
                size={18}
                className="mt-0.5 shrink-0 text-[#1687D9]"
              />

              <span>
                Phone number coming soon
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                size={18}
                className="mt-0.5 shrink-0 text-[#1687D9]"
              />

              <span>
                Email coming soon
              </span>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-[#1687D9]"
              />

              <span>
                Business location coming soon
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Clock
                size={18}
                className="mt-0.5 shrink-0 text-[#1687D9]"
              />

              <span>
                Business hours coming soon
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © {currentYear} R&J AC ACCESSARIES COM. LTD. All rights reserved.
          </p>

          <p>
            Cooling Solutions You Can Rely On.
          </p>
        </div>
      </div>
    </footer>
  );
}