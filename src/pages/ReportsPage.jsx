// FILE: src/pages/ReportsPage.jsx — OWNER: Naveen
// CHANGE: The old "Download PDF" button had no onClick at all — nothing
// happened when clicked. Reports now pull real data from the backend and
// generate an actual PDF (via jsPDF), for a Day / Week / Month range you
// pick per report:
//   - Day   -> just that one date
//   - Week  -> the Mon–Sun week containing the picked date (7 days)
//   - Month -> the full calendar month containing the picked date
// Shop Visit History is always the complete all-time database (matches
// its own description), so it has no range picker.

import { useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import AdminLayout from "../components/AdminLayout";
import { formatDate, FOLLOWUP_LABEL } from "../utils/helpers";
import { getAllVisits, getShops } from "../api/visitsApi";
import { getEmployees } from "../api/employeesApi";

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Turns a period ("day" | "week" | "month") + an anchor date into the
// actual startDate/endDate to query, plus a human label for the PDF header.
function getRange(period, anchorStr) {
  const anchor = anchorStr ? new Date(anchorStr) : new Date();

  if (period === "week") {
    const monday = getMonday(anchor);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return {
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
      label: `Week of ${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }

  if (period === "month") {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const monthEnd   = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return {
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
      label: monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  }

  // day
  const iso = anchor.toISOString().split("T")[0];
  return {
    startDate: iso,
    endDate: iso,
    label: anchor.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  };
}

// Consistent title block for every generated PDF
function addHeader(doc, title, rangeLabel) {
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(rangeLabel, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);
}

const REPORTS = [
  {
    id: "daily-visits",
    name: "Visit Report",
    desc: "All visits in the selected range with shop details and follow-up status",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    rangeAware: true,
  },
  {
    id: "employee-performance",
    name: "Employee Performance",
    desc: "Target vs achieved visits per employee for the selected day/week/month",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10",
    rangeAware: true,
  },
  {
    id: "followups",
    name: "Follow-up Report",
    desc: "All pending and completed follow-ups in the selected range with telecaller assignment",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    rangeAware: true,
  },
  {
    id: "shop-history",
    name: "Shop Visit History",
    desc: "Complete shop database with all-time visit history and owner contacts",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5",
    rangeAware: false,
  },
];

export default function ReportsPage() {
  const [periods, setPeriods] = useState({}); // { [reportId]: "day"|"week"|"month" }
  const [dates, setDates]     = useState({}); // { [reportId]: "YYYY-MM-DD" }
  const [busy, setBusy]       = useState({}); // { [reportId]: boolean }
  const [errors, setErrors]   = useState({}); // { [reportId]: string|null }

  const today = new Date().toISOString().split("T")[0];
  const getPeriod  = (id) => periods[id] || "day";
  const getDateVal = (id) => dates[id] || today;
  const setPeriod  = (id, val) => setPeriods((p) => ({ ...p, [id]: val }));
  const setDateVal = (id, val) => setDates((d) => ({ ...d, [id]: val }));

  const runReport = async (report, fn) => {
    setBusy((b) => ({ ...b, [report.id]: true }));
    setErrors((e) => ({ ...e, [report.id]: null }));
    try {
      await fn();
    } catch (err) {
      console.error(`${report.name} generation error:`, err.message);
      setErrors((e) => ({ ...e, [report.id]: "Could not generate this report. Please try again." }));
    } finally {
      setBusy((b) => ({ ...b, [report.id]: false }));
    }
  };

  const downloadDailyVisits = (report) => runReport(report, async () => {
    const { startDate, endDate, label } = getRange(getPeriod(report.id), getDateVal(report.id));
    const data = await getAllVisits({ startDate, endDate, limit: 2000 });
    const visits = data.visits || [];

    const doc = new jsPDF();
    addHeader(doc, "Daily Visit Report", label);
    autoTable(doc, {
      startY: 36,
      head: [["Date", "Shop", "Owner", "Mobile", "Employee", "Type", "Status", "Follow-up"]],
      body: visits.length ? visits.map((v) => [
        formatDate(v.createdAt),
        v.shopName || "—",
        v.ownerName || "—",
        v.mobile || "—",
        v.employee?.name || "—",
        v.fieldType || "—",
        v.status || "—",
        v.followUp?.status ? (FOLLOWUP_LABEL[v.followUp.status] || v.followUp.status) : "—",
      ]) : [["No visits found for this range.", "", "", "", "", "", "", ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`visit-report_${startDate}_to_${endDate}.pdf`);
  });

  const downloadEmployeePerformance = (report) => runReport(report, async () => {
    const period = getPeriod(report.id);
    const { startDate, endDate, label } = getRange(period, getDateVal(report.id));
    const [empData, visitData] = await Promise.all([
      getEmployees(),
      getAllVisits({ startDate, endDate, limit: 5000 }),
    ]);
    const employees = empData.employees || [];
    const visits = visitData.visits || [];

    const achievedMap = {};
    visits.forEach((v) => {
      const empId = v.employee?._id;
      if (!empId) return;
      achievedMap[empId] = (achievedMap[empId] || 0) + 1;
    });

    const targetKey = period === "day" ? "dailyTarget" : period === "week" ? "weeklyTarget" : "monthlyTarget";

    const doc = new jsPDF();
    addHeader(doc, "Employee Performance Report", label);
    autoTable(doc, {
      startY: 36,
      head: [["Employee", "Employee ID", "Target", "Achieved", "Achievement %"]],
      body: employees.length ? employees.map((emp) => {
        const target   = emp[targetKey] || 0;
        const achieved = achievedMap[emp._id] || 0;
        const pct      = target > 0 ? Math.round((achieved / target) * 100) : 0;
        return [emp.name, emp.employeeId, target, achieved, `${pct}%`];
      }) : [["No employees registered yet.", "", "", "", ""]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`employee-performance_${startDate}_to_${endDate}.pdf`);
  });

  const downloadFollowUps = (report) => runReport(report, async () => {
    const { startDate, endDate, label } = getRange(getPeriod(report.id), getDateVal(report.id));
    const data = await getAllVisits({ startDate, endDate, limit: 5000 });
    const followups = (data.visits || []).filter((v) => v.followUp?.needed || v.followUp?.status);

    const doc = new jsPDF();
    addHeader(doc, "Follow-up Report", label);
    autoTable(doc, {
      startY: 36,
      head: [["Shop", "Owner", "Mobile", "Employee", "Follow-up Status", "Follow-up Date", "Visit Status"]],
      body: followups.length ? followups.map((v) => [
        v.shopName || "—",
        v.ownerName || "—",
        v.mobile || "—",
        v.employee?.name || "—",
        v.followUp?.status ? (FOLLOWUP_LABEL[v.followUp.status] || v.followUp.status) : "—",
        v.followUp?.date ? formatDate(v.followUp.date) : "—",
        v.status || "—",
      ]) : [["No follow-ups found for this range.", "", "", "", "", "", ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`followup-report_${startDate}_to_${endDate}.pdf`);
  });

  const downloadShopHistory = (report) => runReport(report, async () => {
    const data = await getShops();
    const shops = data.shops || [];

    const doc = new jsPDF();
    addHeader(doc, "Shop Visit History", "Complete database — all time");
    autoTable(doc, {
      startY: 36,
      head: [["Shop", "Code", "Owner", "Mobile", "Address", "Total Visits", "Last Visit", "Last Follow-up"]],
      body: shops.length ? shops.map((s) => [
        s.shopName || "—",
        s.shopCode || "—",
        s.ownerName || "—",
        s.mobile || "—",
        s.address || "—",
        s.totalVisits,
        s.lastVisit ? formatDate(s.lastVisit) : "—",
        s.lastFollowUp ? (FOLLOWUP_LABEL[s.lastFollowUp] || s.lastFollowUp) : "—",
      ]) : [["No shops recorded yet.", "", "", "", "", "", "", ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save("shop-visit-history.pdf");
  });

  const HANDLERS = {
    "daily-visits": downloadDailyVisits,
    "employee-performance": downloadEmployeePerformance,
    "followups": downloadFollowUps,
    "shop-history": downloadShopHistory,
  };

  return (
    <AdminLayout title="Reports">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-xs text-amber-700">
        📎 Pick Day / Week / Month for each report below, then download a real PDF built from live data.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => {
          const isBusy   = !!busy[r.id];
          const errorMsg = errors[r.id];
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon}/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{r.name}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{r.desc}</p>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">{errorMsg}</p>
              )}

              {r.rangeAware ? (
                <>
                  <div className="flex gap-2 mt-4">
                    {["day", "week", "month"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(r.id, p)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition border ${
                          getPeriod(r.id) === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={isBusy}
                      onClick={() => HANDLERS[r.id](r)}
                      className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3"/></svg>
                      {isBusy ? "Generating..." : "Download PDF"}
                    </button>
                    <input
                      type="date"
                      value={getDateVal(r.id)}
                      max={today}
                      onChange={(e) => setDateVal(r.id, e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-300 transition"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {getPeriod(r.id) === "day"   && "Covers the selected day only."}
                    {getPeriod(r.id) === "week"  && "Covers the Mon–Sun week containing the selected date (7 days)."}
                    {getPeriod(r.id) === "month" && "Covers the full calendar month containing the selected date."}
                  </p>
                </>
              ) : (
                <div className="flex gap-2 mt-4 items-center">
                  <button
                    disabled={isBusy}
                    onClick={() => HANDLERS[r.id](r)}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3"/></svg>
                    {isBusy ? "Generating..." : "Download PDF"}
                  </button>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">Always all-time</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}