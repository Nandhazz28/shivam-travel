import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MessageSquare,
  Briefcase,
  Car,
  Mail,
  ClipboardList,
  Clock,
  CheckCircle2,
} from "lucide-react";
import AdminStatCard from "../../components/admin/AdminStatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import { SkeletonStatCards, SkeletonCard } from "../../components/Skeleton";
import api from "../../services/api";
import { apiErrorMessage } from "../../context/ToastContext";
import { adminPath } from "../../config/adminPath";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    return api
      .get("/dashboard")
      .then((res) => {
        if (isMounted.current) {
          setData(res.data?.data || null);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(apiErrorMessage(err, "Could not load dashboard data."));
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mb-6">Welcome back!</p>
        <SkeletonStatCards count={6} />
        <SkeletonCard className="mt-8" lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const recentEnquiries = data?.recentEnquiries || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Welcome back!</p>

      <section aria-label="Primary Overview Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatCard
            icon={<ClipboardList size={18} />}
            label="Total Bookings"
            value={data?.totalBookings ?? 0}
            color="blue"
            link={adminPath("/bookings")}
          />
          <AdminStatCard
            icon={<Clock size={18} />}
            label="Pending Bookings"
            value={data?.pendingBookings ?? 0}
            color="amber"
            link={adminPath("/bookings")}
          />
          <AdminStatCard
            icon={<CheckCircle2 size={18} />}
            label="Completed Bookings"
            value={data?.completedBookings ?? 0}
            color="green"
            link={adminPath("/bookings")}
          />
          <AdminStatCard
            icon={<Calendar size={18} />}
            label="Total Enquiries"
            value={data?.totalEnquiries ?? 0}
            color="purple"
            link={adminPath("/enquiries")}
          />
          <AdminStatCard
            icon={<MessageSquare size={18} />}
            label="New Enquiries"
            value={data?.newEnquiries ?? 0}
            color="red"
            link={adminPath("/enquiries")}
          />
          <AdminStatCard
            icon={<Mail size={18} />}
            label="Today's Bookings"
            value={data?.todaysBookings ?? 0}
            color="gray"
            link={adminPath("/bookings")}
          />
          <AdminStatCard
            icon={<Briefcase size={18} />}
            label="Active Services"
            value={data?.activeServices ?? 0}
            color="green"
            link={adminPath("/services")}
          />
          <AdminStatCard
            icon={<Car size={18} />}
            label="Active Vehicles"
            value={data?.activeVehicles ?? 0}
            color="blue"
            link={adminPath("/vehicles")}
          />
        </div>
      </section>

      <section
        className="bg-white rounded-xl border border-gray-100 mt-8 overflow-hidden shadow-sm"
        aria-label="Recent Enquiries"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Enquiries</h2>
          <Link
            to={adminPath("/enquiries")}
            className="text-brand-red text-sm font-semibold hover:underline"
          >
            View all →
          </Link>
        </div>

        <div>
          {recentEnquiries.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentEnquiries.map((e) => {
                const formattedDate =
                  e.createdAt && !isNaN(new Date(e.createdAt).getTime())
                    ? new Date(e.createdAt).toLocaleString()
                    : "—";

                return (
                  <div
                    key={e._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition"
                  >
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {e.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {e.mobile || "—"}
                      </div>
                    </div>
                    <StatusBadge status={e.status || "Pending"} />
                    <div className="text-xs text-gray-400">{formattedDate}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No enquiries yet"
                message="New enquiries from the contact form will show up here."
                icon={Mail}
              />
            </div>
          )}
        </div>
      </section>

      <section className="mt-8" aria-label="Resource Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatCard
            icon={<Mail size={18} />}
            label="Total Enquiries"
            value={data?.totalEnquiries ?? 0}
            color="blue"
            link={adminPath("/enquiries")}
          />
          <AdminStatCard
            icon={<Car size={18} />}
            label="Total Vehicles"
            value={data?.totalVehicles ?? 0}
            color="green"
            link={adminPath("/vehicles")}
          />
          <AdminStatCard
            icon={<Briefcase size={18} />}
            label="Total Drivers"
            value={data?.totalDrivers ?? 0}
            color="amber"
            link={adminPath("/drivers")}
          />
        </div>
      </section>
    </div>
  );
}
