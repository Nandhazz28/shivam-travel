import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { getStoredLanguage } from "./LanguageContext";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: "bg-white border-green-200 text-gray-800 [&_svg]:text-green-600",
  error: "bg-white border-red-200 text-gray-800 [&_svg]:text-red-600",
  info: "bg-white border-blue-200 text-gray-800 [&_svg]:text-blue-600",
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(
    (message, { type = "success", duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const toast = {
    show,
    success: (message, opts) => show(message, { ...opts, type: "success" }),
    error: (message, opts) => show(message, { ...opts, type: "error" }),
    info: (message, opts) => show(message, { ...opts, type: "info" }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto flex items-start gap-2.5 border rounded-lg shadow-lg px-4 py-3 w-full sm:w-80 animate-toast-in ${STYLES[t.type]}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const LOCALIZED_MESSAGES = {
  en: {
    rateLimited: "Too many requests. Please wait a moment and try again.",
    rateLimitedWithSeconds: (s) => `Too many requests. Please try again in ${s} seconds.`,
    network: "Network error. Please check your connection and try again.",
    timeout: "The request took too long. Please try again.",
    generic: "Something went wrong. Please try again.",
  },
  ta: {
    rateLimited:
      "அதிகமான கோரிக்கைகள் அனுப்பப்பட்டுள்ளன. சிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும்.",
    rateLimitedWithSeconds: (s) =>
      `அதிகமான கோரிக்கைகள். தயவுசெய்து ${s} வினாடிகளில் மீண்டும் முயற்சிக்கவும்.`,
    network: "இணைய இணைப்பு பிழை. உங்கள் இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    timeout: "கோரிக்கை அதிக நேரம் எடுத்தது. மீண்டும் முயற்சிக்கவும்.",
    generic: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
  },
};

export function apiErrorMessage(err, fallback) {
  const lang = getStoredLanguage();
  const msgs = LOCALIZED_MESSAGES[lang];

  if (!err?.response) {
    if (err?.code === "ECONNABORTED") return msgs.timeout;
    return msgs.network;
  }

  const { status, data, headers } = err.response;

  if (status === 429) {
    const bodySeconds = Number(data?.retryAfter ?? data?.retryAfterSeconds);
    const headerSeconds = Number(headers?.["retry-after"]);
    const seconds = Number.isFinite(bodySeconds) && bodySeconds > 0
      ? bodySeconds
      : Number.isFinite(headerSeconds) && headerSeconds > 0
        ? headerSeconds
        : undefined;
    return seconds ? msgs.rateLimitedWithSeconds(seconds) : msgs.rateLimited;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback || msgs.generic;
}
