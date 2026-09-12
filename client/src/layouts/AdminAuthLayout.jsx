import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Car, Users, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";

const FEATURES = [
  { icon: Car, text: "Manage your fleet, drivers and pricing in one place" },
  {
    icon: Users,
    text: "Track every booking and customer from enquiry to trip",
  },
];

export default function AdminAuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 lg:bg-white flex flex-col">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5">
        <div className="hidden lg:flex lg:col-span-2 relative flex-col justify-between overflow-hidden bg-gray-950 px-10 py-10 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-600/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-red-600/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="bg-white inline-block rounded-lg p-2">
              <Logo className="h-9" />
            </div>
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-500 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
              <ShieldCheck size={12} aria-hidden="true" /> Admin Panel
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">
              Run your travel business
              <br />
              from one place.
            </h1>
            <ul className="mt-7 space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-sm text-gray-300"
                >
                  <span
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Icon size={16} className="text-red-500" />
                  </span>
                  <span className="pt-1.5">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-gray-500">
            © {new Date().getFullYear()} Shivam Travels. Staff access only.
          </p>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <div className="px-6 py-5 lg:hidden">
            <Logo className="h-9" />
          </div>
          <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs lg:shadow-none lg:border-none p-6 sm:p-8 lg:p-0">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
