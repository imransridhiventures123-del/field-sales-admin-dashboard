// FILE: src/components/DistributorAdminSidebar.jsx
// NEW FILE — Feature: two Admin Dashboard login types. This is a
// completely SEPARATE sidebar from the field-sales Sidebar.jsx (which
// is untouched apart from removing the "Distributors" group that used
// to live inside it — see App.jsx/Sidebar.jsx notes). Only accounts
// that log in with role "distributor_admin" ever see this. Premium dark
// theme (deep slate + teal accent), inspired by the structural pattern
// of the reference screenshot (fixed sidebar + fixed top bar) but with
// its own distinct color identity, not a copy.
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV = [
  { path: "/distributor-admin/dashboard", label: "Dashboard", end: true,
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/distributor-admin/all", label: "All Distributors", end: true,
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
  { path: "/distributor-admin/add", label: "Add Distributor", end: true,
    icon: "M12 4v16m8-8H4" },
  { path: "/distributor-admin/map", label: "Distributors Map", end: true,
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { path: "/distributor-admin/daily-requirement", label: "Daily Requirement", end: true,
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  // NEW (additive) — Feature: real-time distributor workflow
  { path: "/distributor-admin/products", label: "Products & Rates", end: true,
    icon: "M20.59 13.41L13.42 20.6a2 2 0 01-2.83 0L2.5 12.5V2h10.5l8.59 8.59a2 2 0 010 2.83zM7 7h.01" },
  // NEW — Feature: distributor bills + ledger (what distributors owe the company)
  { path: "/distributor-admin/ledger", label: "Distributor Ledger", end: true,
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

export default function DistributorAdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="w-64 min-h-screen bg-slate-900 flex flex-col flex-shrink-0 border-r border-slate-800">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base font-bold">S</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Sridhi Distributors</p>
            <p className="text-slate-400 text-[11px]">Distributor Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-teal-600/20 text-teal-300 border border-teal-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {admin?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "DA"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{admin?.name || "Distributor Admin"}</p>
            <p className="text-slate-400 text-[11px] truncate">{admin?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-xl text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}