import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  Phone,
  MessageCircle,
  ArrowLeft,
  Check,
  Car,
  BookOpen,
} from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import {
  useBusinessSettings,
  telLink,
  whatsappLink,
} from "../../hooks/useBusinessSettings";
import SEO from "../../components/SEO";
import ErrorState from "../../components/ErrorState";
import { breadcrumbJsonLd } from "../../utils/jsonLd";
import { trackEvent } from "../../utils/analytics";
import { formatVehiclePricingLines } from "../../utils/vehiclePricing";
import { getCategoryContent } from "../../config/vehicleCategoryContent";
import api from "../../services/api";

export default function VehicleDetail() {
  const { slug } = useParams();
  const { t } = useContent();
  const { language } = useLanguage();
  const { settings } = useBusinessSettings();
  const [vehicle, setVehicle] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [tariffs, setTariffs] = useState([]);

  const load = () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    api
      .get(`/vehicles/${slug}`)
      .then((res) => {
        const v = res.data?.data;
        setVehicle(v);
        setSelectedImage(0);
        if (v?.name) {
          trackEvent("vehicle_viewed", { vehicle: pick(v.name, language), slug });
        }
        if (v?._id) {
          api
            .get(`/pricing?vehicle=${v._id}`)
            .then((r) => setTariffs(r.data?.data || []))
            .catch(() => setTariffs([]));
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setError("Could not load this vehicle right now.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (loading) {
    return (
      <div
        className="max-w-6xl mx-auto px-4 py-12 sm:py-16 animate-pulse"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-4 w-24 bg-slate-200 rounded-md mb-6" />
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="w-full h-80 bg-slate-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/4 bg-slate-200 rounded-md" />
            <div className="h-16 w-full bg-slate-100 rounded-xl" />
            <div className="h-10 w-1/2 bg-slate-200 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle not found</h1>
        <p className="text-slate-500 font-medium text-sm mt-2">
          This vehicle may have been removed or the link is incorrect.
        </p>
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-2 mt-6 text-brand-red font-bold text-sm hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" /> {t("navigation.cars")}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!vehicle) return null;

  const name = pick(vehicle.name, language);

  const catalogUrl = vehicle?.whatsappCatalogUrl?.trim();
  const activeImageUrl =
    vehicle.images?.[selectedImage]?.url || vehicle.images?.[0]?.url;

  const categoryContent = getCategoryContent(vehicle.category, language);
  const vehicleOwnDescription = pick(vehicle.description, language);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <SEO
        title={pick(vehicle.seoTitle, language) || `${name} — Shivam Travels`}
        description={
          pick(vehicle.seoDescription, language) ||
          vehicleOwnDescription ||
          categoryContent.description ||
          `Rent the ${name} with driver from Shivam Travels in Mayiladuthurai.`
        }
        path={`/vehicles/${vehicle.slug}`}
        image={vehicle.images?.[0]?.url}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Cars", path: "/vehicles" },
          { name, path: `/vehicles/${vehicle.slug}` },
        ])}
      />

      <Link
        to="/vehicles"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red transition duration-150 mb-6"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <span>{t("navigation.cars")}</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-4">
          <div className="w-full h-[320px] sm:h-[420px] bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex items-center justify-center relative">
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={name}
                width={800}
                height={600}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-medium text-xs gap-2"
                role="img"
                aria-label={`No photo available for ${name}`}
              >
                <Car size={48} className="text-slate-300" aria-hidden="true" />
                <span>No Image Available</span>
              </div>
            )}
          </div>

          {vehicle.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {vehicle.images.map((img, idx) => (
                <button
                  key={img.publicId || idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 bg-slate-100 shrink-0 transition duration-150 w-20 h-16 sm:w-24 sm:h-20 ${
                    selectedImage === idx
                      ? "border-brand-red ring-2 ring-brand-red/20 scale-95"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${name} — view ${idx + 1}`}
                    width={96}
                    height={80}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-red-50 text-brand-red px-2.5 py-1 rounded-full border border-red-100">
                {vehicle.category}
              </span>
              <span
                className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                  vehicle.status === "Available"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-slate-100 text-slate-600 border-slate-200/60"
                }`}
              >
                {vehicle.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {categoryContent.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-3 leading-relaxed">
              {categoryContent.description}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t("booking.selectVehicle") || "Vehicle"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {name}
                {vehicle.model ? (
                  <span className="text-slate-500 font-semibold">
                    {" "}
                    · {vehicle.model}
                  </span>
                ) : null}
              </p>
              {vehicleOwnDescription && (
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                  {vehicleOwnDescription}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Capacity
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {vehicle.seatingCapacity} Seats
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Luggage
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {vehicle.luggageCapacity || "Standard"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/60 to-red-100/30 border border-red-100/80 space-y-1">
            {(() => {
              const lines = formatVehiclePricingLines(vehicle.pricingSummary);
              if (lines.length === 0) {
                return (
                  <div className="text-xl sm:text-2xl font-black text-brand-red tracking-tight">
                    Contact for pricing
                  </div>
                );
              }
              return (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {lines.map((line) => (
                    <span
                      key={line}
                      className="text-2xl sm:text-3xl font-black text-brand-red tracking-tight"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              );
            })()}
            <p className="text-xs font-semibold text-slate-600">
              Minimum {vehicle.minimumKmPerDay} km/day · Extra km @ ₹
              {vehicle.extraKmRate}/km
            </p>
          </div>

          {tariffs.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Tariff Details
              </p>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="text-left font-semibold text-slate-500 px-3 py-2">
                        Trip Type
                      </th>
                      <th className="text-left font-semibold text-slate-500 px-3 py-2">
                        Charge
                      </th>
                      <th className="text-right font-semibold text-slate-500 px-3 py-2">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map((tr) => (
                      <tr key={tr._id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {tr.tripType}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {tr.chargeType}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-brand-red">
                          {tr.display || `₹${tr.rate}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(() => {
            const featureList = (pick(vehicle.features, language) || "")
              .split(/[,\n]/)
              .map((f) => f.trim())
              .filter(Boolean);
            if (featureList.length === 0) return null;
            return (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Vehicle Features
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {featureList.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                    >
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href={telLink(settings.phone)}
                className="flex items-center justify-center gap-2 bg-brand-red text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-red-700 active:scale-[0.99] transition duration-150 shadow-sm shadow-brand-red/20"
              >
                <Phone size={18} />
                <span>{t("buttons.callNow")}</span>
              </a>
              <a
                href={whatsappLink(
                  settings.whatsapp,
                  `Hi, I'm interested in booking the ${name}.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-brand-green text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.99] transition duration-150 shadow-sm shadow-brand-green/20"
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>{t("buttons.enquireNow")}</span>
              </a>
            </div>

            {catalogUrl && (
              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-white text-brand-green border-2 border-brand-green px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-50 active:scale-[0.99] transition duration-150"
              >
                <BookOpen size={18} aria-hidden="true" />
                <span>View Catalog</span>
              </a>
            )}

            {vehicle.status === "Available" ? (
              <Link
                to={`/booking?vehicle=${vehicle._id}`}
                className="w-full flex items-center justify-center bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-[0.99] transition duration-150"
              >
                {t("buttons.bookNow")} →
              </Link>
            ) : (
              <div className="w-full text-center bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-sm border border-slate-200">
                Currently Unavailable — call or WhatsApp us to check other
                vehicles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
