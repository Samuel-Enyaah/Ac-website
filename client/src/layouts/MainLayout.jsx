import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";

import AnnouncementBar from "../components/layout/AnnouncementBar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WhatsAppButton from "../components/layout/WhatsAppButton";

export default function MainLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <div className="storefront flex min-h-screen flex-col bg-white">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AnnouncementBar />

      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
