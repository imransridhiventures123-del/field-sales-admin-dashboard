// FILE: src/pages/EmployeeDetailPage.jsx
// OWNER: Imran
// PURPOSE: Full profile of one employee
//   - Personal info (name, ID, mobile, DOB, address, salary)
//   - Online/Offline status + last seen
//   - Today's visit list
//   - Weekly performance bar chart
//   - Target progress
//   - Follow-up summary
//
// ADD ROUTE in App.jsx:
//   import EmployeeDetailPage from "./pages/EmployeeDetailPage";
//   <Route path="/sales-team/:id" element={<AdminPrivateRoute><EmployeeDetailPage /></AdminPrivateRoute>} />

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate, formatTime, formatDateTime, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR, getInitials } from "../utils/helpers";

// ── DUMMY DATA — replace with getEmployeeById(id) API call ──
const DUMMY_EMPLOYEES = {
  "e1": {
    _id:         "e1",
    name:        "Rakesh Kumar",
    employeeId:  "EMP001",
    mobile:      "9876543210",
    email:       "rakesh@maavu.com",
    dob:         "1995-06-15",
    age:         30,
    address:     "45 Gandhi Street, Adyar, Chennai - 600020",
    aadhaar:     "XXXX XXXX 1234",
    pan:         "ABCDE1234F",
    salary:      28000,
    role:        "employee",
    status:      "Online",
    joinedAt:    "2025-01-10T09:00:00.000Z",
    photo:       null,
    lastSeen:    new Date().toISOString(),
    currentLocation: { lat: 13.0082, lng: 80.2574, accuracy: 15 },
    stats: {
      todayVisits:   8,
      target:        20,
      weeklyDone:    67,
      weeklyTarget:  100,
      monthlyDone:   240,
      monthlyTarget: 400,
      totalVisits:   412,
      successRate:   82,
    },
    weeklyData: [8, 12, 15, 10, 14, 8, 0], // Mon–Sun
    todayVisits: [
      { _id:"v1", shopName:"Annas Provision Store", shopCode:"AP001", ownerName:"Annas",  fieldType:"Field Sales", followUpStatus:"interested",   status:"Completed", createdAt:new Date(Date.now()-7200000).toISOString() },
      { _id:"v2", shopName:"Big Bazaar",            shopCode:"BB001", ownerName:"Ravi",   fieldType:"Collection",  followUpStatus:"payment_due",  status:"Completed", createdAt:new Date(Date.now()-5400000).toISOString() },
      { _id:"v3", shopName:"Sri Murugan Stores",    shopCode:"SM001", ownerName:"Murugan",fieldType:"Field Sales", followUpStatus:"callback",     status:"Pending",   createdAt:new Date(Date.now()-3600000).toISOString() },
      { _id:"v4", shopName:"Kumar Stores",          shopCode:"KS001", ownerName:"Kumar",  fieldType:"Collection",  followUpStatus:"order_placed", status:"Completed", createdAt:new Date(Date.now()-1800000).toISOString() },
      { _id:"v5", shopName:"Daily Fresh Mart",      shopCode:"DF001", ownerName:"Rajan",  fieldType:"Field Sales", followUpStatus:"interested",   status:"Completed", createdAt:new Date(Date.now()-900000).toISOString() },
    ],
    followupSummary: { interested:3, callback:1, order_placed:1, payment_due:2, not_interested:1 },
  },
  "e2": {
    _id:"e2", name:"Naveen S", employeeId:"EMP002", mobile:"9876543211", email:"naveen@maavu.com",
    dob:"1998-03-22", age:27, address:"12 Anna Salai, T Nagar, Chennai - 600017",
    aadhaar:"XXXX XXXX 5678", pan:"FGHIJ5678K", salary:24000, role:"employee", status:"Online",
    joinedAt:"2025-02-15T09:00:00.000Z", photo:null, lastSeen:new Date(Date.now()-300000).toISOString(),
    currentLocation:{ lat:13.0418, lng:80.2341, accuracy:22 },
    stats:{ todayVisits:5, target:20, weeklyDone:45, weeklyTarget:100, monthlyDone:180, monthlyTarget:400, totalVisits:198, successRate:74 },
    weeklyData:[5,8,10,7,9,6,0],
    todayVisits:[
      { _id:"v6", shopName:"Fresh Market",    shopCode:"FM001", ownerName:"Suresh", fieldType:"Field Sales", followUpStatus:"callback",   status:"Completed", createdAt:new Date(Date.now()-3600000).toISOString() },
      { _id:"v7", shopName:"Value Mart",      shopCode:"VM001", ownerName:"Vinod",  fieldType:"Collection",  followUpStatus:"payment_due",status:"Completed", createdAt:new Date(Date.now()-1800000).toISOString() },
    ],
    followupSummary:{ interested:1, callback:2, order_placed:0, payment_due:1, not_interested:1 },
  },
};

const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function EmployeeDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [tab, setTab] = useState("visits"); // visits | info | performance

  const emp = DUMMY_EMPLOYEES[id];

  // If employee not found
  if (!emp) {
    return (
      <AdminLayout title="Employee Detail">
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Employee not found.</p>
          <button onClick={() => navigate("/sales-team")} className="mt-4 text-blue-600 text-sm font-medium">← Back to Sales Team</button>
        </div>
      </AdminLayout>
    );
  }

  const { stats, weeklyData, todayVisits, followupSummary } = emp;
  const maxWeekly   = Math.max(...weeklyData, 1);
  const todayPct    = Math.round((stats.todayVisits   / stats.target)        * 100);
  const weeklyPct   = Math.round((stats.weeklyDone    / stats.weeklyTarget)  * 100);
  const monthlyPct  = Math.round((stats.monthlyDone   / stats.monthlyTarget) * 100);

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
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${emp.status === "Online" ? "bg-green-500" : "bg-gray-400"}`}/>
          </div>

          {/* Name + basic info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{emp.name}</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{emp.employeeId}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${STATUS_COLOR[emp.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${emp.status==="Online" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}/>
                {emp.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                +91 {emp.mobile}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Joined {formatDate(emp.joinedAt)}
              </span>
              {emp.status === "Online" && emp.currentLocation && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Live · ±{emp.currentLocation.accuracy}m
                </span>
              )}
              {emp.status === "Offline" && (
                <span className="text-gray-400 text-xs">Last seen: {formatDateTime(emp.lastSeen)}</span>
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
              <span className="text-sm font-bold text-blue-600">{stats.todayVisits} / {stats.target} shops</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${todayPct>=100 ? "bg-green-500" : todayPct>=60 ? "bg-blue-500" : "bg-amber-400"}`}
                style={{width:`${Math.min(todayPct,100)}%`}}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-gray-400">{todayPct}% complete</p>
              <p className="text-xs text-gray-400">{stats.target - stats.todayVisits} remaining</p>
            </div>
          </div>

          {todayVisits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No visits recorded today yet.
            </div>
          ) : (
            todayVisits.map((visit) => (
              <div key={visit._id}
                onClick={() => navigate(`/all-visits/${visit._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{visit.shopName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{visit.shopCode} · {visit.ownerName}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${STATUS_COLOR[visit.status]}`}>
                    {visit.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${visit.fieldType==="Field Sales" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {visit.fieldType}
                  </span>
                  {visit.followUpStatus && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[visit.followUpStatus]}`}>
                      {FOLLOWUP_LABEL[visit.followUpStatus]}
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
              { label:"Daily",   done:stats.todayVisits,  target:stats.target,        pct:todayPct   },
              { label:"Weekly",  done:stats.weeklyDone,   target:stats.weeklyTarget,  pct:weeklyPct  },
              { label:"Monthly", done:stats.monthlyDone,  target:stats.monthlyTarget, pct:monthlyPct },
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
                const isToday = i === new Date().getDay() - 1;
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(followupSummary).map(([key, count]) => (
                <div key={key} className={`rounded-xl px-4 py-3 flex items-center justify-between ${FOLLOWUP_COLOR[key]}`}>
                  <span className="text-xs font-medium">{FOLLOWUP_LABEL[key]}</span>
                  <span className="text-base font-bold ml-2">{count}</span>
                </div>
              ))}
            </div>
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
                ["Full Name",    emp.name],
                ["Employee ID", emp.employeeId],
                ["Mobile",      `+91 ${emp.mobile}`],
                ["Email",       emp.email],
                ["Date of Birth",formatDate(emp.dob)],
                ["Age",         `${emp.age} years`],
                ["Address",     emp.address],
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
                ["Salary",        `₹${Number(emp.salary).toLocaleString("en-IN")}/month`],
                ["Role",          emp.role.charAt(0).toUpperCase() + emp.role.slice(1)],
                ["Joined",        formatDate(emp.joinedAt)],
                ["Total Visits",  emp.stats.totalVisits],
                ["Success Rate",  `${emp.stats.successRate}%`],
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
                ["Aadhaar", emp.aadhaar],
                ["PAN",     emp.pan],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-5 py-3.5 gap-4">
                  <p className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</p>
                  <p className="text-sm text-gray-800 font-medium font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live location (if online) */}
          {emp.status === "Online" && emp.currentLocation && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                Live Location
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-green-600">Latitude</p><p className="font-mono font-medium text-green-900">{emp.currentLocation.lat.toFixed(6)}</p></div>
                <div><p className="text-xs text-green-600">Longitude</p><p className="font-mono font-medium text-green-900">{emp.currentLocation.lng.toFixed(6)}</p></div>
                <div><p className="text-xs text-green-600">Accuracy</p><p className="font-medium text-green-900">±{emp.currentLocation.accuracy}m</p></div>
                <div><p className="text-xs text-green-600">Updated</p><p className="font-medium text-green-900">Just now</p></div>
              </div>
            </div>
          )}

        </div>
      )}

    </AdminLayout>
  );
}