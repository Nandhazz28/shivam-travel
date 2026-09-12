import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, History } from "lucide-react";
import api from "../../services/api";
import StatusBadge from "../../components/admin/StatusBadge";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import { SkeletonCard } from "../../components/Skeleton";
import { Select, TextInput } from "../../components/FormField";
import TimeInput12h from "../../components/TimeInput12h";
import { formatDateTime } from "../../utils/datetime";
import { useToast, apiErrorMessage } from "../../context/ToastContext";
import { ADMIN_BASE } from "../../config/adminPath";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];
const PAYMENT_OPTIONS = ["Pending", "Paid", "Refunded"];


export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pricingForm, setPricingForm] = useState(null);
  const [pricingError, setPricingError] = useState("");
  const [pricingSaving, setPricingSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const [dateError, setDateError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = () => {
    setLoading(true);
    setError("");
    return api
      .get(`/bookings/${id}`)
      .then((res) => {
        const data = res.data?.data;
        if (isMounted.current) {
          setBooking(data);
          if (data) {
            setPricingForm({
              basePrice: data.basePrice || 0,
              driverCharges: data.driverCharges || 0,
              extraCharges: data.extraCharges || 0,
              discount: data.discount || 0,
              tax: data.tax || 0,
              totalAmount: data.totalAmount || 0,
            });
          }
        }
      })
      .catch((err) => {
        if (isMounted.current)
          setError(apiErrorMessage(err, "Could not load this booking."));
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  };

  useEffect(() => {
    load();

    api
      .get("/vehicles?all=true")
      .then((res) => {
        if (isMounted.current) setVehicles(res.data?.data || []);
      })
      .catch(() => {
        if (isMounted.current) setVehicles([]);
      });

    api
      .get("/drivers")
      .then((res) => {
        if (isMounted.current) setDrivers(res.data?.data || res.data || []);
      })
      .catch(() => {
        if (isMounted.current) setDrivers([]);
      });
  }, [id]);

  useEffect(() => {
    if (!booking) return;
    setDraft({
      customerName: booking.customerName || "",
      customerPhone: booking.customerPhone || "",
      customerEmail: booking.customerEmail || "",
      pickupLocation: booking.pickupLocation || "",
      dropLocation: booking.dropLocation || "",
      passengers: booking.passengers ?? 1,
      luggage: booking.luggage || "",
    });
    setDateError("");
  }, [booking?._id, booking?.updatedAt]);

  const patch = async (fields, successMessage) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.put(`/bookings/${id}`, fields);
      if (isMounted.current) {
        setBooking(res.data?.data);
        if (successMessage) toast.success(successMessage);
      }
    } catch (err) {
      if (isMounted.current) {
        toast.error(apiErrorMessage(err, "Could not update this booking."));
      }
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const commitDraftField = (key, label, transform = (v) => v) => {
    const raw = draft[key];
    const nextValue = transform(raw);
    const currentValue = booking?.[key] ?? (key === "passengers" ? 1 : "");
    if (String(nextValue) === String(currentValue)) return;
    patch({ [key]: nextValue }, label);
  };

  const toDateInputValue = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleTravelDateChange = (value) => {
    setDateError("");
    if (
      booking.bookingType === "Round Trip" &&
      booking.returnDate &&
      value > toDateInputValue(booking.returnDate)
    ) {
      setDateError("Pickup date cannot be after the return date.");
      return;
    }
    patch({ travelDate: value }, "Pickup date updated.");
  };

  const handleReturnDateChange = (value) => {
    setDateError("");
    const pickup = toDateInputValue(booking.travelDate);
    if (pickup && value < pickup) {
      setDateError("Return date cannot be before the pickup date.");
      return;
    }
    patch({ returnDate: value }, "Return date updated.");
  };

  const handleBookingTypeChange = (value) => {
    patch({ bookingType: value }, "Booking type updated.");
  };

  const computedTotal = pricingForm
    ? Math.max(
        0,
        (Number(pricingForm.basePrice) || 0) +
          (Number(pricingForm.driverCharges) || 0) +
          (Number(pricingForm.extraCharges) || 0) +
          (Number(pricingForm.tax) || 0) -
          (Number(pricingForm.discount) || 0),
      )
    : 0;

  const pricingField = (key) => (e) => {
    const value = e.target.value;
    setPricingForm((f) => ({ ...f, [key]: value }));
  };

  const savePricing = async (manualTotal) => {
    if (pricingSaving || !pricingForm) return;
    setPricingError("");

    const values = {
      basePrice: Number(pricingForm.basePrice),
      driverCharges: Number(pricingForm.driverCharges),
      extraCharges: Number(pricingForm.extraCharges),
      discount: Number(pricingForm.discount),
      tax: Number(pricingForm.tax),
    };
    const invalid = Object.entries(values).some(
      ([, v]) => !Number.isFinite(v) || v < 0,
    );
    if (invalid) {
      setPricingError("All pricing values must be valid numbers of 0 or more.");
      return;
    }
    if (manualTotal) {
      const totalValue = Number(pricingForm.totalAmount);
      if (!Number.isFinite(totalValue) || totalValue < 0) {
        setPricingError("Total amount must be a valid number of 0 or more.");
        return;
      }
    }

    setPricingSaving(true);
    try {
      const payload = manualTotal
        ? {
            ...values,
            manualTotal: true,
            totalAmount: Number(pricingForm.totalAmount),
          }
        : values;
      const res = await api.put(`/bookings/${id}/pricing`, payload);
      if (isMounted.current) {
        const data = res.data?.data;
        setBooking(data);
        setPricingForm({
          basePrice: data.basePrice || 0,
          driverCharges: data.driverCharges || 0,
          extraCharges: data.extraCharges || 0,
          discount: data.discount || 0,
          tax: data.tax || 0,
          totalAmount: data.totalAmount || 0,
        });
        toast.success("Booking pricing updated.");
      }
    } catch (err) {
      if (isMounted.current)
        setPricingError(apiErrorMessage(err, "Could not update pricing."));
    } finally {
      if (isMounted.current) setPricingSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div
          className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6"
          aria-hidden="true"
        />
        <SkeletonCard lines={4} className="mb-4" />
        <div className="grid lg:grid-cols-3 gap-5">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div>
        <Link
          to={`${ADMIN_BASE}/bookings`}
          className="text-sm text-red-600 flex items-center gap-1 mb-4 font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1 py-0.5"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to Bookings
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const vehicleName = booking.vehicle?.name?.en || booking.vehicle?.name || "—";
  const driverName = booking.driver?.name || "—";
  const driverPhone = booking.driver?.phone;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-red-600 flex items-center gap-1 font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1 py-0.5"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Booking Details
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            #{booking.bookingCode} · Booked on{" "}
            {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-gray-900 mb-3">Customer Details</h3>
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Name
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  value={draft.customerName ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customerName: e.target.value }))
                  }
                  onBlur={() => commitDraftField("customerName", "Customer name updated.")}
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Phone
              </dt>
              <dd className="font-medium text-gray-800 flex items-center gap-2 mt-1">
                <TextInput
                  value={draft.customerPhone ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customerPhone: e.target.value }))
                  }
                  onBlur={() => commitDraftField("customerPhone", "Customer phone updated.")}
                />
                {booking.customerPhone && (
                  <a
                    href={`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 rounded shrink-0"
                    aria-label="Message on WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Email
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  value={draft.customerEmail ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customerEmail: e.target.value }))
                  }
                  onBlur={() => commitDraftField("customerEmail", "Customer email updated.")}
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Pickup Location
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  value={draft.pickupLocation ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, pickupLocation: e.target.value }))
                  }
                  onBlur={() => commitDraftField("pickupLocation", "Pickup location updated.")}
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Drop Location
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  value={draft.dropLocation ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dropLocation: e.target.value }))
                  }
                  onBlur={() => commitDraftField("dropLocation", "Drop location updated.")}
                />
              </dd>
            </div>
            {booking.specialNotes && (
              <div>
                <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Special Notes
                </dt>
                <dd className="font-medium text-gray-800">
                  {booking.specialNotes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-gray-900 mb-3">Trip Details</h3>
          {dateError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-2.5 py-1.5 mb-3">
              {dateError}
            </p>
          )}
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Booking Type
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <Select
                  value={booking.bookingType || "One Way"}
                  disabled={saving}
                  onChange={(e) => handleBookingTypeChange(e.target.value)}
                >
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                </Select>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Pickup Date
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  type="date"
                  value={toDateInputValue(booking.travelDate)}
                  disabled={saving}
                  onChange={(e) => handleTravelDateChange(e.target.value)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Pickup Time
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TimeInput12h
                  value={booking.pickupTime || ""}
                  disabled={saving}
                  onChange={(value) =>
                    patch({ pickupTime: value }, "Pickup time updated.")
                  }
                />
              </dd>
            </div>
            {booking.bookingType === "Round Trip" && (
              <>
                <div>
                  <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Return Date
                  </dt>
                  <dd className="font-medium text-gray-800 mt-1">
                    <TextInput
                      type="date"
                      value={toDateInputValue(booking.returnDate)}
                      min={toDateInputValue(booking.travelDate)}
                      disabled={saving}
                      onChange={(e) => handleReturnDateChange(e.target.value)}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Return Time
                  </dt>
                  <dd className="font-medium text-gray-800 mt-1">
                    <TimeInput12h
                      value={booking.returnTime || ""}
                      disabled={saving}
                      onChange={(value) =>
                        patch({ returnTime: value }, "Return time updated.")
                      }
                    />
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                No. of Passengers
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  type="number"
                  min="1"
                  max="50"
                  value={draft.passengers ?? 1}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, passengers: e.target.value }))
                  }
                  onBlur={() =>
                    commitDraftField("passengers", "Passenger count updated.", (v) =>
                      Math.max(1, Math.min(50, Number(v) || 1)),
                    )
                  }
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Luggage
              </dt>
              <dd className="font-medium text-gray-800 mt-1">
                <TextInput
                  value={draft.luggage ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, luggage: e.target.value }))
                  }
                  onBlur={() => commitDraftField("luggage", "Luggage details updated.")}
                />
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-gray-900 mb-3">Assigned Details</h3>
          <dl className="text-sm space-y-2 mb-3">
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Vehicle
              </dt>
              <dd className="font-medium text-gray-800">{vehicleName}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Driver
              </dt>
              <dd className="font-medium text-gray-800 flex items-center gap-2">
                {driverName}
                {driverPhone && (
                  <a
                    href={`tel:${driverPhone}`}
                    className="text-emerald-600 hover:text-emerald-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 rounded"
                    aria-label="Call driver"
                  >
                    <Phone size={15} />
                  </a>
                )}
              </dd>
            </div>
          </dl>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Assign Vehicle
              </label>
              <Select
                value={booking.vehicle?._id || ""}
                onChange={(e) =>
                  patch(
                    { vehicle: e.target.value || null },
                    "Vehicle assignment updated.",
                  )
                }
                disabled={saving}
              >
                <option value="">— Unassigned —</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name?.en || v.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Assign Driver
              </label>
              <Select
                value={booking.driver?._id || ""}
                onChange={(e) =>
                  patch(
                    { driver: e.target.value || null },
                    "Driver assignment updated.",
                  )
                }
                disabled={saving}
              >
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-bold text-gray-900">Booking Pricing</h3>
          {booking.originalTotalAmount !== null &&
            booking.originalTotalAmount !== undefined && (
              <p className="text-xs text-gray-500">
                Original estimate:{" "}
                <span className="font-semibold text-gray-700">
                  ₹{booking.originalTotalAmount}
                </span>
                {booking.totalOverridden && (
                  <span className="ml-2 text-amber-600 font-semibold">
                    Manually overridden
                  </span>
                )}
              </p>
            )}
        </div>

        {pricingForm && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Base Price
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.basePrice}
                  onChange={pricingField("basePrice")}
                  disabled={pricingSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Driving Charge
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.driverCharges}
                  onChange={pricingField("driverCharges")}
                  disabled={pricingSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Additional Charges
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.extraCharges}
                  onChange={pricingField("extraCharges")}
                  disabled={pricingSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Discount
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.discount}
                  onChange={pricingField("discount")}
                  disabled={pricingSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Tax
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.tax}
                  onChange={pricingField("tax")}
                  disabled={pricingSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm">
                <span className="text-gray-500">Calculated Total: </span>
                <span className="font-bold text-gray-900">
                  ₹{computedTotal}
                </span>
              </div>
              <button
                type="button"
                disabled={pricingSaving}
                onClick={() => savePricing(false)}
                className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-[0.98]"
              >
                Save Calculated Pricing
              </button>
            </div>

            <div className="flex items-end justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Total Charge (manual override)
                </label>
                <TextInput
                  type="number"
                  min="0"
                  value={pricingForm.totalAmount}
                  onChange={pricingField("totalAmount")}
                  disabled={pricingSaving}
                  className="max-w-[180px]"
                />
              </div>
              <button
                type="button"
                disabled={pricingSaving}
                onClick={() => savePricing(true)}
                className="bg-white border border-red-600 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-[0.98]"
              >
                Save Manual Total
              </button>
            </div>

            {pricingError && (
              <p className="text-xs font-medium text-red-600 mt-3">
                {pricingError}
              </p>
            )}
            {pricingSaving && (
              <p className="text-xs text-gray-400 mt-2 animate-pulse">
                Saving pricing...
              </p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Current saved total:{" "}
              <span className="font-semibold text-gray-600">
                ₹{booking.totalAmount || 0}
              </span>
            </p>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-gray-900 mb-3">Update Status</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Booking Status
              </label>
              <Select
                value={booking.status}
                onChange={(e) =>
                  patch({ status: e.target.value }, "Booking status updated.")
                }
                disabled={saving}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Payment Status
              </label>
              <Select
                value={booking.paymentStatus}
                onChange={(e) =>
                  patch(
                    { paymentStatus: e.target.value },
                    "Payment status updated.",
                  )
                }
                disabled={saving}
              >
                {PAYMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {saving && (
            <p className="text-xs text-gray-400 mt-2 animate-pulse">
              Saving changes...
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
          <h3 className="font-bold text-gray-900 mb-3">Payment Timeline</h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-800">
                {booking.paymentMethod || "—"}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600">Payment Status</span>
              <StatusBadge status={booking.paymentStatus} />
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
        <h3 className="font-bold text-gray-900 mb-3">
          Booking History / Activity
        </h3>
        {!booking.history || booking.history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded yet"
            message="Status changes and assignments will be logged here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date &amp; Time</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                  <th className="px-3 py-2 font-semibold">Performed By</th>
                  <th className="px-3 py-2 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {booking.history.map((h, i) => (
                  <tr key={h._id || i}>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {formatDateTime(h.at)}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {h.action}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {h.performedBy || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {h.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
