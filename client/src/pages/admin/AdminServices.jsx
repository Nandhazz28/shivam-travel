import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import api from "../../services/api";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { SkeletonCard } from "../../components/Skeleton";
import {
  FormField,
  TextInput,
  TextArea,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EMPTY = {
  name: { en: "", ta: "" },
  description: { en: "", ta: "" },
  priceLabel: "",
  icon: "car",
};

export default function AdminServices() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

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
      .get("/services?all=true")
      .then((res) => {
        if (isMounted.current) {
          setServices(res.data?.data || []);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setLoadError(apiErrorMessage(err, "Could not load services."));
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
    setImageError("");
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: { en: s.name?.en || "", ta: s.name?.ta || "" },
      description: { en: s.description?.en || "", ta: s.description?.ta || "" },
      priceLabel: s.priceLabel || "",
      icon: s.icon || "car",
    });
    setError("");
    setImageError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await api.put(`/services/${editing._id}`, form);
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Service updated.");
        }
      } else {
        const res = await api.post("/services", form);
        if (isMounted.current) {
          setEditing(res.data?.data || null);
          toast.success("Service created. You can add an image below.");
        }
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        setError(apiErrorMessage(err, "Could not save service."));
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;

    setImageError("");
    if (file.size > MAX_FILE_SIZE) {
      setImageError("Image is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(`/services/${editing._id}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (isMounted.current) {
        setEditing((prev) =>
          prev ? { ...prev, image: res.data?.data } : null,
        );
        toast.success("Image uploaded.");
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        setImageError(apiErrorMessage(err, "Could not upload image."));
      }
    } finally {
      if (isMounted.current) {
        setUploadingImage(false);
      }
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.patch(`/services/${s._id}/toggle-active`);
      if (isMounted.current) {
        toast.success(
          s.isActive ? "Service deactivated." : "Service activated.",
        );
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        toast.error(apiErrorMessage(err, "Could not update service."));
      }
    }
  };

  const remove = (id, name) => {
    confirmDialog.ask({
      title: "Delete service?",
      message: `This permanently deletes "${name}".`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/services/${id}`);
          if (isMounted.current) {
            toast.success("Service deleted.");
          }
          load();
        } catch (err) {
          if (isMounted.current) {
            toast.error(apiErrorMessage(err, "Could not delete service."));
          }
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Services
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage public service offerings, pricing labels, and status.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <Plus size={16} aria-hidden="true" /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={Briefcase}
            title="No services yet"
            message='Click "Add Service" to create your first one.'
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => {
            const englishName = s.name?.en || "Unnamed Service";
            const englishDesc = s.description?.en || "";

            return (
              <div
                key={s._id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {s.image?.url ? (
                    <img
                      src={s.image.url}
                      alt={englishName}
                      width={300}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center mb-3 text-gray-300">
                      <Briefcase size={28} aria-hidden="true" />
                    </div>
                  )}
                  <span
                    className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      s.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2">
                    {englishName}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {englishDesc}
                  </p>
                  {s.priceLabel && (
                    <p className="text-red-600 font-semibold text-sm mt-1.5">
                      {s.priceLabel}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(s)}
                    className="flex-1 border border-gray-300 rounded-lg py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s._id, englishName)}
                    className="border border-red-300 text-red-600 rounded-lg p-2 hover:bg-red-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                    aria-label={`Delete ${englishName}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Service" : "Add Service"}
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
              placeholder="தமிழ் உள்ளீடு"
            />
          </FormField>
          <FormField label="Description (English)">
            <TextArea
              rows={2}
              value={form.description.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: { ...f.description, en: e.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Description (Tamil)">
            <TextArea
              rows={2}
              value={form.description.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: { ...f.description, ta: e.target.value },
                }))
              }
              placeholder="தமிழ் உள்ளீடு"
            />
          </FormField>
          <FormField label="Price Label (e.g. Starting from ₹600/hour)">
            <TextInput
              value={form.priceLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, priceLabel: e.target.value }))
              }
            />
          </FormField>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Image</p>
            {editing ? (
              <div className="flex items-center gap-3">
                {editing.image?.url ? (
                  <img
                    src={editing.image.url}
                    alt=""
                    className="w-20 h-14 object-cover rounded-lg border border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-gray-100 border border-gray-200" />
                )}
                <label className="cursor-pointer text-sm font-semibold text-red-600 hover:underline">
                  {uploadingImage ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={uploadImage}
                  />
                </label>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Save the service first, then you can upload an image.
              </p>
            )}
            {imageError && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {imageError}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-sm font-medium">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" loading={saving}>
            Save Service
          </PrimaryButton>
        </form>
      </Modal>
      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
