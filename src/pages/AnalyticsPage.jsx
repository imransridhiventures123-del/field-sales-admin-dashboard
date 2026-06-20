// FILE: src/pages/AnalyticsPage.jsx — OWNER: Naveen
// CHANGE: Removed all hardcoded WEEK_DATA / FOLLOWUP_D dummy arrays.
// Now loads real numbers from GET /api/admin/analytics (already built
// on the backend — same endpoint the Dashboard tab uses).

import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import StatCard    from "../components/StatCard";
import { FOLLOWUP_LABEL } from "../utils/helpers";
import { getAnalytics } from "../api/visitsApi";

// Solid bar colors per follow-up status (separate from the soft
// badge colors in helpers.js, which are tuned for pill backgrounds not bars)
const FOLLOWUP_BAR_COLOR = {
  interested:      "bg-green-500",
  callback:        "bg-blue-500",
  order_placed:    "bg-purple-500",
  payment_due:     "bg-amber-500",
  not_interested:  "bg-red-400",
  busy:            "bg-gray-400",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        if (!active) return;
        setAnalytics(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("Analytics fetch error:", err.message);
        setError("Could not load analytics. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { active = false; };
  }, []);

  if (loading || !analytics) {
    return (
      <AdminLayout title="Analytics">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  const fieldSales   = (analytics.fieldTypeBreakdown || []).find(f => f._id === "Field Sales")?.count || 0;
  const collections  = (analytics.fieldTypeBreakdown || []).find(f => f._id === "Collection")?.count || 0;
  const completed     = (analytics.statusBreakdown || []).find(s => s._id === "Completed")?.count || 0;
  const successRate   = analytics.totalVisits > 0 ? Math.round((completed / analytics.totalVisits) * 100) : 0;
  const totalTyped     = fieldSales + collections || 1;

  const weeklyData  = analytics.weeklyData || []; // [{ _id: "2026-06-14", count: 5 }, ...]
  const maxWeek     = Math.max(...weeklyData.map(d => d.count), 1);
  const dayLabel    = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const followups = (analytics.followupBreakdown || []).filter(f => f._id);
  const maxFollowup = Math.max(...followups.map(f => f.count), 1);

  return (
    <AdminLayout title="Analytics">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Visits (7 days)" value={analytics.weeklyVisits}  sub={`${analytics.totalVisits} all time`} color="blue"/>
        <StatCard label="Success Rate"          value={`${successRate}%`}      sub={`${completed} completed visits`}     color="green"/>
        <StatCard label="Field Sales"           value={fieldSales}             sub={`${Math.round((fieldSales/totalTyped)*100)}% of total`} color="purple"/>
        <StatCard label="Collections"           value={collections}            sub={`${Math.round((collections/totalTyped)*100)}% of total`} color="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly visits bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Visits — Last 7 Days</h2>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No visits recorded yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {weeklyData.map((d) => (
                <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[10px] text-gray-400">{d.count}</p>
                  <div className="w-full bg-blue-500 rounded-t-lg transition-all" style={{height:`${Math.max((d.count/maxWeek)*130, 4)}px`}}/>
                  <p className="text-[10px] text-gray-400">{dayLabel(d._id)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Follow-up Breakdown (All Time)</h2>
          {followups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No follow-ups logged yet.</p>
          ) : (
            <div className="space-y-3">
              {followups.map((item) => (
                <div key={item._id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{FOLLOWUP_LABEL[item._id] || item._id}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${FOLLOWUP_BAR_COLOR[item._id] || "bg-gray-400"} h-2 rounded-full transition-all`} style={{width:`${(item.count/maxFollowup)*100}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}