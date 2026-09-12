import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const SEOSettingsContext = createContext(null);

export function SEOSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/seo/settings")
      .then((res) => {
        if (!cancelled && res.data?.data) setSettings(res.data.data);
      })
      .catch(() => {

      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SEOSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SEOSettingsContext.Provider>
  );
}

export function useSEOSettings() {
  const ctx = useContext(SEOSettingsContext);
  if (!ctx) throw new Error("useSEOSettings must be used within SEOSettingsProvider");
  return ctx;
}
