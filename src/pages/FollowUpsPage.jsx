// FILE: src/pages/FollowUpsPage.jsx — OWNER: Naveen
// CHANGE: Removed DUMMY data. Loads real follow-ups from
// GET /api/admin/visits/followups (todayFollowups + upcomingFollowups,
// computed live on the backend from Visit.followUp).

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";
import { getFollowUps } from "../api/visitsApi";

export default function FollowUpsPage() {
  const navigate = useNavigate();
  const [todayItems, setTodayItems]       = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    let active = true;
    getFollowUps()
      .then((data) => {
        if (!active) return;
        setTodayItems(data.todayFollowups || []);
        setUpcomingItems(data.upcomingFollowups || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Follow-ups fetch error:", err.message);
        setError("Could not load follow-ups. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Follow-ups">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Follow-ups">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      {todayItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-3">🔔 {todayItems.length} Follow-up{todayItems.length>1?"s":""} Due Today</p>
          <div className="space-y-2">
            {todayItems.map(f => (
              <div key={f._id} onClick={() => navigate(`/visits/${f._id}`)}
                className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:border-amber-300 transition">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.shopName}</p>
                  <p className="text-xs text-gray-400">{f.ownerName || "—"} · +91 {f.mobile || "—"} · {f.employee?.name || "—"}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[f.followUp?.status]}`}>{FOLLOWUP_LABEL[f.followUp?.status] || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming Follow-ups</h2>
        </div>
        {upcomingItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No upcoming follow-ups scheduled.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcomingItems.map(f => (
              <div key={f._id} onClick={() => navigate(`/visits/${f._id}`)}
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.shopName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">+91 {f.mobile || "—"} · {f.employee?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[f.followUp?.status]}`}>{FOLLOWUP_LABEL[f.followUp?.status] || "—"}</span>
                  <span className="text-xs text-gray-400">{formatDate(f.followUp?.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}