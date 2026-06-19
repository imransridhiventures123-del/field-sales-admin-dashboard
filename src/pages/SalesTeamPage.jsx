// FILE: src/pages/SalesTeamPage.jsx
// OWNER: Imran

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { STATUS_COLOR, getInitials } from "../utils/helpers";

const DUMMY = [
  { _id:"e1", name:"Rakesh Kumar",  employeeId:"EMP001", mobile:"9876543210", status:"Online",  role:"employee", todayVisits:8,  target:20, totalVisits:142, joinedAt:"2025-01-10" },
  { _id:"e2", name:"Naveen S",      employeeId:"EMP002", mobile:"9876543211", status:"Online",  role:"employee", todayVisits:5,  target:20, totalVisits:98,  joinedAt:"2025-02-15" },
  { _id:"e3", name:"Divya R",       employeeId:"EMP003", mobile:"9876543213", status:"Online",  role:"employee", todayVisits:6,  target:15, totalVisits:110, joinedAt:"2025-01-20" },
  { _id:"e4", name:"Murugan K",     employeeId:"EMP004", mobile:"9876543214", status:"Offline", role:"employee", todayVisits:3,  target:20, totalVisits:87,  joinedAt:"2025-03-01" },
  { _id:"e5", name:"Priya S",       employeeId:"EMP005", mobile:"9876543215", status:"Online",  role:"employee", todayVisits:7,  target:20, totalVisits:204, joinedAt:"2024-12-01" },
  { _id:"e6", name:"Rajan M",       employeeId:"EMP006", mobile:"9876543216", status:"Offline", role:"employee", todayVisits:5,  target:15, totalVisits:76,  joinedAt:"2025-04-10" },
];

export default function SalesTeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = DUMMY.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase());
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

      {/* Cards */}
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
    </AdminLayout>
  );
}