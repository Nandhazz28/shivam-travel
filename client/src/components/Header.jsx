import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Phone, Globe, Menu, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../context/ContentContext";
import {
  useBusinessSettings,
  telLink,
  whatsappLink,
} from "../hooks/useBusinessSettings";
import Logo from "./Logo";

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

export default function Header() {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useContent();
  const { settings } = useBusinessSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t("navigation.home") },
    { to: "/services", label: t("navigation.services") },
    { to: "/vehicles", label: t("navigation.cars") },
    { to: "/booking", label: t("navigation.booking") },
    { to: "/about", label: t("navigation.about") },
    { to: "/contact", label: t("navigation.contact") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white text-gray-900 shadow-sm border-b border-gray-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-red-600 focus:text-white focus:px-3 focus:py-2 focus:rounded-lg focus:shadow-md font-semibold text-xs"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="shrink-0 flex items-center transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 rounded-lg"
          aria-label="Shivam Travels — go to homepage"
        >
          <Logo className="h-12" />
        </Link>

        <nav
          className="hidden lg:flex items-center gap-6"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-semibold border-b-2 py-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 rounded-xs ${
                  isActive
                    ? "text-red-600 border-red-600"
                    : "text-gray-700 border-transparent hover:text-red-600 hover:border-red-600/40"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telLink(settings.phone)}
            className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all h-10 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            aria-label={`${t("buttons.callNow")}: ${settings.phone}`}
          >
            <Phone size={16} aria-hidden="true" />
            <span>{t("buttons.callNow")}</span>
          </a>

          <a
            href={whatsappLink(settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all h-10 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            aria-label={`${t("buttons.whatsapp")} — opens in a new tab`}
          >
            <WhatsAppIcon size={18} />
            <span>{t("buttons.whatsapp")}</span>
          </a>

          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden sm:flex items-center justify-center gap-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 px-3 py-2 rounded-xl text-sm font-semibold text-gray-800 transition-all h-10 min-w-[112px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 cursor-pointer"
            aria-label={`Switch language, currently ${language === "en" ? "Tamil" : "English"}`}
          >
            <Globe
              size={16}
              className="text-red-600 shrink-0"
              aria-hidden="true"
            />
            <span>{language === "en" ? "தமிழ்" : "English"}</span>
          </button>

          <button
            type="button"
            className="lg:hidden p-2 text-gray-800 hover:text-red-600 transition rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-3 shadow-md"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm font-medium py-1.5 px-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-red-600 font-bold bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <a
              href={telLink(settings.phone)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-semibold h-10 shadow-sm"
            >
              <Phone size={16} aria-hidden="true" />
              <span>{t("buttons.callNow")}</span>
            </a>
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-xl text-sm font-semibold h-10 shadow-sm"
            >
              <WhatsAppIcon size={18} />
              <span>{t("buttons.whatsapp")}</span>
            </a>
          </div>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-800 self-start h-10 min-w-[112px] justify-center mt-1 cursor-pointer"
          >
            <Globe
              size={16}
              className="text-red-600 shrink-0"
              aria-hidden="true"
            />
            <span>{language === "en" ? "தமிழ்" : "English"}</span>
          </button>
        </div>
      )}
    </header>
  );
}
