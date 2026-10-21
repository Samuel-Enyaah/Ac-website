import { NavLink } from "react-router-dom";
import { Phone, MessageCircle, ShoppingCart } from "lucide-react";
import { useBusinessSettings } from "../../context/BusinessSettingsState";
import { useCart } from "../../context/CartState";
import { phoneHref, whatsappHref } from "../../utils/businessLinks";
import { Drawer, Button } from "../ui/Storefront";
export default function MobileMenu({ open, onClose, links }) {
  const { settings } = useBusinessSettings();
  const { cartCount } = useCart();
  return (
    <Drawer open={open} onClose={onClose} title="Navigation">
      <div id="mobile-navigation">
        <p className="mt-4 text-sm text-[#637381]">{settings.businessName}</p>
        <nav className="my-6 flex flex-col">
          {links.map((link) => (
            <NavLink
              key={link.path}
              end={link.path === "/"}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `border-b border-[#E4E9EE] py-4 text-lg font-semibold ${isActive ? "text-[#106eaf]" : ""}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
        <div className="grid gap-3">
          <Button to="/book-service" onClick={onClose}>
            Book Service
          </Button>
          <Button to="/cart" variant="secondary" onClick={onClose}>
            <ShoppingCart size={18} />
            Cart ({cartCount})
          </Button>
          {settings.primaryPhone && (
            <Button variant="secondary" href={phoneHref(settings.primaryPhone)}>
              <Phone size={17} />
              Call Us
            </Button>
          )}
          {settings.whatsapp && (
            <Button
              variant="secondary"
              href={whatsappHref(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} />
              WhatsApp Us
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
