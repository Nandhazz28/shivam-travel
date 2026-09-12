import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  HelpCircle,
  CheckCircle2,
  EyeOff,
  Folder,
} from "lucide-react";
import api from "../../services/api";
import AdminStatCard from "../../components/admin/AdminStatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { SkeletonCard } from "../../components/Skeleton";
import {
  FormField,
  TextInput,
  TextArea,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const EMPTY = {
  question: { en: "", ta: "" },
  answer: { en: "", ta: "" },
  category: "General",
  status: "Published",
};

export default function AdminFAQ() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [faqs, setFaqs] = useState([]);
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
      .get("/faqs?all=true")
      .then((res) => {
        if (isMounted.current) setFaqs(res.data?.data || []);
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(apiErrorMessage(err, "Could not load FAQs."));
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      question: { en: f.question?.en || "", ta: f.question?.ta || "" },
      answer: { en: f.answer?.en || "", ta: f.answer?.ta || "" },
      category: f.category || "General",
      status: f.status || "Published",
    });
    setError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/faqs/${editing._id}`, form);
        if (isMounted.current) toast.success("FAQ updated.");
      } else {
        await api.post("/faqs", form);
        if (isMounted.current) toast.success("FAQ created.");
      }
      if (isMounted.current) {
        setModalOpen(false);
        load();
      }
    } catch (err) {
      if (isMounted.current)
        setError(apiErrorMessage(err, "Could not save FAQ."));
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const remove = (id, question) => {
    confirmDialog.ask({
      title: "Delete FAQ?",
      message: `This permanently deletes "${question || "this FAQ"}".`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/faqs/${id}`);
          if (isMounted.current) {
            toast.success("FAQ deleted.");
            load();
          }
        } catch (err) {
          if (isMounted.current)
            toast.error(apiErrorMessage(err, "Could not delete FAQ."));
        }
      },
    });
  };

  const categories = new Set(faqs.map((f) => f.category || "General"));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            FAQ Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage frequently asked questions in English and Tamil.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <Plus size={16} aria-hidden="true" /> Add FAQ
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={<HelpCircle size={18} />}
          label="Total FAQs"
          value={faqs.length}
          color="purple"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="Published"
          value={faqs.filter((f) => f.status === "Published").length}
          color="green"
        />
        <AdminStatCard
          icon={<EyeOff size={18} />}
          label="Hidden"
          value={faqs.filter((f) => f.status === "Hidden").length}
          color="amber"
        />
        <AdminStatCard
          icon={<Folder size={18} />}
          label="Categories"
          value={categories.size}
          color="blue"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={HelpCircle}
            title="No FAQs yet"
            message='Click "Add FAQ" to publish your first answer.'
          />
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => {
            const questionEn = f.question?.en || "Untitled Question";
            return (
              <div
                key={f._id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap shadow-sm"
              >
                <div className="min-w-0">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {f.category || "General"}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1 truncate">
                    {questionEn}
                  </h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={f.status} />
                  <button
                    type="button"
                    onClick={() => openEdit(f)}
                    className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                    aria-label={`Edit FAQ: ${questionEn}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f._id, questionEn)}
                    className="p-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                    aria-label={`Delete FAQ: ${questionEn}`}
                  >
                    <Trash2 size={14} />
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
        title={editing ? "Edit FAQ" : "Add FAQ"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Question (English)">
            <TextInput
              value={form.question.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  question: { ...f.question, en: e.target.value },
                }))
              }
              required
            />
          </FormField>
          <FormField label="Question (Tamil)">
            <TextInput
              value={form.question.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  question: { ...f.question, ta: e.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Answer (English)">
            <TextArea
              rows={3}
              value={form.answer.en}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  answer: { ...f.answer, en: e.target.value },
                }))
              }
              required
            />
          </FormField>
          <FormField label="Answer (Tamil)">
            <TextArea
              rows={3}
              value={form.answer.ta}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  answer: { ...f.answer, ta: e.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Category">
            <Select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="General">General</option>
              <option value="Booking">Booking</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Services">Services</option>
              <option value="Drivers">Drivers</option>
              <option value="Payments">Payments</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="Published">Published</option>
              <option value="Hidden">Hidden</option>
            </Select>
          </FormField>
          {error && (
            <p role="alert" className="text-red-600 text-sm font-medium">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" loading={saving}>
            Save FAQ
          </PrimaryButton>
        </form>
      </Modal>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
