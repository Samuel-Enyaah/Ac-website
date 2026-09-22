import { Outlet } from "react-router-dom";

import AnnouncementBar from "../components/layout/AnnouncementBar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WhatsAppButton from "../components/layout/WhatsAppButton";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />

      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}