import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, ShoppingCart, Snowflake } from "lucide-react";
import { useCart } from "../../context/CartState";
import { useBusinessSettings } from "../../context/BusinessSettingsState";
import { Container, Button } from "../ui/Storefront";
import MobileMenu from "./MobileMenu";
const links = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
  { name: "Services", path: "/services" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings } = useBusinessSettings();
  const { cartCount } = useCart();
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-[#E4E9EE] bg-white transition-shadow ${scrolled ? "shadow-md" : ""}`}
      >
        <Container className="flex h-20 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label={`${settings.businessName} home`}
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt=""
                className="h-11 w-11 shrink-0 object-contain"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EAF6FF] text-[#1687D9]">
                <Snowflake size={27} />
              </span>
            )}
            <span className="min-w-0">
              <span className="block max-w-48 truncate text-lg font-extrabold tracking-tight text-[#0B1F33]">
                {settings.businessName}
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[.17em] text-[#637381] sm:block">
                Cooling & technical services
              </span>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-4 xl:gap-6 lg:flex"
          >
            {links.map((link) => (
              <NavLink
                end={link.path === "/"}
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center border-b-2 text-sm font-semibold ${isActive ? "border-[#1687D9] text-[#106eaf]" : "border-transparent hover:text-[#106eaf]"}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button to="/book-service" className="hidden lg:inline-flex">
              Book Service
            </Button>
            <Link
              to="/cart"
              className="icon-button relative"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-1 top-0 rounded-full bg-[#F59E0B] px-1.5 text-[10px] font-bold text-[#0B1F33]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="icon-button lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
          </div>
        </Container>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} links={links} />
    </>
  );
}
