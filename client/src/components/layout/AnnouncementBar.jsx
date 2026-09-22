import { Phone } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#0B1F33] text-white">
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <p className="font-medium">
          Professional AC Sales, Installation, Repairs & Maintenance
        </p>

        <div className="hidden items-center gap-2 text-white/70 md:flex">
          <Phone size={13} />
          <span>Reliable Cooling Solutions</span>
        </div>
      </div>
    </div>
  );
}