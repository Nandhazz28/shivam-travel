import { createContext, useContext, useEffect, useState, useCallback } from "react";

const LanguageContext = createContext(null);
const STORAGE_KEY = "shivam_travels_lang";

export function getStoredLanguage() {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ta" ? "ta" : "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(STORAGE_KEY) || "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.classList.toggle("font-tamil", language === "ta");
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === "en" || lang === "ta") setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ta" : "en"));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function pick(bilingual, language, fallback = "") {
  if (!bilingual) return fallback;
  return bilingual[language] || bilingual.en || fallback;
}
