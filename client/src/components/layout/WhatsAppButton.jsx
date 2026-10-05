import {
  MessageCircle,
} from "lucide-react";

import {
  useBusinessSettings,
} from "../../context/BusinessSettingsContext";

import {
  whatsappHref,
} from "../../utils/businessLinks";

export default function WhatsAppButton() {
  const {
    settings,
  } = useBusinessSettings();

  if (!settings.whatsapp) {
    return null;
  }

  const href =
    whatsappHref(
      settings.whatsapp
    );

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with R&J AC on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-105 hover:bg-green-600"
    >
      <MessageCircle
        size={27}
      />
    </a>
  );
}