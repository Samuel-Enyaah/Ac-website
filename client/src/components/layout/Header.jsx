import { useState } from "react";
import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  Phone,
  Snowflake,
} from "lucide-react";

import MobileMenu from "./MobileMenu";

import { useCart } from "../../context/CartContext";

const navLinks = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Shop",
    path: "/shop",
  },
  {
    name: "Services",
    path: "/services",
  },
  {
    name: "Book a Service",
    path: "/book-service",
  },
  {
    name: "About",
    path: "/about",
  },
  {
    name: "Contact",
    path: "/contact",
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const { cartCount } = useCart();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1687D9] text-white shadow-sm">
              <Snowflake size={23} />
            </div>

            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-[#0B1F33]">
                R&J AC
              </p>

              <p className="hidden text-[10px] font-medium tracking-wide text-gray-500 sm:block">
                ACCESSARIES COM. LTD
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${
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

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/shop"
              aria-label="Search products"
              className="hidden rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 md:flex"
            >
              <Search size={20} />
            </Link>

            <button
              type="button"
              aria-label="Customer account"
              className="hidden rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 md:flex"
            >
              <UserRound size={20} />
            </button>

            <Link
              to="/cart"
              aria-label="Shopping cart"
              className="relative rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            <a
              href="tel:"
              className="hidden items-center gap-2 rounded-xl bg-[#1687D9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1176BF] xl:flex"
            >
              <Phone size={17} />
              Call Us
            </a>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#0B1F33] transition hover:bg-gray-100 lg:hidden"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() =>
          setMobileMenuOpen(false)
        }
        links={navLinks}
      />
    </>
  );
}