import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X as XIcon,
  Eye,
  EyeOff,
  Car,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import { formatVehiclePricingLines } from "../../utils/vehiclePricing";
import AdminStatCard from "../../components/admin/AdminStatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import {
  FormField,
  TextInput,
  TextArea,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const EMPTY = {
  name: { en: "", ta: "" },
  description: { en: "", ta: "" },
  category: "Sedan",
  seatingCapacity: 4,
  luggageCapacity: "",
  features: { en: "", ta: "" },
  pricePerKm: 0,
  minimumKmPerDay: 250,
  extraKmRate: 0,
  pricingText: { en: "", ta: "" },
  fuelType: "Petrol",
  status: "Available",
  displayOrder: 0,
  isActive: true,
  whatsappCatalogUrl: "",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AdminVehicles() {
  const toast = useToast();
  const confirmDialog = useConfirm();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const PRICING_TRIP_TYPE = "Local";
  const [pricingEditor, setPricingEditor] = useState({
    perKm: { enabled: false, rate: "", id: null },
    perHour: { enabled: false, rate: "", id: null },
  });
  const [pricingLoadError, setPricingLoadError] = useState("");

  const fileInputRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    return api
      .get("/vehicles?all=true")
      .then((res) => {
        if (isMounted.current) {
          setVehicles(res.data?.data || []);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setLoadError(apiErrorMessage(err, "Could not load vehicles."));
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setUploadError("");
    setPricingLoadError("");
    setPricingEditor({
      perKm: { enabled: false, rate: "", id: null },
      perHour: { enabled: false, rate: "", id: null },
    });
    setModalOpen(true);
  };

  const loadPricingEditor = async (vehicleId) => {
    setPricingLoadError("");
    try {
      const res = await api.get(`/pricing?vehicle=${vehicleId}&all=true`);
      const docs = res.data?.data || [];
      const perKmDoc = docs.find(
        (p) => p.chargeType === "Per Km" && p.tripType === PRICING_TRIP_TYPE,
      );
      const perHourDoc = docs.find(
        (p) => p.chargeType === "Per Hour" && p.tripType === PRICING_TRIP_TYPE,
      );
      setPricingEditor({
        perKm: {
          enabled: Boolean(perKmDoc && perKmDoc.status === "Active"),
          rate: perKmDoc ? String(perKmDoc.rate) : "",
          id: perKmDoc?._id || null,
        },
        perHour: {
          enabled: Boolean(perHourDoc && perHourDoc.status === "Active"),
          rate: perHourDoc ? String(perHourDoc.rate) : "",
          id: perHourDoc?._id || null,
        },
      });
    } catch (err) {
      if (isMounted.current) {
        setPricingLoadError(
          apiErrorMessage(err, "Could not load this vehicle's public pricing."),
        );
      }
    }
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: { en: v.name?.en || "", ta: v.name?.ta || "" },
      description: { en: v.description?.en || "", ta: v.description?.ta || "" },
      category: v.category || "Sedan",
      seatingCapacity: v.seatingCapacity ?? 4,
      luggageCapacity: v.luggageCapacity || "",
      features: { en: v.features?.en || "", ta: v.features?.ta || "" },
      pricePerKm: v.pricePerKm ?? 0,
      minimumKmPerDay: v.minimumKmPerDay ?? 250,
      extraKmRate: v.extraKmRate ?? 0,
      pricingText: { en: v.pricingText?.en || "", ta: v.pricingText?.ta || "" },
      fuelType: v.fuelType || "Petrol",
      status: v.status || "Available",
      displayOrder: v.displayOrder ?? 0,
      isActive: v.isActive ?? true,
      whatsappCatalogUrl: v.whatsappCatalogUrl || "",
    });
    setError("");
    setUploadError("");
    setPricingLoadError("");
    setPricingEditor({
      perKm: { enabled: false, rate: "", id: null },
      perHour: { enabled: false, rate: "", id: null },
    });
    if (v?._id) loadPricingEditor(v._id);
    setModalOpen(true);
  };


  const isValidHttpUrl = (value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    const trimmedCatalogUrl = form.whatsappCatalogUrl.trim();
    if (!isValidHttpUrl(trimmedCatalogUrl)) {
      setError(
        "WhatsApp Catalog URL must be a valid http:// or https:// link (or left blank).",
      );
      return;
    }

    for (const [modeKey, modeLabel] of [
      ["perKm", "Per KM"],
      ["perHour", "Per Hour"],
    ]) {
      const mode = pricingEditor[modeKey];
      if (!mode.enabled) continue;
      const rateNum = Number(mode.rate);
      if (mode.rate === "" || !Number.isFinite(rateNum) || rateNum <= 0) {
        setError(`Enter a valid rate greater than 0 for ${modeLabel} pricing, or uncheck it.`);
        return;
      }
    }

    const payload = { ...form, whatsappCatalogUrl: trimmedCatalogUrl };
    setForm(payload);

    setSaving(true);
    try {
      let vehicleId = editing?._id;
      if (editing) {
        const res = await api.put(`/vehicles/${editing._id}`, payload);
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Vehicle updated.");
        }
      } else {
        const res = await api.post("/vehicles", payload);
        vehicleId = res.data?.data?._id;
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Vehicle created. You can add photos below.");
        }
      }

      if (vehicleId) {
        await reconcilePublicPricing(vehicleId);
      }

      load();
    } catch (err) {
      if (isMounted.current) {
        setError(apiErrorMessage(err, "Could not save vehicle."));
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  const reconcilePublicPricing = async (vehicleId) => {
    const jobs = [["perKm", "Per Km"], ["perHour", "Per Hour"]].map(
      async ([modeKey, chargeType]) => {
        const mode = pricingEditor[modeKey];
        if (mode.enabled) {
          const rateNum = Number(mode.rate);
          if (mode.id) {
            await api.put(`/pricing/${mode.id}`, { rate: rateNum, status: "Active" });
          } else {
            const res = await api.post("/pricing", {
              vehicle: vehicleId,
              tripType: PRICING_TRIP_TYPE,
              chargeType,
              rate: rateNum,
              status: "Active",
            });
            return res.data?.data?._id;
          }
        } else if (mode.id) {
          await api.put(`/pricing/${mode.id}`, { status: "Inactive" });
        }
        return mode.id;
      },
    );

    try {
      await Promise.all(jobs);
    } catch (err) {
      if (isMounted.current) {
        toast.error(
          apiErrorMessage(err, "Vehicle saved, but public pricing could not be updated."),
        );
      }
    }
  };

  const remove = (id, name) => {
    confirmDialog.ask({
      title: "Delete vehicle?",
      message: `This permanently deletes "${name}" and removes its uploaded photos.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/vehicles/${id}`);
          if (isMounted.current) {
            toast.success("Vehicle deleted.");
          }
          load();
        } catch (err) {
          if (isMounted.current) {
            toast.error(apiErrorMessage(err, "Could not delete vehicle."));
          }
        }
      },
    });
  };

  const validateFiles = (files) => {
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `"${file.name}" is not a supported image type. Use JPEG, PNG, WEBP, or GIF.`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `"${file.name}" is larger than 5MB. Please choose a smaller image.`;
      }
    }
    return "";
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !editing?._id) return;

    const validationError = validateFiles(files);
    if (validationError) {
      setUploadError(validationError);
      e.target.value = "";
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      const res = await api.post(`/vehicles/${editing._id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (isMounted.current) {
        setEditing((prev) =>
          prev ? { ...prev, images: res.data?.data || [] } : null,
        );
        toast.success(
          files.length > 1 ? "Photos uploaded." : "Photo uploaded.",
        );
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        setUploadError(
          apiErrorMessage(err, "Upload failed. Please try again."),
        );
      }
    } finally {
      if (isMounted.current) {
        setUploading(false);
      }
      e.target.value = "";
    }
  };

  const removeImage = (publicId) => {
    if (!editing?._id) return;

    confirmDialog.ask({
      title: "Remove this photo?",
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        try {
          const res = await api.delete(
            `/vehicles/${editing._id}/images/${encodeURIComponent(publicId)}`,
          );
          if (isMounted.current) {
            setEditing((prev) =>
              prev ? { ...prev, images: res.data?.data || [] } : null,
            );
          }
          load();
        } catch (err) {
          if (isMounted.current) {
            setUploadError(apiErrorMessage(err, "Could not remove photo."));
            toast.error(apiErrorMessage(err, "Could not remove photo."));
          }
        }
      },
    });
  };

  const available = vehicles.filter((v) => v.status === "Available").length;
  const notAvailable = vehicles.filter(
    (v) => v.status === "Not Available",
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            <Plus size={16} aria-hidden="true" /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={<Car size={18} />}
          label="Total Vehicles"
          value={vehicles.length}
          color="blue"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="Available"
          value={available}
          color="green"
        />
        <AdminStatCard
          icon={<XCircle size={18} />}
          label="Not Available"
          value={notAvailable}
          color="red"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "vehicle",
            label: "Vehicle",
            render: (r) => (
              <div className="flex items-center gap-2">
                {r.images?.[0]?.url && (
                  <img
                    src={r.images[0].url}
                    alt=""
                    width={40}
                    height={28}
                    className="w-10 h-7 object-cover rounded"
                  />
                )}
                <span>{r.name?.en || "—"}</span>
              </div>
            ),
          },
          { key: "category", label: "Type", render: (r) => r.category },
          { key: "seatingCapacity", label: "Seating" },
          {
            key: "pricingSummary",
            label: "Public Pricing",
            render: (r) => {
              const lines = formatVehiclePricingLines(r.pricingSummary);
              return lines.length > 0 ? lines.join(" · ") : "Contact for pricing";
            },
          },
          { key: "displayOrder", label: "Order" },
          {
            key: "visibility",
            label: "Public",
            render: (r) =>
              r.isActive ? (
                <span className="flex items-center gap-1 text-green-700 text-xs">
                  <Eye size={13} /> Visible
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <EyeOff size={13} /> Hidden
                </span>
              ),
          },
          {
            key: "status",
            label: "Availability",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={vehicles}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage="Add your first vehicle to get started."
        emptyIcon={Car}
        renderActions={(r) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEdit(r)}
              className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"
              aria-label={`Edit ${r.name?.en || "vehicle"}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(r._id, r.name?.en || "vehicle")}
              className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
              aria-label={`Delete ${r.name?.en || "vehicle"}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />
      <ConfirmModal {...confirmDialog.props} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Name (English)">
            <TextInput
              value={form.name.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: { ...f.name, en: e.target.value },
                }))
              }
              required
              aria-required="true"
            />
          </FormField>
          <FormField label="Name (Tamil)">
            <TextInput
              value={form.name.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: { ...f.name, ta: e.target.value },
                }))
              }
            />
          </FormField>

          <FormField label="Description (English)">
            <TextArea
              value={form.description.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: { ...f.description, en: e.target.value },
                }))
              }
              placeholder="A short, professional description shown on the vehicle's detail page."
              rows={3}
            />
          </FormField>
          <FormField label="Description (Tamil)">
            <TextArea
              value={form.description.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: { ...f.description, ta: e.target.value },
                }))
              }
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option>Hatchback</option>
                <option>Sedan</option>
                <option>SUV</option>
                <option>Premium SUV</option>
              </Select>
            </FormField>
            <FormField label="Fuel Type">
              <Select
                value={form.fuelType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fuelType: e.target.value }))
                }
              >
                <option>Petrol</option>
                <option>Diesel</option>
                <option>CNG</option>
                <option>Electric</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Seating Capacity">
              <TextInput
                type="number"
                min="1"
                value={form.seatingCapacity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    seatingCapacity: Number(e.target.value),
                  }))
                }
              />
            </FormField>
            <FormField label="Luggage Capacity">
              <TextInput
                value={form.luggageCapacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, luggageCapacity: e.target.value }))
                }
                placeholder="e.g. 2 large bags"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Availability">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option>Available</option>
                <option>Not Available</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Features (English)">
            <TextArea
              value={form.features.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  features: { ...f.features, en: e.target.value },
                }))
              }
              placeholder="Comma-separated, shown as a checklist — e.g. AC, Music System, Charging Point, GPS Tracking"
              rows={2}
            />
          </FormField>
          <FormField label="Features (Tamil)">
            <TextArea
              value={form.features.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  features: { ...f.features, ta: e.target.value },
                }))
              }
              rows={2}
            />
          </FormField>

          <FormField label="WhatsApp Catalog URL">
            <div className="flex items-center gap-2">
              <TextInput
                type="url"
                value={form.whatsappCatalogUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatsappCatalogUrl: e.target.value }))
                }
                placeholder="https://wa.me/p/xxxxxxxxxxxxxxx/91XXXXXXXXXX"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  window.open(
                    form.whatsappCatalogUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                disabled={!form.whatsappCatalogUrl}
                className="shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 text-slate-600 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-red transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:text-slate-600"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Test
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Optional — link to your WhatsApp product catalog. Leave blank to
              hide the Catalog button on the vehicle's page.
            </p>
          </FormField>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Public Pricing</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Shown on the vehicle card, vehicle detail page, and booking
                form. A vehicle can have Per KM, Per Hour, both, or neither
                (shows "Contact for pricing" when neither is set).
              </p>
            </div>
            {pricingLoadError && (
              <p className="text-xs font-semibold text-rose-600">{pricingLoadError}</p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingEditor.perKm.enabled}
                    onChange={(e) =>
                      setPricingEditor((p) => ({
                        ...p,
                        perKm: { ...p.perKm, enabled: e.target.checked },
                      }))
                    }
                    className="accent-brand-red w-4 h-4"
                  />
                  Per KM
                </label>
                {pricingEditor.perKm.enabled && (
                  <TextInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Rate per km, e.g. 12"
                    value={pricingEditor.perKm.rate}
                    onChange={(e) =>
                      setPricingEditor((p) => ({
                        ...p,
                        perKm: { ...p.perKm, rate: e.target.value },
                      }))
                    }
                    className="mt-2"
                  />
                )}
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingEditor.perHour.enabled}
                    onChange={(e) =>
                      setPricingEditor((p) => ({
                        ...p,
                        perHour: { ...p.perHour, enabled: e.target.checked },
                      }))
                    }
                    className="accent-brand-red w-4 h-4"
                  />
                  Per Hour
                </label>
                {pricingEditor.perHour.enabled && (
                  <TextInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Rate per hour, e.g. 500"
                    value={pricingEditor.perHour.rate}
                    onChange={(e) =>
                      setPricingEditor((p) => ({
                        ...p,
                        perHour: { ...p.perHour, rate: e.target.value },
                      }))
                    }
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            {!editing && (
              <p className="text-xs text-slate-400">
                Pricing is saved right after the vehicle is created below.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Price/km (₹) — legacy fallback">
              <TextInput
                type="number"
                min="0"
                value={form.pricePerKm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerKm: Number(e.target.value) }))
                }
              />
            </FormField>
            <FormField label="Min km/day">
              <TextInput
                type="number"
                min="0"
                value={form.minimumKmPerDay}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minimumKmPerDay: Number(e.target.value),
                  }))
                }
              />
            </FormField>
            <FormField label="Extra km rate">
              <TextInput
                type="number"
                min="0"
                value={form.extraKmRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    extraKmRate: Number(e.target.value),
                  }))
                }
              />
            </FormField>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            "Price/km" above is only used as an internal fallback for
            older bookings created before the Public Pricing section
            existed — it is no longer shown to customers. Use "Public
            Pricing" above to control what customers actually see.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pricing Override Text (English) — legacy, unused">
              <TextInput
                value={form.pricingText.en}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pricingText: { ...f.pricingText, en: e.target.value },
                  }))
                }
                placeholder="Deprecated — no longer displayed"
              />
            </FormField>
            <FormField label="Pricing Override Text (Tamil) — legacy, unused">
              <TextInput
                value={form.pricingText.ta}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pricingText: { ...f.pricingText, ta: e.target.value },
                  }))
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Display Order">
              <TextInput
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    displayOrder: Number(e.target.value),
                  }))
                }
              />
            </FormField>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                Visible on public site
              </span>
              <label className="flex items-center gap-2 h-[42px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="accent-brand-red w-5 h-5"
                />
                <span className="text-sm text-gray-600">
                  {form.isActive
                    ? "Shown to customers"
                    : "Hidden from customers"}
                </span>
              </label>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" loading={saving}>
            {editing ? "Save Changes" : "Create Vehicle"}
          </PrimaryButton>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Photos</h3>
            {!editing ? (
              <p className="text-xs text-gray-400">
                Save the vehicle first, then you can upload photos.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(editing.images || []).map((img) => (
                    <div key={img.publicId} className="relative group">
                      <img
                        src={img.url}
                        alt=""
                        width={100}
                        height={75}
                        className="w-full h-[75px] object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.publicId)}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                        aria-label="Remove photo"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                  {(!editing.images || editing.images.length === 0) && (
                    <p className="col-span-4 text-xs text-gray-400 py-2">
                      No photos uploaded yet.
                    </p>
                  )}
                </div>

                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 cursor-pointer hover:border-brand-red hover:text-brand-red transition">
                  <Upload size={16} aria-hidden="true" />
                  {uploading
                    ? "Uploading..."
                    : "Upload photos (JPEG, PNG, WEBP, or GIF — max 5MB each)"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>

                {uploadError && (
                  <p role="alert" className="text-red-600 text-xs mt-2">
                    {uploadError}
                  </p>
                )}
              </>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
