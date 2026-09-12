import { Link, useLocation } from "react-router-dom";
import { Home, Car, Phone } from "lucide-react";
import { ADMIN_BASE } from "../config/adminPath";
import SEO from "./SEO";

export default function NotFound() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith(ADMIN_BASE);

  return (
    <main
      id="main-content"
      className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-gray-50/50"
    >
      <SEO
        title="Page Not Found | Shivam Travels"
        description="The page you're looking for doesn't exist or may have moved. Return to Shivam Travels' home page to book your car with driver in Mayiladuthurai."
        path={pathname}
        noindex
      />
      <div className="relative mb-6" aria-hidden="true">
        <span className="text-8xl sm:text-9xl font-black text-gray-200 select-none tracking-tighter">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-red-600 tracking-tight">
          Page Not Found
        </span>
      </div>

      <h1 className="sr-only">404 - Page Not Found</h1>

      <p className="text-gray-600 text-sm sm:text-base max-w-md leading-relaxed">
        {isAdmin
          ? "This admin page doesn't exist or may have moved to a different route."
          : "The route you are trying to access doesn't exist or has been relocated."}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full max-w-xs sm:max-w-none">
        <Link
          to={isAdmin ? `${ADMIN_BASE}/dashboard` : "/"}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <Home size={18} aria-hidden="true" />
          <span>{isAdmin ? "Back to Dashboard" : "Back to Home"}</span>
        </Link>

        {!isAdmin && (
          <Link
            to="/vehicles"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-gray-700 hover:text-gray-900 px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            <Car size={18} aria-hidden="true" />
            <span>Browse Cars</span>
          </Link>
        )}
      </div>

      {!isAdmin && (
        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Phone size={14} className="text-red-600" aria-hidden="true" />
          <span>Need immediate help? Call us via our Contact page.</span>
        </div>
      )}
    </main>
  );
}
