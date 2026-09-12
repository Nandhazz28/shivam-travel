import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  CheckCircle2,
  XCircle,
  Phone,
  Plane,
  Landmark,
  Briefcase,
  Calendar,
  Users,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import {
  useBusinessSettings,
  telLink,
  whatsappLink,
} from "../../hooks/useBusinessSettings";
import SEO from "../../components/SEO";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Reveal from "../../components/Reveal";
import { SkeletonCard } from "../../components/Skeleton";
import {
  organizationJsonLd,
  websiteJsonLd,
  vehicleListJsonLd,
} from "../../utils/jsonLd";
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

const COLOR_STYLES = {
  blue: {
    badgeBg: "bg-blue-50 text-blue-600 border-blue-100",
    borderHover: "hover:border-blue-200",
  },
  green: {
    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    borderHover: "hover:border-emerald-200",
  },
  amber: {
    badgeBg: "bg-amber-50 text-amber-600 border-amber-100",
    borderHover: "hover:border-amber-200",
  },
  red: {
    badgeBg: "bg-rose-50 text-rose-600 border-rose-100",
    borderHover: "hover:border-rose-200",
  },
};

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80";

export default function Home() {
  const { t, content } = useContent();
  const { language } = useLanguage();
  const { settings } = useBusinessSettings();
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return Promise.all([api.get("/vehicles"), api.get("/services")])
      .then(([vRes, sRes]) => {
        setVehicles(vRes.data?.data || []);
        setServices(sRes.data?.data || []);
      })
      .catch(() =>
        setError("Could not load the latest fleet and service info."),
      )
      .finally(() => setLoading(false));
  }, []);

  const loadCatalog = useCallback(() => {
    setCatalogLoading(true);
    setCatalogError("");
    return api
      .get("/catalog")
      .then((res) => setCatalogCategories(res.data?.data || []))
      .catch(() =>
        setCatalogError("Could not load our car categories right now."),
      )
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    load();
    loadCatalog();
  }, [load, loadCatalog]);

  const availableCount = vehicles.filter(
    (v) => v.status === "Available",
  ).length;
  const notAvailableCount = vehicles.length - availableCount;
  const heroImage = settings.heroImages?.[0]?.url || FALLBACK_HERO_IMAGE;
  const carNames = vehicles.map((v) => pick(v.name, language)).join(", ");
  const seoDefaults = getPageSeoDefaults("home", content);

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        page="home"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/"
        jsonLd={[
          organizationJsonLd(settings),
          websiteJsonLd(),
          vehicleListJsonLd(vehicles, language),
        ]}
      />

      <section className="relative overflow-hidden bg-slate-900 min-h-[580px] lg:min-h-[640px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Shivam Travels Hero Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-brand-red/20 text-red-400 border border-brand-red/30 backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t("home.hero.eyebrow")}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-[1.1]">
              SHIVAM{" "}
              <span className="text-brand-red drop-shadow-md">TRAVELS</span>
            </h1>
            <p className="text-lg sm:text-2xl font-semibold text-slate-100 mt-4 border-l-4 border-brand-red pl-4 py-1 leading-snug">
              {t("home.hero.subtitle")}
            </p>
            <p className="text-slate-300 mt-4 text-base sm:text-lg max-w-xl leading-relaxed">
              {t("home.hero.description")}
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href={telLink(settings.phone)}
                className="flex items-center justify-center gap-2.5 bg-brand-red hover:bg-red-700 text-white font-semibold px-6 py-3.5 rounded-xl transition duration-200 shadow-lg shadow-brand-red/25 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Phone className="w-5 h-5" />
                <span>{t("buttons.callNow")}</span>
              </a>
              <a
                href={whatsappLink(settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-xl transition duration-200 shadow-lg shadow-green-500/25 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
                </svg>
                <span>{t("buttons.whatsapp")}</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          <Reveal stagger={0}>
            <StatCard
              color="blue"
              icon={<Car className="w-5 h-5" />}
              value={vehicles.length}
              label={t("home.stats.totalCars")}
              sub={t("home.stats.carsAvailableLabel")}
            />
          </Reveal>
          <Reveal stagger={1}>
            <StatCard
              color="green"
              icon={<CheckCircle2 className="w-5 h-5" />}
              value={carNames || "—"}
              label={t("home.stats.carModels")}
              sub={carNames ? `${vehicles.length} Models Available` : ""}
              isTextValue
            />
          </Reveal>
          <Reveal stagger={2}>
            <StatCard
              color="amber"
              icon={<CheckCircle2 className="w-5 h-5" />}
              value={availableCount}
              label={t("home.stats.availableNow")}
              sub={t("home.stats.carAvailableLabel")}
            />
          </Reveal>
          <Reveal stagger={3}>
            <StatCard
              color="red"
              icon={<XCircle className="w-5 h-5" />}
              value={notAvailableCount}
              label={t("home.stats.notAvailable")}
              sub={t("home.stats.carNotAvailableLabel")}
            />
          </Reveal>
        </div>
      </section>

      <section id="catalog" data-scroll-section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <Reveal as="div" className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t("home.catalog.title", "Explore Our Car Categories")}
          </h2>
          <p className="text-sm text-slate-500 mt-3">
            {t(
              "home.catalog.subtitle",
              "Pick a category to see matching cars, pricing and availability.",
            )}
          </p>
          <div className="w-16 h-1 bg-brand-red rounded-full mx-auto mt-3" />
        </Reveal>

        {catalogLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        ) : catalogError ? (
          <ErrorState message={catalogError} onRetry={loadCatalog} />
        ) : catalogCategories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title={t("home.catalog.emptyTitle", "Categories are being updated")}
            message={t(
              "home.catalog.emptyMessage",
              "Our vehicle categories are being updated. Please check back soon.",
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalogCategories.map((c, idx) => (
              <Reveal key={c._id} stagger={idx % 4}
                className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden">
                    {c.image?.url ? (
                      <img
                        src={c.image.url}
                        alt={pick(c.title, language) || c.category}
                        width={400}
                        height={220}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Car size={48} aria-hidden="true" />
                      </div>
                    )}

                    <span className="absolute top-3 left-3 text-xs font-semibold bg-slate-900/80 text-white px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                      {c.category}
                    </span>

                    {c.isAvailable ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600/90 text-white px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                        <CheckCircle2 size={13} aria-hidden="true" />
                        {t("home.catalog.available", "Available")}
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold bg-rose-600/90 text-white px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                        <XCircle size={13} aria-hidden="true" />
                        {t("home.catalog.notAvailable", "Not Available")}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {pick(c.title, language) || c.category}
                    </h3>
                    {(c.description?.en || c.description?.ta) && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3">
                        {pick(c.description, language)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Link
                    to={
                      c.catalogUrl ||
                      `/vehicles?category=${encodeURIComponent(c.category)}`
                    }
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 group-hover:bg-brand-red text-white font-semibold text-sm px-5 py-3 rounded-xl transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"
                  >
                    {t("home.catalog.cta", "View Car Catalog")}
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="services" data-scroll-section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Reveal as="div" className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t("home.services.title")}
          </h2>
          <div className="w-16 h-1 bg-brand-red rounded-full mx-auto mt-3" />
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
        ) : error ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {services.map((s, idx) => {
              const Icon = ICONS[s.icon] || Car;

              return (
                <Reveal
                  key={s._id}
                  stagger={idx % 6}
                  className="group bg-white border border-slate-200/80 hover:border-brand-red/30 rounded-2xl p-6 text-center shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between focus-visible:outline-2 focus-visible:outline-brand-red"
                >
                  <div className="w-full flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-brand-red group-hover:text-white text-slate-700 transition-all duration-300 flex items-center justify-center mb-4 shadow-inner">
                      <Icon size={26} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-red transition-colors line-clamp-1">
                      {pick(s.name, language)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {pick(s.description, language)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
            {services.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Briefcase}
                  title="No services published yet"
                  message="Check back soon, or call us to ask what we offer."
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section id="about" data-scroll-section className="bg-slate-900 border-t border-slate-800 py-6 text-center">
        <Reveal as="div" className="max-w-7xl mx-auto px-4">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-slate-200 hover:text-white font-semibold transition text-sm sm:text-base group"
          >
            <span>{t("navigation.about")}</span>
            <ChevronRight className="w-4 h-4 text-brand-red group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

function StatCard({
  color = "blue",
  icon,
  value,
  label,
  sub,
  isTextValue = false,
}) {
  const theme = COLOR_STYLES[color] || COLOR_STYLES.blue;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md ${theme.borderHover} hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
            {label}
          </span>
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${theme.badgeBg}`}
          >
            {icon}
          </div>
        </div>

        {isTextValue ? (
          <p
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2"
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </p>
        ) : (
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {value}
          </p>
        )}
      </div>

      {sub && (
        <p className="text-[11px] font-medium text-slate-500 mt-2 truncate">
          {sub}
        </p>
      )}
    </div>
  );
}
