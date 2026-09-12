import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import enDefault from "../content/en.json";
import taDefault from "../content/ta.json";
import { useLanguage } from "./LanguageContext";

const ContentContext = createContext(null);

function deepMerge(base, override) {
  if (typeof base !== "object" || base === null) return override ?? base;
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(override || {})) {
    if (
      typeof override[key] === "object" &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof base[key] === "object"
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function ContentProvider({ children }) {
  const { language } = useLanguage();

  const [dbContent, setDbContent] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/content")
      .then((res) => {
        if (!cancelled) setDbContent(res.data?.data || {});
      })
      .catch(() => {

      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = useMemo(() => {
    const defaults = language === "ta" ? taDefault : enDefault;

    const combined = deepMerge(defaults, resolveLanguageLeaves(dbContent, language));
    return combined;
  }, [language, dbContent]);

  const value = useMemo(
    () => ({
      loaded,
      content: merged,

      t: (path, fallback) => {
        const val = getByPath(merged, path);
        if (typeof val === "string") return val;
        return fallback ?? path;
      },
    }),
    [merged, loaded]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

function resolveLanguageLeaves(node, language) {
  if (node === null || typeof node !== "object") return node;
  if (typeof node.en === "string" || typeof node.ta === "string") {
    return node[language] || node.en || "";
  }
  const out = Array.isArray(node) ? [] : {};
  for (const key of Object.keys(node)) {
    out[key] = resolveLanguageLeaves(node[key], language);
  }
  return out;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
