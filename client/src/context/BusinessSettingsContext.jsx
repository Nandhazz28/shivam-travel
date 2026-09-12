import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const BusinessSettingsContext = createContext(null);

const DEFAULTS = {
  businessName: "Shivam Travels",
  phone: "+91 12345 67890",
  whatsapp: "911234567890",
  logo: { url: "" },
  socialLinks: {},
};

export function BusinessSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/business")
      .then((res) => {
        if (!cancelled && res.data?.data) setSettings({ ...DEFAULTS, ...res.data.data });
      })
      .catch(() => {

      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BusinessSettingsContext.Provider value={{ settings, loading }}>{children}</BusinessSettingsContext.Provider>
  );
}

export function useBusinessSettingsContext() {
  const ctx = useContext(BusinessSettingsContext);
  if (!ctx) throw new Error("useBusinessSettingsContext must be used within BusinessSettingsProvider");
  return ctx;
}
