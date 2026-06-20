// FILE: src/pages/DashboardPage.jsx
// OWNER: Imran
// PURPOSE: Main overview — total stats, team status, recent visits
// CHANGE: Removed all DUMMY_* data — now loads real data from the backend

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import StatCard    from "../components/StatCard";
import { formatTime, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";
import { getEmployees } from "../api/employeesApi";
import { getAllVisits, getAnalytics, getShops } from "../api/visitsApi";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(null);
  const [employees, setEmployees] = useState([]);
  const [recent, setRecent]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analytics, empData, visitsData, shopsData] = await Promise.all([
          getAnalytics(),
          getEmployees(),
          getAllVisits({ page: 1, limit: 5 }),
          getShops(),
        ]);

        const emps = empData.employees || [];
        const weeklyTargetSum = emps.reduce((sum, e) => sum + (e.weeklyTarget || 0), 0);

        setStats({
          totalEmployees: analytics.totalEmployees,
          onlineNow:      analytics.onlineNow,
          todayVisits:    analytics.todayVisits,
          completedVisits: (analytics.statusBreakdown || []).find(s => s._id === "Completed")?.count || 0,
          weeklyTarget:   weeklyTargetSum || 1, // avoid divide-by-zero
          weeklyDone:     analytics.weeklyVisits,
          totalShops:     (shopsData.shops || []).length,
        });

        setEmployees(
          emps
            .slice()
            .sort((a, b) => (b.isOnline === a.isOnline ? b.todayVisits - a.todayVisits : b.isOnline ? 1 : -1))
            .slice(0, 6)
        );

        setRecent(visitsData.visits || []);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const weeklyPct = Math.round((stats.weeklyDone / stats.weeklyTarget) * 100);

  return (
    <AdminLayout title="Dashboard">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Sales Team"   value={stats.totalEmployees} sub={`${stats.onlineNow} online now`} color="blue"   icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
        <StatCard label="Today's Visits"     value={stats.todayVisits}    sub={`${stats.completedVisits} completed`} color="green"  icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        <StatCard label="Weekly Visits"      value={`${weeklyPct}%`}      sub={`${stats.weeklyDone}/${stats.weeklyTarget} target`} color="amber"  icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
        <StatCard label="Total Shops"        value={stats.totalShops}     sub="all time visits" color="purple" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Team status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Field Team Status</h2>
            <button onClick={() => navigate("/sales-team")} className="text-xs text-blue-600 font-medium hover:text-blue-700">View all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {employees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No employees yet.</p>
            ) : employees.map((emp) => {
              const target = emp.dailyTarget || 20;
              const pct = Math.round(((emp.todayVisits || 0) / target) * 100);
              const status = emp.isOnline ? "Online" : "Offline";
              return (
                <div key={emp._id} onClick={() => navigate(`/sales-team/${emp._id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {emp.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${STATUS_COLOR[status]}`}>{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${Math.min(pct,100)}%`}}/>
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{emp.todayVisits || 0}/{target}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent visits */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Visits</h2>
            <button onClick={() => navigate("/all-visits")} className="text-xs text-blue-600 font-medium hover:text-blue-700">View all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No visits yet.</p>
            ) : recent.map((v) => (
              <div key={v._id} onClick={() => navigate(`/all-visits/${v._id}`)}
                className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.shopName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.employee?.name || "—"} · {formatTime(v.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>{v.status}</span>
                  </div>
                </div>
                {v.followUp?.status && (
                  <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${FOLLOWUP_COLOR[v.followUp.status]}`}>
                    {FOLLOWUP_LABEL[v.followUp.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}