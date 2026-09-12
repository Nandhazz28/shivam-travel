import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, CalendarDays, Download, Search } from "lucide-react";
import api from "../../services/api";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Pagination from "../../components/Pagination";
import { Select, TextInput } from "../../components/FormField";
import { useToast, apiErrorMessage } from "../../context/ToastContext";
import { formatDateOnly, formatTime12h } from "../../utils/datetime";
import { ADMIN_BASE } from "../../config/adminPath";
import { downloadCsv } from "../../utils/csvDownload";

const PAGE_SIZE = 20;
const STATUSES = [
  "",
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];

const formatDate = (dateString) => formatDateOnly(dateString);

export default function AdminBookings() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
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
    setError("");
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : "";
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

    return api
      .get(
        `/bookings?page=${page}&limit=${PAGE_SIZE}${statusParam}${searchParam}`,
      )
      .then((res) => {
        if (isMounted.current) {
          const list = res.data?.data || [];
          setBookings(list);
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
        if (isMounted.current) {
          setError(apiErrorMessage(err, "Could not load bookings."));
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      const query = params.toString();
      await downloadCsv(
        () =>
          api.get(`/bookings/export/csv${query ? `?${query}` : ""}`, {
            responseType: "blob",
          }),
        "shivam-bookings.csv",
      );
      if (isMounted.current) toast.success("CSV downloaded.");
    } catch (err) {
      if (isMounted.current)
        toast.error(apiErrorMessage(err, "Could not export bookings to CSV."));
    } finally {
      if (isMounted.current) setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Bookings
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            icon={<Search size={15} aria-hidden="true" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, email, ID…"
            aria-label="Search bookings"
            className="max-w-[16rem]"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="max-w-[10rem]"
            aria-label="Filter by booking status"
          >
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-[0.98]"
          >
            <Download size={15} aria-hidden="true" />
            {exporting ? "Preparing CSV..." : "Download CSV"}
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "bookingCode", label: "Booking ID" },
          {
            key: "customerName",
            label: "Customer",
            render: (r) => r.customerName || "—",
          },
          {
            key: "vehicle",
            label: "Vehicle",
            render: (r) => r.vehicle?.name?.en || r.vehicle?.name || "—",
          },
          {
            key: "travelDate",
            label: "Date",
            render: (r) => formatDate(r.travelDate),
          },
          {
            key: "pickupTime",
            label: "Time",
            render: (r) => formatTime12h(r.pickupTime),
          },
          {
            key: "totalAmount",
            label: "Amount",
            render: (r) => `₹${r.totalAmount || 0}`,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={bookings}
        loading={loading}
        error={error}
        onRetry={load}
        emptyMessage={
          search
            ? `No bookings match "${search}".`
            : status
              ? `No ${status.toLowerCase()} bookings found.`
              : "Bookings placed through the site will appear here."
        }
        emptyIcon={CalendarDays}
        renderActions={(r) => (
          <button
            type="button"
            onClick={() => navigate(`${ADMIN_BASE}/bookings/${r._id}`)}
            className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            aria-label={`View booking ${r.bookingCode}`}
          >
            <Eye size={14} />
          </button>
        )}
      />

      {!loading && !error && bookings.length > 0 && (
        <Pagination
          page={page}
          limit={pagination.limit || PAGE_SIZE}
          total={pagination.total ?? bookings.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
