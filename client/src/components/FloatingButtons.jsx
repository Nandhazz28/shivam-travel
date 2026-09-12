import { Phone, Globe } from "lucide-react";
import {
  useBusinessSettings,
  telLink,
  whatsappLink,
} from "../hooks/useBusinessSettings";
import { useLanguage } from "../context/LanguageContext";
import { trackEvent } from "../utils/analytics";

function WhatsAppIcon({ size = 22 }) {
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

export default function FloatingButtons() {
  const { settings } = useBusinessSettings();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      <a
        href={whatsappLink(settings.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { source: "floating_button" })}
        className="group relative pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/30 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        aria-label="Contact via WhatsApp"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366]" />
        </span>
        <WhatsAppIcon size={22} />

        <span className="absolute right-14 px-3 py-1.5 rounded-xl bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md">
          Chat on WhatsApp
        </span>
      </a>

      <a
        href={telLink(settings.phone)}
        onClick={() => trackEvent("phone_click", { source: "floating_button" })}
        className="group relative pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        aria-label="Call Us Now"
      >
        <Phone size={22} className="fill-current text-white stroke-[1.5]" />

        <span className="absolute right-14 px-3 py-1.5 rounded-xl bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md">
          Call Now
        </span>
      </a>

      <button
        type="button"
        onClick={toggleLanguage}
        className="group relative pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-200 shadow-lg hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        aria-label={`Switch language, currently ${language === "en" ? "English" : "Tamil"}`}
      >
        <Globe size={20} aria-hidden="true" />

        <span className="absolute right-14 px-3 py-1.5 rounded-xl bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md">
          {language === "en" ? "தமிழில் காண்க" : "View in English"}
        </span>
      </button>
    </div>
  );
}
