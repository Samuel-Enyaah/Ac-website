import { useEffect } from "react";
import { useBusinessSettings } from "../context/BusinessSettingsState";
export default function usePageMeta(title, description) {
  const { settings } = useBusinessSettings();
  useEffect(() => {
    document.title = `${title} | ${settings.businessName}`;
    const update = (selector, attr, key, content) => {
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.append(tag);
      }
      tag.content = content;
    };
    update('meta[name="description"]', "name", "description", description);
    update('meta[property="og:title"]', "property", "og:title", document.title);
    update(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    update('meta[property="og:type"]', "property", "og:type", "website");
  }, [title, description, settings.businessName]);
}
