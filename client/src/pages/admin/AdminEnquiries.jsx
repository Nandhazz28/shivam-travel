import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  Award,
  XCircle,
  CalendarCheck,
  Download,
  Search,
} from "lucide-react";
import api from "../../services/api";
import AdminStatCard from "../../components/admin/AdminStatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import { Select, TextInput } from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";
import { formatDateOnly, formatTime12h } from "../../utils/datetime";
import { ADMIN_BASE } from "../../config/adminPath";
import { downloadCsv } from "../../utils/csvDownload";

const PAGE_SIZE = 20;

const SOURCE_LABELS = {
  website_form: "Contact Us",
  booking_form: "Booking Request",
  admin: "Added by Admin",
};

function SourceBadge({ source }) {
  const label = SOURCE_LABELS[source] || source || "—";
  const isBooking = source === "booking_form";
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        isBooking
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export default function AdminEnquiries() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
  });
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    const sourceParam = sourceFilter
      ? `&source=${encodeURIComponent(sourceFilter)}`
      : "";
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return api
      .get(
        `/enquiries?page=${page}&limit=${PAGE_SIZE}${sourceParam}${searchParam}`,
      )
      .then((res) => {
        if (isMounted.current) {
          const list = res.data?.data || [];
          setEnquiries(list);
          setPagination(
            res.data?.pagination || {
              total: list.length,
              page: 1,
              limit: PAGE_SIZE,
            },
          );
        }
      })
      .catch((err) => {
        if (isMounted.current)
          setLoadError(apiErrorMessage(err, "Could not load enquiries."));
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, [page, sourceFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.set("source", sourceFilter);
      if (search) params.set("search", search);
      const query = params.toString();
      await downloadCsv(
        () =>
          api.get(`/enquiries/export/csv${query ? `?${query}` : ""}`, {
            responseType: "blob",
          }),
        "shivam-enquiries.csv",
      );
      if (isMounted.current) toast.success("CSV downloaded.");
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not export enquiries to CSV."));
    } finally {
      if (isMounted.current) setExporting(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      await api.put(`/enquiries/${id}/status`, { status });
      if (isMounted.current) {
        toast.success("Status updated.");
        load();
      }
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not update status."));
    } finally {
      if (isMounted.current) setStatusSaving(false);
    }
  };

  const remove = (id, name) => {
    confirmDialog.ask({
      title: "Delete enquiry?",
      message: `This permanently deletes the enquiry from "${name}".`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/enquiries/${id}`);
          if (isMounted.current) {
            toast.success("Enquiry deleted.");
            setViewing(null);
            load();
          }
        } catch (err) {
          if (isMounted.current)
            toast.error(apiErrorMessage(err, "Could not delete enquiry."));
        }
      },
    });
  };

  const convertToBooking = async (id) => {
    if (converting) return;
    setConverting(true);
    try {
      const res = await api.post(`/enquiries/${id}/convert-to-booking`);
      const booking = res.data?.data;
      if (res.data?.alreadyConverted) {
        toast.info(
          "This enquiry was already converted — opening the existing booking.",
        );
      } else {
        toast.success("Booking created from this enquiry.");
      }
      if (isMounted.current) {
        setViewing(null);
        load();
      }
      if (booking?._id) {
        navigate(`${ADMIN_BASE}/bookings/${booking._id}`);
      }
    } catch (err) {
      if (isMounted.current)
        toast.error(
          apiErrorMessage(err, "Could not convert this enquiry to a booking."),
        );
    } finally {
      if (isMounted.current) setConverting(false);
    }
  };

  const changeSourceFilter = (value) => {
    setSourceFilter(value);
    setPage(1);
  };

  const counts = (status) =>
    enquiries.filter((e) => e.status === status).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Enquiry Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review contact form messages and booking requests from customers.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            icon={<Search size={15} aria-hidden="true" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, email…"
            aria-label="Search enquiries"
            className="max-w-[16rem]"
          />
          <div className="w-56">
            <Select
              value={sourceFilter}
              onChange={(e) => changeSourceFilter(e.target.value)}
              aria-label="Filter by source"
            >
              <option value="">All sources</option>
              <option value="website_form">Contact Us messages</option>
              <option value="booking_form">Booking requests</option>
            </Select>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
          >
            <Download size={15} aria-hidden="true" />
            {exporting ? "Preparing CSV..." : "Download CSV"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <AdminStatCard
          icon={<Mail size={18} />}
          label="Total Enquiries"
          value={pagination.total ?? enquiries.length}
          color="blue"
        />
        <AdminStatCard
          icon={<CheckCircle2 size={18} />}
          label="New (this page)"
          value={counts("New")}
          color="green"
        />
        <AdminStatCard
          icon={<Clock size={18} />}
          label="Contacted (this page)"
          value={counts("Contacted")}
          color="amber"
        />
        <AdminStatCard
          icon={<Award size={18} />}
          label="Confirmed (this page)"
          value={counts("Confirmed")}
          color="purple"
        />
        <AdminStatCard
          icon={<XCircle size={18} />}
          label="Cancelled (this page)"
          value={counts("Cancelled")}
          color="red"
        />
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name", render: (r) => r.name || "—" },
          { key: "mobile", label: "Phone", render: (r) => r.mobile || "—" },
          { key: "email", label: "Email", render: (r) => r.email || "—" },
          {
            key: "source",
            label: "Source",
            render: (r) => <SourceBadge source={r.source} />,
          },
          {
            key: "tripType",
            label: "Service",
            render: (r) => r.tripType || "—",
          },
          {
            key: "createdAt",
            label: "Date",
            render: (r) => formatDate(r.createdAt),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={enquiries}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage={
          search
            ? `No enquiries match "${search}".`
            : "Enquiries submitted through the Contact Us and Book Now forms will appear here."
        }
        emptyIcon={Mail}
        renderActions={(r) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewing(r)}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={`View enquiry from ${r.name}`}
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(r._id, r.name)}
              className="p-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              aria-label={`Delete enquiry from ${r.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {!loading && !loadError && enquiries.length > 0 && (
        <Pagination
          page={page}
          limit={pagination.limit || PAGE_SIZE}
          total={pagination.total ?? enquiries.length}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Enquiry Details"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-gray-700">Name:</span>{" "}
              {viewing.name || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Mobile:</span>{" "}
              {viewing.mobile || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Email:</span>{" "}
              {viewing.email || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Source:</span>{" "}
              <SourceBadge source={viewing.source} />
            </p>
            <p>
              <span className="font-semibold text-gray-700">Trip Type:</span>{" "}
              {viewing.tripType || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Pickup Date:</span>{" "}
              {formatDateOnly(viewing.pickupDate)}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Pickup Time:</span>{" "}
              {formatTime12h(viewing.pickupTime)}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Pickup:</span>{" "}
              {viewing.pickupLocation || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Drop:</span>{" "}
              {viewing.dropLocation || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Message:</span>{" "}
              {viewing.message || "—"}
            </p>

            <div>
              <label
                className="font-semibold text-gray-700 block mb-1"
                htmlFor="enquiry-status"
              >
                Status
              </label>
              <Select
                id="enquiry-status"
                value={viewing.status || "New"}
                disabled={statusSaving}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  updateStatus(viewing._id, newStatus);
                  setViewing({ ...viewing, status: newStatus });
                }}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
              {viewing.source === "booking_form" && (
                <button
                  type="button"
                  onClick={() => convertToBooking(viewing._id)}
                  disabled={converting}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded"
                >
                  <CalendarCheck size={14} aria-hidden="true" />
                  {converting ? "Converting…" : "Convert to Booking"}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(viewing._id, viewing.name)}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded"
              >
                <Trash2 size={14} aria-hidden="true" /> Delete this enquiry
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
