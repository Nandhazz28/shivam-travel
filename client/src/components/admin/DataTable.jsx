import { SkeletonTableRows } from "../Skeleton";
import EmptyState from "../EmptyState";
import ErrorState from "../ErrorState";

export default function DataTable({
  columns,
  rows = [],
  renderActions,
  emptyMessage = "No records found.",
  emptyIcon,
  loading = false,
  error = "",
  onRetry,
  getRowKey,
}) {
  const rowKey = getRowKey || ((row) => row._id || row.id);

  if (!loading && error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <EmptyState
          title="No records found"
          message={emptyMessage}
          icon={emptyIcon}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-200">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-4 py-3 font-bold whitespace-nowrap tracking-wider"
                >
                  {c.label}
                </th>
              ))}
              {renderActions && (
                <th className="text-left px-4 py-3 font-bold tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <SkeletonTableRows
                columns={columns.length + (renderActions ? 1 : 0)}
              />
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-4 py-3 whitespace-nowrap text-gray-900"
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-gray-200">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2" aria-hidden="true">
                <div className="animate-pulse bg-gray-200 rounded h-4 w-2/3" />
                <div className="animate-pulse bg-gray-200 rounded h-3 w-1/2" />
              </div>
            ))
          : rows.map((row) => (
              <div key={rowKey(row)} className="p-4 space-y-2">
                <dl className="space-y-2">
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <dt className="font-semibold text-gray-500 shrink-0">
                        {c.label}
                      </dt>
                      <dd className="font-medium text-black text-right min-w-0">
                        {c.render ? c.render(row) : row[c.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
                {renderActions && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100 justify-end">
                    {renderActions(row)}
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
