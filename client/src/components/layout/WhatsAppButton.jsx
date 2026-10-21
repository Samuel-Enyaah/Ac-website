import { MessageCircle } from "lucide-react";

import { useBusinessSettings } from "../../context/BusinessSettingsState";

import { whatsappHref } from "../../utils/businessLinks";

export default function WhatsAppButton() {
  const { settings } = useBusinessSettings();

  if (!settings.whatsapp) {
    return null;
  }

  const href = whatsappHref(settings.whatsapp);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with R&J AC on WhatsApp"
      className="fixed bottom-5 right-5 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700 md:flex"
    >
      <MessageCircle size={27} />
    </a>
  );
}
