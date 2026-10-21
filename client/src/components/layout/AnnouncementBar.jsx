import { useBusinessSettings } from "../../context/BusinessSettingsState";
import { phoneHref, whatsappHref } from "../../utils/businessLinks";
import { Container } from "../ui/Storefront";
export default function AnnouncementBar() {
  const { settings } = useBusinessSettings();
  return (
    <div className="bg-[#0B1F33] text-white">
      <Container className="flex min-h-9 flex-wrap items-center justify-between gap-x-6 py-1 text-xs">
        <p>Products, parts & technical service</p>
        <div className="flex gap-5">
          {settings.primaryPhone && (
            <a
              className="inline-flex min-h-9 items-center"
              href={phoneHref(settings.primaryPhone)}
            >
              {settings.primaryPhone}
            </a>
          )}
          {settings.whatsapp && (
            <a
              className="hidden min-h-9 items-center sm:inline-flex"
              href={whatsappHref(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp assistance
            </a>
          )}
        </div>
      </Container>
    </div>
  );
}
