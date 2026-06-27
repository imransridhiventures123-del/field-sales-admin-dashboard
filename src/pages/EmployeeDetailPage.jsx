// FILE: src/pages/EmployeeDetailPage.jsx
// OWNER: Imran
// PURPOSE: Full profile of one employee
// CHANGE: Removed DUMMY_EMPLOYEES. Loads the real employee from
// GET /api/admin/employees/:id via getEmployeeById(id). The backend
// (adminController.js) was extended to also return monthlyDone,
// successRate and a real Mon-Sun weeklyData array for the chart.
// Note: the User model has no "email" field, so that row was dropped
// from Profile Info (it was fabricated in the old dummy data).

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate, formatTime, formatDateTime, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR, getInitials } from "../utils/helpers";
import { getEmployeeById, resetEmployeePassword } from "../api/employeesApi";

const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Password Reset Section (admin only) ─────────────────────
// Admin sets a new password for the employee.
// Password is hashed on backend — admin never sees the current hash.
function PasswordResetSection({ empId, empName }) {
  const [newPass, setNewPass]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  const handleReset = async () => {
    if (newPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      await resetEmployeePassword(empId, newPass);
      setSuccess(true);
      setNewPass("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-100">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          Reset Employee Password
        </p>
        <p className="text-xs text-amber-600 mt-1">Only use this if {empName} forgot their password and called you.</p>
      </div>
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type={showPass ? "text" : "password"}
            value={newPass}
            onChange={(e) => { setNewPass(e.target.value); setError(""); setSuccess(false); }}
            placeholder="Enter new password (min 6 chars)"
            className="w-full border border-amber-200 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-amber-400 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showPass ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            )}
          </button>
        </div>
        <button
          disabled={saving || !newPass}
          onClick={handleReset}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition flex-shrink-0"
        >
          {saving ? "Saving..." : "Reset"}
        </button>
      </div>
      {error   && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}
      {success && <p className="px-5 pb-3 text-xs text-green-600 font-semibold">✓ Password updated. Employee can now login with the new password.</p>}
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [tab, setTab] = useState("visits"); // visits | performance | info

  const [emp, setEmp]                   = useState(null);
  const [stats, setStats]               = useState(null);
  const [todayVisits, setTodayVisits]   = useState([]);
  const [weeklyData, setWeeklyData]     = useState([0,0,0,0,0,0,0]);
  const [followupSummary, setFollowupSummary] = useState({});
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  useEffect(() => {
    let active = true;
    const fetchEmployee = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getEmployeeById(id);
        if (!active) return;
        if (!data.employee) { setNotFound(true); return; }
        setEmp(data.employee);
        setStats(data.stats);
        setTodayVisits(data.todayVisitsList || []);
        setWeeklyData(data.weeklyData && data.weeklyData.length === 7 ? data.weeklyData : [0,0,0,0,0,0,0]);
        setFollowupSummary(data.followupSummary || {});
      } catch (err) {
        if (!active) return;
        console.error("Employee detail fetch error:", err.message);
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEmployee();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Employee Detail">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Loading employee...</p>
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !emp || !stats) {
    return (
      <AdminLayout title="Employee Detail">
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Employee not found.</p>
          <button onClick={() => navigate("/sales-team")} className="mt-4 text-blue-600 text-sm font-medium">← Back to Sales Team</button>
        </div>
      </AdminLayout>
    );
  }

  const status      = emp.isOnline ? "Online" : "Offline";
  const dailyTarget = emp.dailyTarget || 20;
  const maxWeekly   = Math.max(...weeklyData, 1);
  const todayPct    = Math.round((stats.todayVisits  / dailyTarget)        * 100);
  const weeklyPct   = Math.round((stats.weeklyDone   / (stats.weeklyTarget  || 100)) * 100);
  const monthlyPct  = Math.round((stats.monthlyDone  / (stats.monthlyTarget || 400)) * 100);
  const hasLocation = emp.lastLatitude != null && emp.lastLongitude != null;
  const followupEntries = Object.entries(followupSummary);

  return (
    <AdminLayout title="Employee Detail">

      {/* Back button */}
      <button
        onClick={() => navigate("/sales-team")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Sales Team
      </button>

      {/* ── PROFILE HEADER CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {emp.photo ? (
              <img src={emp.photo} alt={emp.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-100"/>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(emp.name)}
              </div>
            )}
            {/* Online/Offline indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${status === "Online" ? "bg-green-500" : "bg-gray-400"}`}/>
          </div>

          {/* Name + basic info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{emp.name}</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{emp.employeeId}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${STATUS_COLOR[status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status==="Online" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}/>
                {status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                +91 {emp.mobile}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Joined {formatDate(emp.createdAt)}
              </span>
              {status === "Online" && hasLocation && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Live · ±{emp.lastAccuracy ?? "—"}m
                </span>
              )}
              {status === "Offline" && (
                <span className="text-gray-400 text-xs">Last seen: {emp.lastSeen ? formatDateTime(emp.lastSeen) : "—"}</span>
              )}
            </div>
          </div>

          {/* Quick stat pills */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-blue-50 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-blue-600">{stats.todayVisits}</p>
              <p className="text-[11px] text-blue-400 mt-0.5">Today</p>
            </div>
            <div className="bg-green-50 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              <p className="text-[11px] text-green-400 mt-0.5">Success</p>
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-gray-700">{stats.totalVisits}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">All Time</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5 w-fit">
        {[
          { key:"visits",      label:"Today's Visits"  },
          { key:"performance", label:"Performance"     },
          { key:"info",        label:"Profile Info"    },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${tab===t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TAB 1 — TODAY'S VISITS
          ══════════════════════════════════ */}
      {tab === "visits" && (
        <div className="space-y-3">
          {/* Target progress bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Today's Target</p>
              <span className="text-sm font-bold text-blue-600">{stats.todayVisits} / {dailyTarget} shops</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${todayPct>=100 ? "bg-green-500" : todayPct>=60 ? "bg-blue-500" : "bg-amber-400"}`}
                style={{width:`${Math.min(todayPct,100)}%`}}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-gray-400">{todayPct}% complete</p>
              <p className="text-xs text-gray-400">{Math.max(dailyTarget - stats.todayVisits, 0)} remaining</p>
            </div>
          </div>

          {todayVisits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No visits recorded today yet.
            </div>
          ) : (
            todayVisits.map((visit) => (
              <div key={visit._id}
                onClick={() => navigate(`/visits/${visit._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{visit.shopName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{visit.shopCode || "—"} · {visit.ownerName || "—"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${STATUS_COLOR[visit.status]}`}>
                    {visit.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${visit.fieldType==="Field Sales" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {visit.fieldType}
                  </span>
                  {visit.followUp?.status && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[visit.followUp.status]}`}>
                      {FOLLOWUP_LABEL[visit.followUp.status]}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{formatTime(visit.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          TAB 2 — PERFORMANCE
          ══════════════════════════════════ */}
      {tab === "performance" && (
        <div className="space-y-5">

          {/* Progress cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label:"Daily",   done:stats.todayVisits, target:dailyTarget,               pct:todayPct   },
              { label:"Weekly",  done:stats.weeklyDone,  target:stats.weeklyTarget  || 100, pct:weeklyPct  },
              { label:"Monthly", done:stats.monthlyDone, target:stats.monthlyTarget || 400, pct:monthlyPct },
            ].map(p => (
              <div key={p.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">{p.label} Target</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.pct>=100 ? "bg-green-50 text-green-600" : p.pct>=60 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                    {p.pct}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                  <div className={`h-2.5 rounded-full ${p.pct>=100?"bg-green-500":p.pct>=60?"bg-blue-500":"bg-amber-400"}`}
                    style={{width:`${Math.min(p.pct,100)}%`}}/>
                </div>
                <p className="text-xs text-gray-400">{p.done} / {p.target} visits</p>
              </div>
            ))}
          </div>

          {/* Weekly bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week — Visits Per Day</h3>
            <div className="flex items-end gap-3 h-36">
              {weeklyData.map((val, i) => {
                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[10px] text-gray-400">{val || ""}</p>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isToday ? "bg-blue-600" : val > 0 ? "bg-blue-300" : "bg-gray-100"}`}
                      style={{height:`${val > 0 ? (val/maxWeekly)*120 : 8}px`}}
                    />
                    <p className={`text-[10px] ${isToday ? "text-blue-600 font-semibold" : "text-gray-400"}`}>{WEEK_DAYS[i]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-up summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Follow-up Summary (This Week)</h3>
            {followupEntries.length === 0 ? (
              <p className="text-sm text-gray-400">No follow-ups logged this week.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {followupEntries.map(([key, count]) => (
                  <div key={key} className={`rounded-xl px-4 py-3 flex items-center justify-between ${FOLLOWUP_COLOR[key]}`}>
                    <span className="text-xs font-medium">{FOLLOWUP_LABEL[key] || key}</span>
                    <span className="text-base font-bold ml-2">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════
          TAB 3 — PROFILE INFO
          ══════════════════════════════════ */}
      {tab === "info" && (
        <div className="space-y-4">

          {/* Personal details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Personal Information</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ["Full Name",     emp.name],
                ["Employee ID",   emp.employeeId],
                ["Mobile",        `+91 ${emp.mobile}`],
                ["Date of Birth", emp.dob ? formatDate(emp.dob) : "—"],
                ["Age",           emp.age ? `${emp.age} years` : "—"],
                ["Address",       emp.address || "—"],
                ["City",          emp.city || "—"],
                ["Pincode",       emp.pincode || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-5 py-3.5 gap-4">
                  <p className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</p>
                  <p className="text-sm text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Work details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Work Details</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ["Salary",        emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}/month` : "—"],
                ["Role",          emp.role ? emp.role.charAt(0).toUpperCase() + emp.role.slice(1) : "—"],
                ["Joined",        formatDate(emp.createdAt)],
                ["Total Visits",  stats.totalVisits],
                ["Success Rate",  `${stats.successRate}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-5 py-3.5 gap-4">
                  <p className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</p>
                  <p className="text-sm text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Identity docs (masked) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Identity Documents</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ["Aadhaar", emp.aadhaar || "—"],
                ["PAN",     emp.pan || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-5 py-3.5 gap-4">
                  <p className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</p>
                  <p className="text-sm text-gray-800 font-medium font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── PASSWORD RESET (Admin only) ── */}
          <PasswordResetSection empId={emp._id} empName={emp.name} />

          {/* Live location (if online) */}
          {status === "Online" && hasLocation && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                Live Location
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-green-600">Latitude</p><p className="font-mono font-medium text-green-900">{emp.lastLatitude.toFixed(6)}</p></div>
                <div><p className="text-xs text-green-600">Longitude</p><p className="font-mono font-medium text-green-900">{emp.lastLongitude.toFixed(6)}</p></div>
                <div><p className="text-xs text-green-600">Accuracy</p><p className="font-medium text-green-900">±{emp.lastAccuracy ?? "—"}m</p></div>
                <div><p className="text-xs text-green-600">Updated</p><p className="font-medium text-green-900">{emp.locationUpdatedAt ? formatTime(emp.locationUpdatedAt) : "—"}</p></div>
              </div>
            </div>
          )}

        </div>
      )}

    </AdminLayout>
  );
}