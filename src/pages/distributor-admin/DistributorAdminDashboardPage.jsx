// FILE: src/pages/distributor-admin/DistributorAdminDashboardPage.jsx
// NEW FILE — Feature: two Admin Dashboard login types. The landing page
// after a "Distributors" login. Unlike the PWA's HomePage (still dummy
// data, by your instruction), this page pulls REAL, live data from your
// existing, unchanged APIs (getAllDistributors, getAllBatterRequests) —
// no new backend endpoint, no dummy numbers.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import GradientStatCard from "../../components/GradientStatCard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getAllDistributors } from "../../api/distributorApi";
import { getAllBatterRequests } from "../../api/batterRequestApi";
import { getAdminTodayStatus } from "../../api/deliveryApi";

export default function DistributorAdminDashboardPage() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [distributors, setDistributors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  // NEW — today's shops ordered vs delivered (all distributors)
  const [today, setToday] = useState(null);

  useEffect(() => {
    Promise.all([getAllDistributors(), getAllBatterRequests({ status: "pending" }), getAdminTodayStatus().catch(() => null)])
      .then(([d, r, t]) => {
        setDistributors(d.distributors || []);
        setPendingRequests(r.requests || []);
        setToday(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCustomers = distributors.reduce((s, d) => s + (d.customerCount || 0), 0);
  const activeCount = distributors.filter((d) => d.isActive).length;

  return (
    <DistributorAdminLayout title="Dashboard" subtitle="Distributor operations overview">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 p-6 mb-6 text-white">
        <svg className="absolute right-4 bottom-0 w-40 h-40 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
        <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-medium mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> All systems operational
        </span>
        <h1 className="text-2xl font-bold mb-1">Good Morning, {admin?.name?.split(" ")[0] || "Admin"} 👋</h1>
        <p className="text-teal-100 text-sm max-w-lg mb-4">
          Monitor distributor zones, approve daily batter requirements, and keep every customer's deliveries on track — all from one dashboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/distributor-admin/add")} className="bg-white text-teal-800 px-4 py-2 rounded-xl text-sm font-semibold">
            + Add Distributor
          </button>
          <button onClick={() => navigate("/distributor-admin/daily-requirement")} className="bg-white/15 border border-white/30 px-4 py-2 rounded-xl text-sm font-semibold">
            View Daily Requirements
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GradientStatCard
          color="teal" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
          label="Total Distributors" value={loading ? "…" : distributors.length} subtext="Live from your database"
        />
        <GradientStatCard
          color="green" icon="M5 13l4 4L19 7"
          label="Active" value={loading ? "…" : activeCount} subtext={`${distributors.length ? Math.round((activeCount / distributors.length) * 100) : 0}% currently active`}
        />
        <GradientStatCard
          color="purple" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          label="Customers Assigned" value={loading ? "…" : totalCustomers} subtext="Across all zones"
        />
        <GradientStatCard
          color="orange" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          label="Pending Requests" value={loading ? "…" : pendingRequests.length} subtext="Awaiting your approval"
        />
      </div>

      {/* NEW — today's shops: how many shops had an order taken, how many were delivered */}
      <div className="mb-6">
        <p className="font-semibold text-gray-800 mb-3">Today's Shops</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <GradientStatCard
            color="teal" icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"
            label="Shops Ordered" value={loading ? "…" : !today ? "—" : today.totals.shopsOrdered} subtext="Orders taken today"
          />
          <GradientStatCard
            color="green" icon="M5 13l4 4L19 7"
            label="Delivery Completed" value={loading ? "…" : !today ? "—" : today.totals.shopsDelivered} subtext={today ? `of ${today.totals.shopsOrdered} shops` : ""}
          />
          <GradientStatCard
            color="orange" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            label="Still Pending" value={loading ? "…" : !today ? "—" : today.totals.shopsPending} subtext={today ? `${today.totals.shopsSkipped} skipped` : ""}
          />
          <GradientStatCard
            color="purple" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8"
            label="Collected Today" value={loading ? "…" : !today ? "—" : `₹${today.totals.cashCollected + today.totals.onlineCollected}`}
            subtext={today ? `Cash ₹${today.totals.cashCollected} · GPay ₹${today.totals.onlineCollected} · Credit ₹${today.totals.creditGiven}` : ""}
          />
        </div>

        {today && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Distributor</th>
                  <th className="text-right px-3 py-3 font-medium">Ordered</th>
                  <th className="text-right px-3 py-3 font-medium">Delivered</th>
                  <th className="text-right px-3 py-3 font-medium">Pending</th>
                  <th className="text-right px-3 py-3 font-medium">Cash</th>
                  <th className="text-right px-3 py-3 font-medium">GPay</th>
                  <th className="text-right px-4 py-3 font-medium">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {today.distributors.map((d) => (
                  <tr key={d.distributorId} onClick={() => navigate(`/distributor-admin/${d.distributorId}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name} <span className="text-gray-400 font-normal text-xs">({d.employeeId})</span></td>
                    <td className="px-3 py-3 text-right text-gray-600">{d.shopsOrdered}</td>
                    <td className="px-3 py-3 text-right text-green-600 font-medium">{d.shopsDelivered}</td>
                    <td className="px-3 py-3 text-right text-amber-600">{d.shopsPending}</td>
                    <td className="px-3 py-3 text-right text-gray-600">₹{d.cashCollected}</td>
                    <td className="px-3 py-3 text-right text-gray-600">₹{d.onlineCollected}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{d.creditGiven}</td>
                  </tr>
                ))}
                {today.distributors.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No distributors yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">Today's Pending Requests</p>
          <button onClick={() => navigate("/distributor-admin/daily-requirement")} className="text-sm text-teal-600 font-medium">View All →</button>
        </div>

        {loading && <p className="text-gray-400 text-sm">Loading…</p>}
        {!loading && pendingRequests.length === 0 && <p className="text-gray-400 text-sm">No pending requests right now.</p>}

        <div className="divide-y divide-gray-50">
          {pendingRequests.slice(0, 5).map((r) => (
            <div key={r._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{r.distributor?.name} <span className="text-gray-400 font-normal">({r.distributor?.employeeId})</span></p>
                <p className="text-xs text-gray-400">{r.distributor?.zone?.name || "—"}</p>
              </div>
              <p className="text-sm text-gray-600">{r.requestedIdlyKg}kg idly / {r.requestedDosaKg}kg dosa</p>
            </div>
          ))}
        </div>
      </div>
    </DistributorAdminLayout>
  );
}