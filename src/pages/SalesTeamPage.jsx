// FILE: src/pages/SalesTeamPage.jsx
// OWNER: Imran
// CHANGE: Removed DUMMY data. Now loads the real field-team roster from
// GET /api/admin/employees (todayVisits / weeklyDone / totalVisits are
// computed live on the backend from the Visit collection).

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { STATUS_COLOR, getInitials } from "../utils/helpers";
import { getEmployees } from "../api/employeesApi";

export default function SalesTeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        if (!active) return;
        setEmployees(data.employees || []);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("Sales team fetch error:", err.message);
        setError("Could not load the sales team. Pull to refresh or try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEmployees();
    return () => { active = false; };
  }, []);

  // Normalize backend employee -> the shape this page renders
  const normalized = employees.map((e) => ({
    _id: e._id,
    name: e.name,
    employeeId: e.employeeId,
    mobile: e.mobile,
    status: e.isOnline ? "Online" : "Offline",
    role: e.role,
    todayVisits: e.todayVisits || 0,
    target: e.dailyTarget || 20,
    totalVisits: e.totalVisits || 0,
    joinedAt: e.createdAt,
  }));

  const filtered = normalized.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeId || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminLayout title="Sales Team">

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300"/>
        </div>
        {["All","Online","Offline"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium border transition ${filter===f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {employees.length === 0 ? "No field employees registered yet." : "No one matches your search/filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const pct = Math.round((emp.todayVisits / emp.target) * 100);
            return (
              <div key={emp._id} onClick={() => navigate(`/sales-team/${emp._id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold">
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeId}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[emp.status]}`}>
                    {emp.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Today's progress</span>
                    <span className="font-medium">{emp.todayVisits}/{emp.target} visits</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-400"}`}
                      style={{width:`${Math.min(pct,100)}%`}}/>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <span>+91 {emp.mobile}</span>
                  <span>{emp.totalVisits} total visits</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}