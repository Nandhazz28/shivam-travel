import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import AdminStatCard from "../../components/admin/AdminStatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import Avatar from "../../components/Avatar";
import {
  FormField,
  TextInput,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EMPTY = {
  name: "",
  phone: "",
  licenseNumber: "",
  experienceYears: 0,
  status: "Active",
  assignedVehicle: "",
};

export default function AdminDrivers() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      .get("/drivers")
      .then((res) => {
        if (isMounted.current) setDrivers(res.data?.data || []);
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(apiErrorMessage(err, "Could not load drivers."));
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
      .catch(() => {
        if (isMounted.current) setVehicles([]);
      });
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setPhotoError("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name || "",
      phone: d.phone || "",
      licenseNumber: d.licenseNumber || "",
      experienceYears: d.experienceYears ?? 0,
      status: d.status || "Active",
      assignedVehicle: d.assignedVehicle?._id || d.assignedVehicle || "",
    });
    setPhotoError("");
    setFormError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        assignedVehicle: form.assignedVehicle || null,
      };
      if (editing) {
        const res = await api.put(`/drivers/${editing._id}`, payload);
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Driver updated.");
        }
      } else {
        const res = await api.post("/drivers", payload);
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Driver added. You can upload a photo below.");
        }
      }
      if (isMounted.current) load();
    } catch (err) {
      if (isMounted.current)
        setFormError(apiErrorMessage(err, "Could not save driver."));
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;
    setPhotoError("");
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("Photo is too large. Maximum size is 5MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(`/drivers/${editing._id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (isMounted.current) {
        setEditing((prev) =>
          prev ? { ...prev, photo: res.data?.data } : null,
        );
        toast.success("Photo uploaded.");
        load();
      }
    } catch (err) {
      if (isMounted.current)
        setPhotoError(apiErrorMessage(err, "Could not upload photo."));
    } finally {
      if (isMounted.current) setUploadingPhoto(false);
    }
  };

  const remove = (id, name) => {
    confirmDialog.ask({
      title: "Remove driver?",
      message: `This permanently removes "${name}" from your driver roster.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/drivers/${id}`);
          if (isMounted.current) {
            toast.success("Driver removed.");
            load();
          }
        } catch (err) {
          if (isMounted.current)
            toast.error(apiErrorMessage(err, "Could not remove driver."));
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Driver Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional driver team, statuses, and vehicle
            assignments.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <Plus size={16} aria-hidden="true" /> Add Driver
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={<UserCog size={18} />}
          label="Total Drivers"
          value={drivers.length}
          color="blue"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="Active"
          value={drivers.filter((d) => d.status === "Active").length}
          color="green"
        />
        <AdminStatCard
          icon={<Clock size={18} />}
          label="On Trip"
          value={drivers.filter((d) => d.status === "On Trip").length}
          color="amber"
        />
        <AdminStatCard
          icon={<XCircle size={18} />}
          label="Inactive"
          value={drivers.filter((d) => d.status === "Inactive").length}
          color="red"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "photo",
            label: "",
            render: (r) => (
              <Avatar name={r.name} src={r.photo?.url} size="sm" />
            ),
          },
          { key: "name", label: "Driver", render: (r) => r.name || "—" },
          { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
          {
            key: "assignedVehicle",
            label: "Assigned Vehicle",
            render: (r) => r.assignedVehicle?.name?.en || "—",
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={drivers}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage='Click "Add Driver" to build your roster.'
        emptyIcon={UserCog}
        renderActions={(r) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(r)}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={`Edit ${r.name}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(r._id, r.name)}
              className="p-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={`Remove ${r.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Driver" : "Add Driver"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Name">
            <TextInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoComplete="name"
            />
          </FormField>
          <FormField label="Phone">
            <TextInput
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              required
              autoComplete="tel"
            />
          </FormField>
          <FormField label="License Number">
            <TextInput
              value={form.licenseNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, licenseNumber: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Experience (years)">
            <TextInput
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  experienceYears: Number(e.target.value),
                }))
              }
            />
          </FormField>
          <FormField label="Assigned Vehicle">
            <Select
              value={form.assignedVehicle}
              onChange={(e) =>
                setForm((f) => ({ ...f, assignedVehicle: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name?.en || v.name || "Unnamed Vehicle"}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="Active">Active</option>
              <option value="On Trip">On Trip</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </FormField>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Photo
            </p>
            {editing ? (
              <div className="flex items-center gap-3">
                <Avatar
                  name={editing.name}
                  src={editing.photo?.url}
                  size="lg"
                />
                <label className="cursor-pointer text-sm font-semibold text-red-600 hover:underline">
                  {uploadingPhoto ? "Uploading..." : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={uploadPhoto}
                  />
                </label>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Save the driver first, then you can upload a photo.
              </p>
            )}
            {photoError && (
              <p role="alert" className="text-xs text-red-600 mt-1 font-medium">
                {photoError}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-600 font-medium">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <PrimaryButton type="submit" loading={saving}>
              {editing ? "Save Driver" : "Create & Add Photo"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
