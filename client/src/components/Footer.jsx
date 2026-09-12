import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { useLanguage } from "../context/LanguageContext";
import { useBusinessSettings, telLink } from "../hooks/useBusinessSettings";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useContent();
  const { language, setLanguage } = useLanguage();
  const { settings } = useBusinessSettings();

  const quickLinks = [
    { to: "/", label: t("navigation.home") },
    { to: "/services", label: t("navigation.services") },
    { to: "/vehicles", label: t("navigation.cars") },
    { to: "/about", label: t("navigation.about") },
    { to: "/faq", label: t("navigation.faq") },
    { to: "/contact", label: t("navigation.contact") },
  ];

  return (
    <footer className="bg-white text-black mt-auto border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        <div className="space-y-4">
          <div className="inline-block p-1 rounded-xl">
            <Logo className="h-11" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
            {t("footer.description")}
          </p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="text-black font-bold mb-4 tracking-wide uppercase text-xs">
            {t("footer.quickLinks")}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-gray-700 hover:text-red-600 transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded inline-block font-medium"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <div>
            <h2 className="text-black font-bold mb-4 tracking-wide uppercase text-xs">
              {t("footer.contactUs")}
            </h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={telLink(settings.phone)}
                  className="flex items-center gap-2.5 text-gray-700 hover:text-red-600 transition duration-150 group font-medium"
                >
                  <Phone
                    size={15}
                    className="text-red-600 group-hover:scale-110 transition-transform"
                    aria-hidden="true"
                  />
                  <span>{settings.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.email || "shivamtravels@gmail.com"}`}
                  className="flex items-center gap-2.5 text-gray-700 hover:text-red-600 transition duration-150 group font-medium"
                >
                  <Mail
                    size={15}
                    className="text-red-600 group-hover:scale-110 transition-transform"
                    aria-hidden="true"
                  />
                  <span>{settings.email || "shivamtravels@gmail.com"}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-gray-700 font-medium">
                <MapPin
                  size={15}
                  className="text-red-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>Mayiladuthurai, Tamil Nadu</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-black font-bold mb-3 tracking-wide uppercase text-xs">
              {t("footer.followUs")}
            </h2>
            <div className="flex items-center gap-2.5">
              {settings.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shivam Travels on Facebook (opens in a new tab)"
                  className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 hover:border-blue-500 hover:bg-blue-600 flex items-center justify-center text-gray-700 hover:text-white text-xs font-bold transition duration-200 shadow-sm"
                >
                  f
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shivam Travels on Instagram (opens in a new tab)"
                  className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 hover:border-pink-500 hover:bg-pink-600 flex items-center justify-center text-gray-700 hover:text-white text-xs font-bold transition duration-200 shadow-sm"
                >
                  ig
                </a>
              )}
              {settings.socialLinks?.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shivam Travels on YouTube (opens in a new tab)"
                  className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 hover:border-red-500 hover:bg-red-600 flex items-center justify-center text-gray-700 hover:text-white text-xs font-bold transition duration-200 shadow-sm"
                >
                  ▶
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a
                  href={settings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shivam Travels on Twitter / X (opens in a new tab)"
                  className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 hover:border-black hover:bg-black flex items-center justify-center text-gray-700 hover:text-white text-xs font-bold transition duration-200 shadow-sm"
                >
                  X
                </a>
              )}
              {!settings.socialLinks?.facebook &&
                !settings.socialLinks?.instagram &&
                !settings.socialLinks?.youtube &&
                !settings.socialLinks?.twitter && (
                  <p className="text-xs text-gray-500 italic">
                    Social links coming soon.
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-6 px-4 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
        <span>{t("footer.copyright")}</span>
        <div
          className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-xl"
          role="group"
          aria-label="Language selector"
        >
          <button
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`px-3 py-1.5 rounded-lg font-medium transition duration-150 ${
              language === "en"
                ? "bg-white text-red-600 shadow-sm font-semibold border border-gray-200"
                : "text-gray-600 hover:text-red-600"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("ta")}
            aria-pressed={language === "ta"}
            className={`px-3 py-1.5 rounded-lg font-medium transition duration-150 ${
              language === "ta"
                ? "bg-white text-red-600 shadow-sm font-semibold border border-gray-200"
                : "text-gray-600 hover:text-red-600"
            }`}
          >
            Tamil
          </button>
        </div>
      </div>
    </footer>
  );
}
