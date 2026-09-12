export function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5"
        >
          <SkeletonBlock className="w-10 h-10 rounded-xl mb-4" />
          <SkeletonBlock className="h-7 w-20 mb-2" />
          <SkeletonBlock className="h-3.5 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRows({ columns = 4, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-gray-100">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-4">
              <SkeletonBlock className="h-4 w-full max-w-[10rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-xs p-6 ${className}`}
      aria-hidden="true"
    >
      <SkeletonBlock className="h-5 w-1/3 mb-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className="h-3.5 w-full mb-3 last:mb-0" />
      ))}
    </div>
  );
}
