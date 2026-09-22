import { Link, NavLink } from "react-router-dom";
import {
  X,
  Phone,
  MessageCircle,
  Snowflake,
} from "lucide-react";

export default function MobileMenu({
  open,
  onClose,
  links,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close navigation menu"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1687D9] text-white">
              <Snowflake size={21} />
            </div>

            <div>
              <p className="font-bold text-[#0B1F33]">
                R&J AC
              </p>

              <p className="text-[10px] text-gray-500">
                ACCESSARIES COM. LTD
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-10 flex flex-col">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `border-b border-gray-100 py-4 text-base font-semibold transition ${
                  isActive
                    ? "text-[#1687D9]"
                    : "text-[#17212B] hover:text-[#1687D9]"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-8">
          <a
            href="tel:"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1687D9] px-4 py-3 font-semibold text-[#1687D9]"
          >
            <Phone size={18} />
            Call R&J
          </a>

          <a
            href="#"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-4 py-3 font-semibold text-white"
          >
            <MessageCircle size={18} />
            WhatsApp Us
          </a>
        </div>
      </aside>
    </div>
  );
}