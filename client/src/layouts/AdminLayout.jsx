import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  LayoutDashboard,
  Briefcase,
  Car,
  Users,
  UserCog,
  Mail,
  Tag,
  Settings,
  HelpCircle,
  LifeBuoy,
  LogOut,
  ChevronDown,
  MoreHorizontal,
  Search,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminPath } from "../config/adminPath";
import Avatar from "../components/Avatar";

const NAV_ITEMS = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "bookings", label: "Bookings", icon: Tag },
  { to: "services", label: "Services", icon: Briefcase },
  { to: "vehicles", label: "Vehicles", icon: Car },
  { to: "catalog", label: "Home Catalog", icon: LayoutGrid },
  { to: "drivers", label: "Drivers", icon: UserCog },
  { to: "enquiries", label: "Enquiries", icon: Mail },
  { to: "pricing", label: "Pricing", icon: Tag },
  { to: "content", label: "Website Content", icon: LayoutDashboard },
  { to: "seo", label: "SEO", icon: Search },
  { to: "settings", label: "Settings", icon: Settings },
  { to: "users", label: "Users", icon: Users },
  { to: "faq", label: "FAQ", icon: HelpCircle },
  { to: "help", label: "Help", icon: LifeBuoy },
];

const MOBILE_TABS = NAV_ITEMS.slice(0, 4);

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(adminPath("/login"));
  };

  const currentLabel =
    NAV_ITEMS.find((item) => location.pathname.startsWith(adminPath(item.to)))
      ?.label ||
    (location.pathname.includes("/bookings/") ? "Booking Detail" : "Dashboard");

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 z-20 bg-gray-900 text-gray-300 shrink-0">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-800">
          <Avatar name={admin?.name} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {admin?.name}
            </div>
            <div className="text-xs text-gray-400 truncate capitalize">
              {admin?.role}
            </div>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto py-3 space-y-0.5"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={adminPath(item.to)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                  isActive
                    ? "bg-red-600 text-white font-semibold"
                    : "hover:bg-gray-800 text-gray-300 hover:text-white"
                }`
              }
            >
              <item.icon size={16} aria-hidden="true" className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-gray-300 border-t border-gray-800 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <LogOut size={16} aria-hidden="true" className="shrink-0" />
          <span>Logout</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="text-sm text-gray-400 min-w-0 truncate">
            Admin{" "}
            <span className="mx-1" aria-hidden="true">
              /
            </span>{" "}
            <span className="text-gray-900 font-semibold">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Avatar name={admin?.name} size="sm" />
            <div className="hidden sm:block text-sm">
              <div className="font-semibold text-gray-900">{admin?.name}</div>
              <div className="text-xs text-gray-500 capitalize">
                {admin?.role}
              </div>
            </div>
            <ChevronDown
              size={14}
              className="text-gray-400"
              aria-hidden="true"
            />
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40 shadow-lg"
        aria-label="Admin mobile navigation"
      >
        {MOBILE_TABS.map((item) => (
          <NavLink
            key={item.to}
            to={adminPath(item.to)}
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] gap-1 font-medium transition-colors ${
                isActive
                  ? "text-red-600 font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="flex flex-col items-center text-[10px] gap-1 text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
          aria-expanded={moreOpen}
          aria-label="More admin sections"
        >
          <MoreHorizontal size={18} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-3 gap-2 p-4 z-40 max-h-[60vh] overflow-y-auto shadow-xl">
          {NAV_ITEMS.slice(4).map((item) => (
            <NavLink
              key={item.to}
              to={adminPath(item.to)}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs py-2 px-1 rounded-lg text-center transition-colors ${
                  isActive
                    ? "text-red-600 font-bold bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              <span className="truncate w-full">{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-xs text-red-600 font-bold py-2 px-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
