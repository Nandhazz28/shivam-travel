import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Briefcase,
  Phone,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Car,
  Repeat,
  ArrowRight,
} from "lucide-react";
import { useContent } from "../../context/ContentContext";
import { useLanguage, pick } from "../../context/LanguageContext";
import {
  FormField,
  TextInput,
  TextArea,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import SEO from "../../components/SEO";
import TimeInput12h from "../../components/TimeInput12h";
import ErrorState from "../../components/ErrorState";
import { breadcrumbJsonLd } from "../../utils/jsonLd";
import { getPageSeoDefaults } from "../../utils/seoDefaults";
import { trackEvent } from "../../utils/analytics";
import { formatVehiclePricingCompact } from "../../utils/vehiclePricing";
import api from "../../services/api";
import { apiErrorMessage } from "../../context/ToastContext";

function todayDateInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Booking() {
  const { t, content } = useContent();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesError, setVehiclesError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const today = useMemo(() => todayDateInputValue(), []);

  const [form, setForm] = useState({
    tripType: "Outstation",
    bookingType: "One Way",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "18:00",
    pickupLocation: "",
    dropLocation: "",
    passengers: 1,
    luggage: "",
    mobile: "",
    name: "",
    email: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const loadVehicles = () => {
    setVehiclesError("");
    api
      .get("/vehicles")
      .then((res) => {
        const list = res.data?.data || [];
        setVehicles(list);

        const requestedId = searchParams.get("vehicle");
        const requested =
          requestedId && list.find((v) => v._id === requestedId);
        if (requested && requested.status === "Available") {
          setSelectedVehicle(requested._id);
          return;
        }

        const firstAvailable = list.find((v) => v.status === "Available");
        if (firstAvailable) setSelectedVehicle(firstAvailable._id);
      })
      .catch(() =>
        setVehiclesError(
          "Could not load our available cars right now. Please refresh, or call us to book directly.",
        ),
      );
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const chosen = vehicles.find((v) => v._id === selectedVehicle);

  useEffect(() => {
    if (!selectedVehicle) {
      setQuote(null);
      return undefined;
    }
    setQuoteLoading(true);
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ vehicle: selectedVehicle });
      if (form.tripType) params.set("tripType", form.tripType);
      api
        .get(`/bookings/quote?${params.toString()}`)
        .then((res) => setQuote(res.data?.data || null))
        .catch(() => setQuote(null))
        .finally(() => setQuoteLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [selectedVehicle, form.tripType]);

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setBookingType = (type) => {
    setForm((f) => ({ ...f, bookingType: type }));
    setFieldErrors((prev) => ({ ...prev, returnDate: undefined, returnTime: undefined }));
  };

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = t("forms.requiredField");
    if (!form.mobile.trim()) errors.mobile = t("forms.requiredField");
    else if (!/^(\+?91[\-\s]?)?[6-9]\d{9}$/.test(form.mobile.trim())) {
      errors.mobile = t("forms.invalidMobile");
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t("forms.invalidEmail");
    }
    if (!form.pickupDate) {
      errors.pickupDate = t("forms.requiredField");
    } else if (form.pickupDate < today) {
      errors.pickupDate = t("forms.invalidPickupDate", "Pickup date cannot be in the past.");
    }

    if (form.bookingType === "Round Trip") {
      if (!form.returnDate) {
        errors.returnDate = t("forms.requiredField");
      } else if (form.pickupDate && form.returnDate < form.pickupDate) {
        errors.returnDate = t("forms.invalidReturnDate", "Return date must be on or after the pickup date.");
      } else if (
        form.pickupDate &&
        form.returnDate === form.pickupDate &&
        form.returnTime <= form.pickupTime
      ) {
        errors.returnTime = t(
          "forms.invalidReturnTime",
          "Return time must be after the pickup time on the same day.",
        );
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (status.loading) return;

    if (!validate()) {
      setStatus({ loading: false, error: t("forms.requiredField"), success: "" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await api.post("/bookings/public", {
        customerName: form.name,
        customerPhone: form.mobile,
        customerEmail: form.email,
        tripType: form.tripType,
        bookingType: form.bookingType,
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        pickupDate: form.pickupDate,
        pickupTime: form.pickupTime,
        returnDate: form.bookingType === "Round Trip" ? form.returnDate : undefined,
        returnTime: form.bookingType === "Round Trip" ? form.returnTime : undefined,
        passengers: Number(form.passengers) || 1,
        luggage: form.luggage,
        vehicle: selectedVehicle || undefined,
        specialNotes: form.message,
      });

      trackEvent("booking_submitted", { bookingType: form.bookingType });
      setStatus({
        loading: false,
        error: "",
        success: res.data?.message || t("booking.successBooking"),
      });
      setForm((f) => ({
        ...f,
        pickupLocation: "",
        dropLocation: "",
        name: "",
        mobile: "",
        email: "",
        message: "",
      }));
      setFieldErrors({});
    } catch (err) {
      setStatus({
        loading: false,
        error: apiErrorMessage(err, t("forms.errorGeneric")),
        success: "",
      });
    }
  };

  const isRoundTrip = form.bookingType === "Round Trip";
  const displayTotal = quote?.totalAmount ?? 0;
  const seoDefaults = getPageSeoDefaults("booking", content);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <SEO
        page="booking"
        title={seoDefaults.title}
        description={seoDefaults.description}
        path="/booking"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Booking", path: "/booking" },
        ])}
      />

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
          {t("home.hero.eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("booking.title").split(" ").slice(0, -1).join(" ")}{" "}
          <span className="text-brand-red">
            {t("booking.title").split(" ").slice(-1)}
          </span>
        </h1>
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 text-xs sm:text-sm font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-brand-red" />{" "}
            {t("booking.featureSafe")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} className="text-brand-red" />{" "}
            {t("booking.featureOnTime")}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={16} className="text-brand-red" />{" "}
            {t("booking.featureDrivers")}
          </span>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("booking.sectionTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {t("booking.sectionSubtitle")}
            </p>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              {t("booking.bookingType")}
            </span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setBookingType("One Way")}
                aria-pressed={!isRoundTrip}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  !isRoundTrip
                    ? "bg-brand-red text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowRight size={14} aria-hidden="true" />
                {t("booking.oneWay")}
              </button>
              <button
                type="button"
                onClick={() => setBookingType("Round Trip")}
                aria-pressed={isRoundTrip}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  isRoundTrip
                    ? "bg-brand-red text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Repeat size={14} aria-hidden="true" />
                {t("booking.roundTrip")}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <FormField label={t("booking.tripType")}>
              <Select value={form.tripType} onChange={update("tripType")}>
                <option>Outstation</option>
                <option>Local</option>
                <option>Airport</option>
                <option>One Day Tour</option>
                <option>Corporate</option>
                <option>Family Trip</option>
              </Select>
            </FormField>
            <FormField label={t("booking.pickupDate")} error={fieldErrors.pickupDate}>
              <TextInput
                type="date"
                icon={<Calendar size={16} />}
                value={form.pickupDate}
                min={today}
                onChange={update("pickupDate")}
                required
              />
            </FormField>
            <FormField label={t("booking.pickupTime")}>
              <TimeInput12h
                value={form.pickupTime}
                onChange={(value) =>
                  setForm((f) => ({ ...f, pickupTime: value }))
                }
              />
            </FormField>
          </div>

          {isRoundTrip && (
            <div className="grid sm:grid-cols-2 gap-4 bg-red-50/40 border border-red-100 rounded-xl p-4">
              <FormField label={t("booking.returnDate")} error={fieldErrors.returnDate}>
                <TextInput
                  type="date"
                  icon={<Calendar size={16} />}
                  value={form.returnDate}
                  min={form.pickupDate || today}
                  onChange={update("returnDate")}
                  required={isRoundTrip}
                />
              </FormField>
              <FormField label={t("booking.returnTime")} error={fieldErrors.returnTime}>
                <TimeInput12h
                  value={form.returnTime}
                  onChange={(value) =>
                    setForm((f) => ({ ...f, returnTime: value }))
                  }
                />
              </FormField>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label={t("booking.pickupLocation")}>
              <TextInput
                icon={<MapPin size={16} />}
                placeholder={t("booking.pickupLocationPlaceholder")}
                value={form.pickupLocation}
                onChange={update("pickupLocation")}
              />
            </FormField>
            <FormField label={t("booking.dropLocation")}>
              <TextInput
                icon={<MapPin size={16} />}
                placeholder={t("booking.dropLocationPlaceholder")}
                value={form.dropLocation}
                onChange={update("dropLocation")}
              />
            </FormField>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <FormField label={t("booking.passengers")}>
              <TextInput
                type="number"
                min="1"
                max="50"
                icon={<Users size={16} />}
                value={form.passengers}
                onChange={update("passengers")}
              />
            </FormField>
            <FormField label={t("booking.luggage")}>
              <TextInput
                icon={<Briefcase size={16} />}
                placeholder="2 Medium Bags"
                value={form.luggage}
                onChange={update("luggage")}
              />
            </FormField>
            <FormField label={t("booking.phoneNumber")} error={fieldErrors.mobile}>
              <TextInput
                icon={<Phone size={16} />}
                value={form.mobile}
                onChange={update("mobile")}
                required
              />
            </FormField>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label={t("auth.fullName")} error={fieldErrors.name}>
              <TextInput
                icon={<User size={16} />}
                placeholder={t("booking.fullNamePlaceholder")}
                value={form.name}
                onChange={update("name")}
                required
              />
            </FormField>
            <FormField label={t("auth.emailAddress")} error={fieldErrors.email}>
              <TextInput
                icon={<Mail size={16} />}
                placeholder={t("booking.emailPlaceholder")}
                value={form.email}
                onChange={update("email")}
              />
            </FormField>
          </div>

          <FormField label={t("booking.additionalRequirements")}>
            <TextArea
              rows={3}
              placeholder={t("booking.additionalRequirementsPlaceholder")}
              value={form.message}
              onChange={update("message")}
            />
          </FormField>

          <div className="bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-xs font-semibold rounded-xl p-3.5 flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span>{t("booking.securityNote")}</span>
          </div>

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
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {t("booking.selectVehicle")}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              {t("booking.selectVehicleSubtitle")}
            </p>

            {vehiclesError ? (
              <ErrorState message={vehiclesError} onRetry={loadVehicles} />
            ) : (
              <div className="space-y-2.5">
                {vehicles.map((v) => {
                  const imgUrl = v.images?.[0]?.url || v.image?.url;
                  const isAvailable = v.status === "Available";

                  return (
                    <label
                      key={v._id}
                      className={`flex items-center justify-between gap-3 border rounded-xl p-3 transition duration-150 ${
                        !isAvailable
                          ? "opacity-60 cursor-not-allowed border-slate-200/70 bg-slate-50/70"
                          : selectedVehicle === v._id
                            ? "cursor-pointer border-brand-red bg-red-50/50 ring-2 ring-brand-red/10"
                            : "cursor-pointer border-slate-200/90 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="vehicle_selection"
                          checked={selectedVehicle === v._id}
                          disabled={!isAvailable}
                          onChange={() =>
                            isAvailable && setSelectedVehicle(v._id)
                          }
                          className="accent-brand-red w-4 h-4 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                        />

                        <div className="relative w-14 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 flex items-center justify-center">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={pick(v.name, language)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Car className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {pick(v.name, language)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {isAvailable
                              ? `${v.seatingCapacity} Seats`
                              : t("booking.vehicleUnavailable", "Not available")}
                          </div>
                        </div>
                      </div>

                      <span className="text-brand-red font-extrabold text-xs whitespace-nowrap shrink-0 text-right">
                        {formatVehiclePricingCompact(v.pricingSummary)}
                      </span>
                    </label>
                  );
                })}

                {vehicles.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium text-center py-6">
                    No vehicles available right now — you can still submit and
                    we'll call to confirm.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4">
              {t("booking.priceSummary")}
            </h3>
            <div className="text-xs font-semibold space-y-2.5 text-slate-600">
              <div className="flex justify-between">
                <span>{t("booking.baseFare")}</span>
                <span className="text-slate-900">
                  {quoteLoading
                    ? t("booking.livePriceLoading", "Calculating...")
                    : `₹${(quote?.basePrice ?? 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("booking.driverAllowance")}</span>
                <span className="text-slate-900">
                  ₹{(quote?.driverCharges ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("booking.tollAndParking")}</span>
                <span className="text-slate-900">
                  ₹{(quote?.extraCharges ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-100 pt-3">
                <span>{t("booking.totalEstimated")}</span>
                <span className="text-brand-red">
                  {quoteLoading ? "…" : `₹${displayTotal.toFixed(2)}`}
                </span>
              </div>
            </div>
            <PrimaryButton
              type="submit"
              loading={status.loading}
              disabled={status.loading}
              className="mt-6"
            >
              {t("buttons.proceedToConfirmBooking")}
            </PrimaryButton>
            <p className="text-center text-[11px] font-medium text-slate-400 mt-2.5">
              {t("booking.noAdvancePayment")}
            </p>
            <p className="text-center text-[10px] font-medium text-slate-400 mt-1.5">
              {t("booking.pricingEstimateNote", "Final pricing is confirmed by our team based on actual trip details.")}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
