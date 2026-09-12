
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon,
  title = "Nothing here yet",
  message,
  action,
}) {
  const Icon = icon || Inbox;

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 my-4">
      <div
        className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200"
        aria-hidden="true"
      >
        <Icon size={26} strokeWidth={1.75} />
      </div>

      <h3 className="font-bold text-black text-base sm:text-lg tracking-tight">
        {title}
      </h3>

      {message && (
        <p className="text-sm text-gray-600 mt-1.5 max-w-sm leading-relaxed font-medium">
          {message}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

