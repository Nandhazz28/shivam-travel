import { Link } from "react-router-dom";
import { ShieldCheck, UserCheck, Car, IndianRupee, Phone } from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import SEO from "../../components/SEO";
import { breadcrumbJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80";
const FLEET_IMAGE =
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80";

export default function About() {
  const { t, content } = useContent();
  const { settings } = useBusinessSettings();
  const seoDefaults = getPageSeoDefaults("about", content);

  const features = [
    { icon: <ShieldCheck className="w-6 h-6" />, key: "safe" },
    { icon: <UserCheck className="w-6 h-6" />, key: "drivers" },
    { icon: <Car className="w-6 h-6" />, key: "cars" },
    { icon: <IndianRupee className="w-6 h-6" />, key: "pricing" },
  ];

  const stats = [
    {
      key: "happyCustomers",
      value: settings.stats?.happyCustomers ?? 0,
      suffix: "+",
    },
    {
      key: "successfulTrips",
      value: settings.stats?.successfulTrips ?? 0,
      suffix: "+",
    },
    {
      key: "yearsExperience",
      value: settings.stats?.yearsExperience ?? 0,
      suffix: "+",
    },
    {
      key: "outstationDestinations",
      value: settings.stats?.outstationDestinations ?? 0,
      suffix: "+",
    },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <SEO
        page="about"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/about"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about" },
        ])}
      />

      <section
        className="relative bg-cover bg-center border-b border-slate-100"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.6)), url(${HERO_IMAGE})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-2">
            {t("about.eyebrow")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t("about.title")}{" "}
            <span className="text-brand-red">{t("about.titleHighlight")}</span>
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mt-4 leading-relaxed text-base sm:text-lg">
            {t("about.description")}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12 tracking-tight">
          {t("about.whyChooseTitle")}{" "}
          <span className="text-brand-red">
            {t("about.whyChooseHighlight")}
          </span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((f) => (
            <div
              key={f.key}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center transition duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {t(`about.features.${f.key}.title`)}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                {t(`about.features.${f.key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {stats.length > 0 && (
          <div className="bg-gradient-to-br from-red-50/70 to-red-100/40 border border-red-100/80 rounded-2xl mt-12 divide-y sm:divide-y-0 sm:divide-x divide-red-200/60 grid grid-cols-2 sm:grid-cols-4 shadow-xs">
            {stats.map((s) => (
              <div key={s.key} className="text-center py-6 px-4">
                <div className="text-3xl sm:text-4xl font-black text-brand-red tracking-tight">
                  {s.value}
                  {s.suffix}
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1.5">
                  {t(`about.stats.${s.key}`)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-16 items-center">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs">
            <img
              src={FLEET_IMAGE}
              alt="Row of Shivam Travels vehicles parked near palm trees"
              width={800}
              height={256}
              className="w-full h-72 sm:h-80 object-cover hover:scale-105 transition duration-500"
              loading="lazy"
              style={{ aspectRatio: "800 / 256" }}
            />
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-xl text-slate-900">
                {t("about.mission.title")}
              </h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                {t("about.mission.description")}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-xl text-slate-900">
                {t("about.vision.title")}
              </h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                {t("about.vision.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center shrink-0 shadow-sm shadow-brand-red/30">
              <Phone size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">
                {t("about.ctaTitle")}
              </h4>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {t("about.ctaDescription")}
              </p>
            </div>
          </div>
          <Link
            to="/booking"
            className="w-full sm:w-auto bg-brand-red text-white px-6 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap hover:bg-red-700 active:scale-[0.99] transition duration-150 shadow-sm shadow-brand-red/20 text-center"
          >
            {t("buttons.bookNow")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
