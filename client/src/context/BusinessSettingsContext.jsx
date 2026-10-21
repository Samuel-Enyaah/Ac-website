import { useRef, useCallback, useEffect, useState } from "react";

import { getPublicSettings } from "../services/publicSettingsService";

const defaultSettings = {
  businessName: "R&J AC",

  legalName: "R&J AC ACCESSARIES COM. LTD",

  slogan: "Cooling Solutions You Can Rely On.",

  primaryPhone: "",
  secondaryPhone: "",
  whatsapp: "",
  email: "",

  address: "",
  city: "",
  region: "",
  country: "Ghana",

  mapUrl: "",
  logoUrl: "",

  openingHours: {
    monday: "8:00 AM - 5:00 PM",

    tuesday: "8:00 AM - 5:00 PM",

    wednesday: "8:00 AM - 5:00 PM",

    thursday: "8:00 AM - 5:00 PM",

    friday: "8:00 AM - 5:00 PM",

    saturday: "9:00 AM - 3:00 PM",

    sunday: "Closed",
  },

  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    x: "",
  },

  deliveryNote:
    "Delivery arrangements and charges are confirmed before dispatch.",

  serviceCoverage: "Residential and commercial air-conditioning services.",

  bookingNote: "Service requests are reviewed before confirmation.",
};

import { BusinessSettingsContext } from "./BusinessSettingsState";

export function BusinessSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const requestVersion = useRef(0);
  const loadSettings = useCallback(() => {
    const version = ++requestVersion.current;
    return getPublicSettings()
      .then((data) => {
        if (version !== requestVersion.current) return;

        setError("");

        const mergedSettings = {
          ...defaultSettings,
          ...(data || {}),

          openingHours: {
            ...defaultSettings.openingHours,
            ...(data?.openingHours || {}),
          },

          socialLinks: {
            ...defaultSettings.socialLinks,
            ...(data?.socialLinks || {}),
          },
        };

        setSettings(mergedSettings);
      })
      .catch((error) => {
        if (version !== requestVersion.current) return;

        console.error("Unable to load public business settings:", error);

        setError("Unable to load business settings.");
      })
      .finally(() => {
        if (version !== requestVersion.current) return;

        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSettings();
    return () => {
      requestVersion.current += 1;
    };
  }, [loadSettings]);

  return (
    <BusinessSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </BusinessSettingsContext.Provider>
  );
}
