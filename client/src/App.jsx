import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminAuthLayout from "./layouts/AdminAuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { ADMIN_BASE } from "./config/adminPath";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Vehicles from "./pages/public/Vehicles";
import VehicleDetail from "./pages/public/VehicleDetail";
import Booking from "./pages/public/Booking";
import Contact from "./pages/public/Contact";
import FAQ from "./pages/public/FAQ";
import NotFound from "./components/NotFound";

const AdminLogin = lazy(() => import("./pages/admin/auth/AdminLogin"));
const AdminForgotPassword = lazy(() => import("./pages/admin/auth/AdminForgotPassword"));
const AdminVerifyOtp = lazy(() => import("./pages/admin/auth/AdminVerifyOtp"));
const AdminResetPassword = lazy(() => import("./pages/admin/auth/AdminResetPassword"));

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminVehicles = lazy(() => import("./pages/admin/AdminVehicles"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const AdminDrivers = lazy(() => import("./pages/admin/AdminDrivers"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminPricing = lazy(() => import("./pages/admin/AdminPricing"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminHelp = lazy(() => import("./pages/admin/AdminHelp"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminBookingDetail = lazy(() => import("./pages/admin/AdminBookingDetail"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div
        className="w-8 h-8 border-2 border-gray-300 border-t-brand-red rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<AdminAuthLayout />}>
        <Route
          path={`${ADMIN_BASE}/login`}
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path={`${ADMIN_BASE}/forgot-password`}
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminForgotPassword />
            </Suspense>
          }
        />
        <Route
          path={`${ADMIN_BASE}/verify-otp`}
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminVerifyOtp />
            </Suspense>
          }
        />
        <Route
          path={`${ADMIN_BASE}/reset-password`}
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminResetPassword />
            </Suspense>
          }
        />
      </Route>

      <Route
        path={ADMIN_BASE}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="bookings"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminBookings />
            </Suspense>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminBookingDetail />
            </Suspense>
          }
        />
        <Route
          path="services"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminServices />
            </Suspense>
          }
        />
        <Route
          path="vehicles"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminVehicles />
            </Suspense>
          }
        />
        <Route
          path="catalog"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminCatalog />
            </Suspense>
          }
        />
        <Route
          path="drivers"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminDrivers />
            </Suspense>
          }
        />
        <Route
          path="enquiries"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminEnquiries />
            </Suspense>
          }
        />
        <Route
          path="pricing"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminPricing />
            </Suspense>
          }
        />
        <Route
          path="content"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminContent />
            </Suspense>
          }
        />
        <Route
          path="seo"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminSEO />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminSettings />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminUsers />
            </Suspense>
          }
        />
        <Route
          path="faq"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminFAQ />
            </Suspense>
          }
        />
        <Route
          path="help"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminHelp />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
}
