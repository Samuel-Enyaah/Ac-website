import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="#"
      aria-label="Chat with R&J AC on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1687D9] text-white shadow-xl transition hover:scale-105 hover:bg-[#1176BF]"
    >
      <MessageCircle size={27} />
    </a>
  );
}