import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Tag,
} from "lucide-react";
import api from "../../services/api";
import AdminStatCard from "../../components/admin/AdminStatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import {
  FormField,
  TextInput,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const EMPTY = {
  vehicle: "",
  tripType: "Local",
  chargeType: "Package",
  rate: 0,
  packageHours: "",
  packageKm: "",
  extraKmRate: "",
  extraHourRate: "",
  status: "Active",
};

const CHARGE_TYPE_FIELDS = {
  "Per Km": ["extraKmRate"],
  "Per Hour": ["extraHourRate"],
  Package: ["packageHours", "packageKm", "extraKmRate", "extraHourRate"],
  Fixed: [],
};

function rateLabel(chargeType) {
  switch (chargeType) {
    case "Per Km":
      return "Rate (₹/km)";
    case "Per Hour":
      return "Rate (₹/hour)";
    case "Package":
      return "Package Rate (₹)";
    case "Fixed":
      return "Fixed Rate (₹)";
    default:
      return "Rate (₹)";
  }
}

export default function AdminPricing() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [pricing, setPricing] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);

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
      .get("/pricing?all=true")
      .then((res) => {
        if (isMounted.current) setPricing(res.data?.data || []);
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(apiErrorMessage(err, "Could not load pricing."));
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    api
      .get("/vehicles?all=true")
      .then((res) => {
        if (isMounted.current) setVehicles(res.data?.data || []);
      })
      .catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      vehicle: p.vehicle?._id || p.vehicle || "",
      tripType: p.tripType || "Local",
      chargeType: p.chargeType || "Package",
      rate: p.rate ?? 0,
      packageHours: p.packageHours ?? "",
      packageKm: p.packageKm ?? "",
      extraKmRate: p.extraKmRate ?? "",
      extraHourRate: p.extraHourRate ?? "",
      status: p.status || "Active",
    });
    setError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    const numericFields = ["rate", "packageHours", "packageKm", "extraKmRate", "extraHourRate"];
    for (const key of numericFields) {
      const value = form[key];
      if (value === "" || value === null || value === undefined) continue;
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) {
        setError(`${key} must be a valid number of 0 or more.`);
        return;
      }
    }
    if (form.rate === "" || form.rate === null) {
      setError("Rate is required.");
      return;
    }
    if (
      form.chargeType === "Package" &&
      !form.packageHours &&
      !form.packageKm
    ) {
      setError("A package must specify package hours and/or package km.");
      return;
    }

    const relevantExtraFields = CHARGE_TYPE_FIELDS[form.chargeType] || [];
    const payload = {
      vehicle: form.vehicle,
      tripType: form.tripType,
      chargeType: form.chargeType,
      rate: Number(form.rate),
      status: form.status,
      packageHours: relevantExtraFields.includes("packageHours") && form.packageHours !== "" ? Number(form.packageHours) : null,
      packageKm: relevantExtraFields.includes("packageKm") && form.packageKm !== "" ? Number(form.packageKm) : null,
      extraKmRate: relevantExtraFields.includes("extraKmRate") && form.extraKmRate !== "" ? Number(form.extraKmRate) : 0,
      extraHourRate: relevantExtraFields.includes("extraHourRate") && form.extraHourRate !== "" ? Number(form.extraHourRate) : 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/pricing/${editing._id}`, payload);
        if (isMounted.current) toast.success("Price entry updated.");
      } else {
        await api.post("/pricing", payload);
        if (isMounted.current) toast.success("Price entry created.");
      }
      if (isMounted.current) {
        setModalOpen(false);
        load();
      }
    } catch (err) {
      if (isMounted.current)
        setError(apiErrorMessage(err, "Could not save price entry."));
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const remove = (id, label) => {
    confirmDialog.ask({
      title: "Delete price entry?",
      message: `This permanently deletes the "${label}" pricing entry.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/pricing/${id}`);
          if (isMounted.current) {
            toast.success("Price entry deleted.");
            load();
          }
        } catch (err) {
          if (isMounted.current)
            toast.error(apiErrorMessage(err, "Could not delete price entry."));
        }
      },
    });
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const updatedThisMonth = pricing.filter((p) => {
    const timestamp = p.updatedAt || p.createdAt;
    if (!timestamp) return false;
    const date = new Date(timestamp);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  }).length;

  const avgRate = pricing.length
    ? `₹${Math.round(pricing.reduce((s, p) => s + (Number(p.rate) || 0), 0) / pricing.length)}`
    : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Price Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage per-trip-type rates and tariff packages across vehicles.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <Plus size={16} aria-hidden="true" /> Add Price
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={<Tag size={18} />}
          label="Total Price Lists"
          value={pricing.length}
          color="blue"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="Active"
          value={pricing.filter((p) => p.status === "Active").length}
          color="green"
        />
        <AdminStatCard
          icon={<Calendar size={18} />}
          label="Updated This Month"
          value={updatedThisMonth}
          color="amber"
        />
        <AdminStatCard
          icon={<IndianRupee size={18} />}
          label="Avg Rate"
          value={avgRate}
          color="purple"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "vehicle",
            label: "Vehicle",
            render: (r) => r.vehicle?.name?.en || "—",
          },
          { key: "tripType", label: "Type", render: (r) => r.tripType || "—" },
          {
            key: "chargeType",
            label: "Charges Type",
            render: (r) => r.chargeType || "—",
          },
          { key: "rate", label: "Rate", render: (r) => r.display || `₹${r.rate ?? 0}` },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={pricing}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage='Click "Add Price" to set your first rate.'
        emptyIcon={Tag}
        renderActions={(r) => {
          const vehicleName = r.vehicle?.name?.en || "Vehicle";
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                aria-label={`Edit price for ${vehicleName}`}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => remove(r._id, `${vehicleName} · ${r.tripType}`)}
                className="p-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                aria-label={`Delete price for ${vehicleName}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Price" : "Add Price"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Vehicle">
            <Select
              value={form.vehicle}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicle: e.target.value }))
              }
              required
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name?.en || v.name || "Unnamed Vehicle"}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Trip Type">
            <Select
              value={form.tripType}
              onChange={(e) =>
                setForm((f) => ({ ...f, tripType: e.target.value }))
              }
            >
              <option value="Local">Local</option>
              <option value="Outstation">Outstation</option>
              <option value="Airport">Airport</option>
              <option value="Package">Package</option>
            </Select>
          </FormField>
          <FormField label="Charge Type">
            <Select
              value={form.chargeType}
              onChange={(e) =>
                setForm((f) => ({ ...f, chargeType: e.target.value }))
              }
            >
              <option value="Package">Package</option>
              <option value="Per Km">Per Km</option>
              <option value="Per Hour">Per Hour</option>
              <option value="Fixed">Fixed</option>
            </Select>
          </FormField>
          <FormField label={rateLabel(form.chargeType)}>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, rate: e.target.value }))
              }
              required
            />
          </FormField>

          {form.chargeType === "Per Km" && (
            <FormField label="Extra KM Rate (₹/km, optional)">
              <TextInput
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate charged beyond the quoted distance"
                value={form.extraKmRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, extraKmRate: e.target.value }))
                }
              />
            </FormField>
          )}

          {form.chargeType === "Per Hour" && (
            <FormField label="Extra Hour Rate (₹/hour, optional)">
              <TextInput
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate charged beyond the quoted duration"
                value={form.extraHourRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, extraHourRate: e.target.value }))
                }
              />
            </FormField>
          )}

          {form.chargeType === "Package" && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <FormField label="Package Hours">
                <TextInput
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 8"
                  value={form.packageHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, packageHours: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Package KM">
                <TextInput
                  type="number"
                  min="0"
                  placeholder="e.g. 80"
                  value={form.packageKm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, packageKm: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Extra KM Rate (₹, optional)">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 15"
                  value={form.extraKmRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, extraKmRate: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Extra Hour Rate (₹, optional)">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={form.extraHourRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, extraHourRate: e.target.value }))
                  }
                />
              </FormField>
            </div>
          )}

          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </FormField>
          {error && (
            <p role="alert" className="text-red-600 text-sm font-medium">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" loading={saving}>
            Save Price
          </PrimaryButton>
        </form>
      </Modal>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
