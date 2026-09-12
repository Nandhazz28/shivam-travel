import { Link } from "react-router-dom";

export default function AdminStatCard({
  icon,
  label,
  value,
  color = "gray",
  link,
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border border-amber-100",
    red: "bg-red-50 text-red-600 border border-red-100",
    purple: "bg-purple-50 text-purple-600 border border-purple-100",
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const badgeStyle = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition duration-150 hover:shadow-md">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${badgeStyle}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-black tracking-tight">
        {value}
      </div>
      <div className="text-xs text-gray-600 font-medium mt-1">{label}</div>
      {link && (
        <Link
          to={link}
          className="inline-flex items-center text-xs text-red-600 font-semibold mt-3 hover:text-red-700 hover:underline transition-colors"
        >
          View details →
        </Link>
      )}
    </div>
  );
}
