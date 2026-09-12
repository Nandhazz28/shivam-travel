import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users, Briefcase, Car, ArrowRight } from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Reveal from "../../components/Reveal";
import { SkeletonCard } from "../../components/Skeleton";
import { Select } from "../../components/FormField";
import VEHICLE_CATEGORY_CONTENT from "../../config/vehicleCategoryContent";
import { breadcrumbJsonLd, vehicleListJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import { formatVehiclePricingLines } from "../../utils/vehiclePricing";
import api from "../../services/api";

const VEHICLE_CATEGORIES = Object.keys(VEHICLE_CATEGORY_CONTENT);

export default function Vehicles() {
  const { t, content } = useContent();
  const seoDefaults = getPageSeoDefaults("vehicles", content);
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter = searchParams.get("category") || "";

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .get("/vehicles")
      .then((res) => setVehicles(res.data?.data || []))
      .catch(() => setError("Could not load our fleet right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredVehicles = useMemo(() => {
    if (!categoryFilter) return vehicles;
    return vehicles.filter((v) => v.category === categoryFilter);
  }, [vehicles, categoryFilter]);

  const changeCategory = (value) => {
    if (value) {
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
      <SEO
        page="vehicles"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/vehicles"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cars", path: "/vehicles" },
          ]),
          vehicleListJsonLd(vehicles, language),
        ]}
      />

      <div className="text-center max-w-xl mx-auto mb-12">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
          {t("vehicles.eyebrow") || "Our Premium Fleet"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("navigation.cars")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
          {t("vehicles.subtitle") ||
            "Choose from our clean, comfortable, and well-maintained vehicles for a safe journey."}
        </p>
      </div>

      {!loading && !error && vehicles.length > 0 && (
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-xs">
            <Select
              value={categoryFilter}
              onChange={(e) => changeCategory(e.target.value)}
              aria-label="Filter cars by category"
            >
              <option value="">All Categories</option>
              {VEHICLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : error ? (
        <div className="max-w-3xl mx-auto py-12">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Car}
            title="No vehicles published yet"
            message="Check back soon, or call us to ask about availability."
          />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Car}
            title={`No ${categoryFilter} vehicles right now`}
            message="Try another category, or check back soon."
            action={
              <button
                type="button"
                onClick={() => changeCategory("")}
                className="text-sm font-semibold text-brand-red hover:underline"
              >
                Clear filter
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVehicles.map((v, idx) => (
            <Reveal
              as={Link}
              to={`/vehicles/${v.slug}`}
              key={v._id}
              stagger={idx % 6}
              className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"
            >
              <div>
                <div className="w-full h-52 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                  {v.images?.[0]?.url ? (
                    <img
                      src={v.images[0].url}
                      alt={pick(v.name, language)}
                      width={400}
                      height={208}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-slate-300">
                      <Car size={48} aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-red transition duration-150">
                        {pick(v.name, language)}
                      </h3>
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-red-50 text-brand-red px-2.5 py-0.5 rounded-full border border-red-100 mt-1">
                        {v.category}
                      </span>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const lines = formatVehiclePricingLines(v.pricingSummary);
                        if (lines.length === 0) {
                          return (
                            <span className="text-brand-red font-bold text-sm block tracking-tight">
                              Contact for pricing
                            </span>
                          );
                        }
                        return lines.map((line) => (
                          <span
                            key={line}
                            className="text-brand-red font-black text-lg block tracking-tight leading-tight"
                          >
                            {line}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Users
                        size={15}
                        className="text-slate-400"
                        aria-hidden="true"
                      />
                      {v.seatingCapacity} Seats
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase
                        size={15}
                        className="text-slate-400"
                        aria-hidden="true"
                      />
                      {v.luggageCapacity || "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex items-center justify-between pt-3 border-t border-slate-100">
                <span
                  className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    v.status === "Available"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-slate-100 text-slate-600 border border-slate-200/60"
                  }`}
                >
                  {v.status}
                </span>

                <span className="text-xs font-bold text-slate-900 group-hover:text-brand-red flex items-center gap-1 transition duration-150">
                  View Details{" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition duration-150"
                  />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
