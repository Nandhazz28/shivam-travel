import { useCallback, useEffect, useState } from "react";
import {
  Car,
  Plane,
  Landmark,
  Briefcase,
  Calendar,
  Users,
  ShieldCheck,
  Tag,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import { useBusinessSettings, telLink } from "../../hooks/useBusinessSettings";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Reveal from "../../components/Reveal";
import { SkeletonCard } from "../../components/Skeleton";
import { breadcrumbJsonLd, serviceJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import api from "../../services/api";

const ICONS = {
  car: Car,
  plane: Plane,
  landmark: Landmark,
  briefcase: Briefcase,
  calendar: Calendar,
  users: Users,
  shield: ShieldCheck,
};

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Services() {
  const { t, content } = useContent();
  const { language } = useLanguage();
  const { settings } = useBusinessSettings();
  const seoDefaults = getPageSeoDefaults("services", content);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .get("/services")
      .then((res) => setServices(res.data?.data || []))
      .catch(() => setError("Could not load our services right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (services.length === 0) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [services]);

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <SEO
        page="services"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/services"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          ...services.map((s) => serviceJsonLd(s, language)),
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-brand-red/10 text-brand-red mb-3">
            What We Offer
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t("home.services.title")}
          </h1>
          <div className="w-16 h-1 bg-brand-red rounded-full mx-auto mt-3" />
          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            Reliable, safe, and tailored transportation options designed to suit
            every journey from outstation trips to local city rides.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No services published yet"
            message="Check back soon, or call us to ask what we offer."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((s, idx) => {
              const Icon = ICONS[s.icon] || Car;
              const serviceSlug = slugify(s.name?.en);

              return (
                <Reveal
                  key={s._id}
                  as="div"
                  id={serviceSlug}
                  stagger={idx % 6}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-brand-red/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between scroll-mt-28 group"
                >
                  <div>
                    {s.image?.url ? (
                      <div className="relative w-full h-44 mb-5 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={s.image.url}
                          alt={pick(s.name, language)}
                          width={400}
                          height={176}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl text-brand-red flex items-center justify-center shadow-md border border-slate-100">
                          <Icon size={20} aria-hidden="true" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-5 group-hover:bg-brand-red group-hover:text-white transition-colors duration-200"
                        aria-hidden="true"
                      >
                        <Icon size={28} />
                      </div>
                    )}

                    <h2 className="font-bold text-xl text-slate-900 group-hover:text-brand-red transition-colors leading-snug">
                      {pick(s.name, language)}
                    </h2>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                      {pick(s.description, language)}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {s.priceLabel ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Tag className="w-3.5 h-3.5 text-brand-red" /> Pricing
                          starts at
                        </span>
                        <span className="font-bold text-sm text-brand-red">
                          {s.priceLabel}
                        </span>
                      </>
                    ) : (
                      <a
                        href={telLink(settings.phone)}
                        className="w-full inline-flex items-center justify-between text-xs font-semibold text-brand-red hover:text-red-700 transition"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Enquire / Book
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
