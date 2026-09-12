const STYLES = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-800 border-amber-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-purple-50 text-purple-700 border-purple-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-red-50 text-red-700 border-red-200",
  "In Service": "bg-amber-50 text-amber-800 border-amber-200",
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Not Available": "bg-red-50 text-red-700 border-red-200",
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hidden: "bg-gray-100 text-gray-700 border-gray-200",
  "On Trip": "bg-amber-50 text-amber-800 border-amber-200",
  "In Progress": "bg-amber-50 text-amber-800 border-amber-200",
  Converted: "bg-purple-50 text-purple-700 border-purple-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function StatusBadge({ status }) {
  const badgeStyle =
    STYLES[status] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
    >
      <span className="text-[10px] leading-none">•</span>
      <span>{status}</span>
    </span>
  );
}
