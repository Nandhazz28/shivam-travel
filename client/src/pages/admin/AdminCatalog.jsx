import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pencil,
  Upload,
  X as XIcon,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import AdminStatCard from "../../components/admin/AdminStatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import {
  FormField,
  TextInput,
  TextArea,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const EMPTY_FORM = {
  title: { en: "", ta: "" },
  description: { en: "", ta: "" },
  catalogUrl: "",
  displayOrder: 0,
  isActive: true,
  isAvailable: true,
};

export default function AdminCatalog() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [togglingId, setTogglingId] = useState(null);

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
      .get("/catalog?all=true")
      .then((res) => {
        if (isMounted.current) setCategories(res.data?.data || []);
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(
            apiErrorMessage(err, "Could not load catalog categories."),
          );
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: { en: c.title?.en || "", ta: c.title?.ta || "" },
      description: { en: c.description?.en || "", ta: c.description?.ta || "" },
      catalogUrl: c.catalogUrl || "",
      displayOrder: c.displayOrder ?? 0,
      isActive: c.isActive ?? true,
      isAvailable: c.isAvailable ?? true,
    });
    setError("");
    setUploadError("");
    setModalOpen(true);
  };

  const isValidHttpOrRelativeUrl = (value) => {
    if (!value) return true;
    if (value.startsWith("/")) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving || !editing) return;
    setError("");

    const trimmedUrl = form.catalogUrl.trim();
    if (!isValidHttpOrRelativeUrl(trimmedUrl)) {
      setError(
        "Catalog URL must be a valid http(s) link or a relative path like /vehicles?category=Sedan.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/catalog/${editing._id}`, {
        ...form,
        catalogUrl: trimmedUrl,
      });
      if (isMounted.current) {
        setEditing(res.data?.data || null);
        toast.success("Catalog category updated.");
      }
      load();
    } catch (err) {
      if (isMounted.current)
        setError(apiErrorMessage(err, "Could not save catalog category."));
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported image type. Use JPEG, PNG, WEBP, or GIF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is larger than 5MB. Please choose a smaller image.`;
    }
    return "";
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing?._id) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      e.target.value = "";
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(`/catalog/${editing._id}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (isMounted.current) {
        setEditing(res.data?.data || null);
        toast.success("Catalog image uploaded.");
      }
      load();
    } catch (err) {
      if (isMounted.current)
        setUploadError(
          apiErrorMessage(err, "Upload failed. Please try again."),
        );
    } finally {
      if (isMounted.current) setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = async () => {
    if (!editing?._id) return;
    try {
      const res = await api.delete(`/catalog/${editing._id}/image`);
      if (isMounted.current) {
        setEditing(res.data?.data || null);
        toast.success("Catalog image removed.");
      }
      load();
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not remove image."));
    }
  };

  const toggleActive = async (c) => {
    if (togglingId) return;
    setTogglingId(c._id);
    try {
      await api.patch(`/catalog/${c._id}/status`, { isActive: !c.isActive });
      if (isMounted.current)
        toast.success(
          !c.isActive
            ? "Category published on Home."
            : "Category hidden from Home.",
        );
      load();
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not update published status."));
    } finally {
      if (isMounted.current) setTogglingId(null);
    }
  };

  const toggleAvailability = async (c) => {
    if (togglingId) return;
    setTogglingId(c._id);
    try {
      await api.patch(`/catalog/${c._id}/availability`, {
        isAvailable: !c.isAvailable,
      });
      if (isMounted.current)
        toast.success(
          !c.isAvailable ? "Marked as Available." : "Marked as Not Available.",
        );
      load();
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not update availability."));
    } finally {
      if (isMounted.current) setTogglingId(null);
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const availableCount = categories.filter(
    (c) => c.isActive && c.isAvailable,
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Home Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the car category cards shown on the Home page. These are
            separate from your Vehicle records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={<LayoutGrid size={18} />}
          label="Total Categories"
          value={categories.length}
          color="blue"
        />
        <AdminStatCard
          icon={<Eye size={18} />}
          label="Published"
          value={activeCount}
          color="green"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="Available"
          value={availableCount}
          color="amber"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "image",
            label: "Image",
            render: (r) =>
              r.image?.url ? (
                <img
                  src={r.image.url}
                  alt=""
                  width={56}
                  height={40}
                  className="w-14 h-10 object-cover rounded-md"
                />
              ) : (
                <div className="w-14 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                  <LayoutGrid size={16} />
                </div>
              ),
          },
          {
            key: "category",
            label: "Category",
            render: (r) => r.title?.en || r.category,
          },
          {
            key: "description",
            label: "Description",
            render: (r) => (
              <span className="line-clamp-1 max-w-xs inline-block text-gray-600">
                {r.description?.en || "—"}
              </span>
            ),
          },
          {
            key: "published",
            label: "Published",
            render: (r) => (
              <StatusBadge status={r.isActive ? "Published" : "Hidden"} />
            ),
          },
          {
            key: "availability",
            label: "Availability",
            render: (r) => (
              <StatusBadge
                status={r.isAvailable ? "Available" : "Not Available"}
              />
            ),
          },
          { key: "displayOrder", label: "Order" },
        ]}
        rows={categories}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage="Run the seed script (npm run seed) to create the default catalog categories."
        emptyIcon={LayoutGrid}
        renderActions={(r) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(r)}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={`Edit ${r.title?.en || r.category}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => toggleActive(r)}
              disabled={togglingId === r._id}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={
                r.isActive
                  ? `Hide ${r.title?.en || r.category} from Home`
                  : `Publish ${r.title?.en || r.category} on Home`
              }
              title={r.isActive ? "Hide from Home" : "Publish on Home"}
            >
              {r.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              onClick={() => toggleAvailability(r)}
              disabled={togglingId === r._id}
              className={`p-1.5 border rounded-lg transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 ${
                r.isAvailable
                  ? "border-green-300 text-green-700 hover:bg-green-50"
                  : "border-red-300 text-red-600 hover:bg-red-50"
              }`}
              aria-label={
                r.isAvailable
                  ? `Mark ${r.title?.en || r.category} as Not Available`
                  : `Mark ${r.title?.en || r.category} as Available`
              }
              title={r.isAvailable ? "Mark Not Available" : "Mark Available"}
            >
              {r.isAvailable ? (
                <CheckCircle2 size={14} />
              ) : (
                <XCircle size={14} />
              )}
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit ${editing?.category || "Category"}`}
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <FormField label="Title (English)">
              <TextInput
                value={form.title.en}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: { ...f.title, en: e.target.value },
                  }))
                }
                required
                aria-required="true"
              />
            </FormField>
            <FormField label="Title (Tamil)">
              <TextInput
                value={form.title.ta}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: { ...f.title, ta: e.target.value },
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
                placeholder="A short, appealing description shown on the Home catalog card."
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

            <FormField label="Catalog URL (CTA link)">
              <div className="flex items-center gap-2">
                <TextInput
                  value={form.catalogUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catalogUrl: e.target.value }))
                  }
                  placeholder={`/vehicles?category=${encodeURIComponent(editing.category)}`}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      form.catalogUrl,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  disabled={!form.catalogUrl}
                  className="shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Test
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Where the card's "View Car Catalog" button sends customers —
                defaults to the Vehicle page filtered by this category.
              </p>
            </FormField>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Published
                </span>
                <label className="flex items-center gap-2 h-[42px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-600">
                    {form.isActive
                      ? "Active — shown on Home"
                      : "Inactive — hidden from Home"}
                  </span>
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Availability
                </span>
                <label className="flex items-center gap-2 h-[42px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isAvailable: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-600">
                    {form.isAvailable ? "Available" : "Not Available"}
                  </span>
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              Published controls whether this card appears on Home at all.
              Availability only controls the badge — an unavailable card stays
              visible so customers know it exists.
            </p>

            {error && (
              <p role="alert" className="text-red-600 text-sm font-medium">
                {error}
              </p>
            )}

            <PrimaryButton type="submit" loading={saving}>
              Save Changes
            </PrimaryButton>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-2">
                Catalog Image
              </h3>
              {editing.image?.url ? (
                <div className="relative inline-block mb-3">
                  <img
                    src={editing.image.url}
                    alt=""
                    width={160}
                    height={110}
                    className="w-40 h-[110px] object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                    aria-label="Remove image"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">
                  No image uploaded yet — the Home card will show a fallback
                  icon.
                </p>
              )}

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 cursor-pointer hover:border-red-600 hover:text-red-600 transition">
                <Upload size={16} aria-hidden="true" />
                {uploading
                  ? "Uploading..."
                  : "Upload image (JPEG, PNG, WEBP, or GIF — max 5MB)"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>

              {uploadError && (
                <p
                  role="alert"
                  className="text-red-600 text-xs mt-2 font-medium"
                >
                  {uploadError}
                </p>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
