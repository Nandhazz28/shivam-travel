import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminPath } from "../config/adminPath";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3.5 text-gray-500 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <span
            className="w-8 h-8 border-3 border-gray-200 border-t-red-600 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold tracking-wide text-gray-600">
            Checking your session…
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={adminPath("/login")} replace />;

  return children;
}
