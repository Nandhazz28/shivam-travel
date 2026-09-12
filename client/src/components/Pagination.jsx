import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, limit, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  if (pages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex items-center justify-between gap-3 px-4 py-3.5 border-t border-gray-200 bg-gray-50/50 flex-wrap"
    >
      <p className="text-xs text-gray-500 font-medium">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-gray-900">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <span className="text-xs font-semibold text-gray-600 px-2 select-none">
          Page {page} of {pages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Go to next page"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
