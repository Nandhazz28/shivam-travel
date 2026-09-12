import { useState } from "react";
import { Phone, Mail, MapPin, User, CheckCircle2 } from "lucide-react";
import { useContent } from "../../context/ContentContext";
import {
  useBusinessSettings,
  telLink,
  whatsappLink,
} from "../../hooks/useBusinessSettings";
import {
  FormField,
  TextInput,
  TextArea,
  PrimaryButton,
} from "../../components/FormField";
import SEO from "../../components/SEO";
import { breadcrumbJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import { trackEvent } from "../../utils/analytics";
import api from "../../services/api";
import { apiErrorMessage } from "../../context/ToastContext";

export default function Contact() {
  const { t, content } = useContent();
  const { settings } = useBusinessSettings();
  const seoDefaults = getPageSeoDefaults("contact", content);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    if (status.loading) return;
    setStatus({ loading: true, error: "", success: "" });
    try {
      await api.post("/enquiries", { ...form, source: "website_form" });
      trackEvent("enquiry_submitted", { source: "contact_page" });
      setStatus({
        loading: false,
        error: "",
        success: t("forms.successEnquiry"),
      });
      setForm({ name: "", mobile: "", email: "", message: "" });
    } catch (err) {
      setStatus({
        loading: false,
        error: apiErrorMessage(err, t("forms.errorGeneric")),
        success: "",
      });
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <SEO
        page="contact"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/contact"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <div className="text-center max-w-xl mx-auto mb-12">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
          {t("contact.eyebrow") || "Get In Touch"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("navigation.contact")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
          {t("contact.subtitle") ||
            "Have questions or need to book a custom itinerary? Reach out to us anytime."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">
            Contact Information
          </h2>

          <div className="space-y-4">
            <a
              href={telLink(settings.phone)}
              className="flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition duration-150 group"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-150">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Phone
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {settings.phone}
                </p>
              </div>
            </a>

            <div className="flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {settings.email || "shivamtravels@gmail.com"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Location
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Mayiladuthurai, Tamil Nadu
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.99] transition duration-150 shadow-sm shadow-brand-green/20"
            >
              <WhatsAppIcon size={18} />
              <span>{t("buttons.whatsapp")}</span>
            </a>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Send Us a Message
          </h2>

          <FormField label={t("auth.fullName")}>
            <TextInput
              icon={<User size={16} />}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("booking.fullNamePlaceholder")}
              required
            />
          </FormField>

          <FormField label={t("booking.phoneNumber")}>
            <TextInput
              icon={<Phone size={16} />}
              value={form.mobile}
              onChange={(e) =>
                setForm((f) => ({ ...f, mobile: e.target.value }))
              }
              required
            />
          </FormField>

          <FormField label={t("auth.emailAddress")}>
            <TextInput
              type="email"
              icon={<Mail size={16} />}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder={t("booking.emailPlaceholder")}
            />
          </FormField>

          <FormField label="Message">
            <TextArea
              rows={4}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              placeholder="How can we help you?"
            />
          </FormField>

          {status.error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-700 text-xs font-semibold">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{status.success}</span>
            </div>
          )}

          <PrimaryButton
            type="submit"
            loading={status.loading}
            className="mt-2"
          >
            {t("buttons.submit")}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
