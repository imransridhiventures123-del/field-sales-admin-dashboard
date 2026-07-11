// FILE: src/pages/SalesReportsPage.jsx
// NEW FILE — Feature 3: "Sales Reports"
// Shows how many kg were sold today/this month vs the previous period,
// a payment-method pie chart, and lets you download a Daily or Monthly
// PDF report. PDF generation runs entirely on the frontend with jsPDF
// (same library ReportsPage.jsx already uses) — no new backend dependency.
import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";
import { getDailySalesReport, getMonthlySalesReport } from "../api/salesReportApi";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

// ─── Simple dependency-free SVG pie chart ─────────────────
function PieChart({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2;
  let angle = -90; // start at 12 o'clock

  const arcs = data.filter(d => d.value > 0).map((d, i) => {
    const slice = total > 0 ? (d.value / total) * 360 : 0;
    const start = angle;
    const end = angle + slice;
    angle = end;
    const large = slice > 180 ? 1 : 0;
    const toXY = (deg) => {
      const rad = (deg * Math.PI) / 180;
      return [r + r * Math.cos(rad), r + r * Math.sin(rad)];
    };
    const [x1, y1] = toXY(start);
    const [x2, y2] = toXY(end);
    const path = total > 0
      ? `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
      : "";
    return <path key={i} d={path} fill={d.color} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0
        ? <circle cx={r} cy={r} r={r - 1} fill="#F3F4F6" />
        : arcs}
    </svg>
  );
}

function Legend({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
          <span className="text-gray-600 flex-1">{d.label}</span>
          <span className="font-semibold text-gray-900">₹{fmt(d.value)}</span>
          <span className="text-gray-400 w-10 text-right">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

function ChangeBadge({ changePercent, changeKg }) {
  const up = changeKg >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {up ? "▲" : "▼"} {Math.abs(changePercent)}% ({up ? "+" : ""}{changeKg}kg)
    </span>
  );
}

function addHeader(doc, title, rangeLabel) {
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(rangeLabel, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);
}

export default function SalesReportsPage() {
  const [period, setPeriod] = useState("day"); // "day" | "month"
  const [date, setDate]     = useState(today());
  const [month, setMonth]   = useState(thisMonth());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    const fn = period === "day" ? getDailySalesReport(date) : getMonthlySalesReport(month);
    fn.then(setReport)
      .catch(e => { console.error(e); setError("Could not load this report."); })
      .finally(() => setLoading(false));
  }, [period, date, month]);

  useEffect(load, [load]);

  const downloadDailyPdf = () => {
    if (!report) return;
    setDownloading(true);
    try {
      const doc = new jsPDF();
      addHeader(doc, "Daily Sales Report", formatDate(report.date));
      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.text(`Total KG sold today: ${report.totalKg}kg  (vs yesterday: ${report.previousDayKg}kg, ${report.changeKg >= 0 ? "+" : ""}${report.changeKg}kg / ${report.changePercent}%)`, 14, 40);
      doc.text(`Total billed: Rs.${fmt(report.totalAmount)}   Cash: Rs.${fmt(report.cashCollected)}   GPay: Rs.${fmt(report.gpayCollected)}   Pending: Rs.${fmt(report.pendingAmount)}`, 14, 47);
      autoTable(doc, {
        startY: 55,
        head: [["Shop", "Owner", "Phone", "Qty (kg)", "Status", "Payment", "Received"]],
        body: report.deliveries.length ? report.deliveries.map(d => [
          d.shopName, d.ownerName, d.phone, d.quantity, d.status,
          d.status === "completed" ? d.paymentType : "—",
          d.status === "completed" ? `Rs.${fmt(d.amountReceived)}` : "—",
        ]) : [["No deliveries recorded for this day.", "", "", "", "", "", ""]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      doc.save(`daily-sales-report_${report.date}.pdf`);
    } finally { setDownloading(false); }
  };

  const downloadMonthlyPdf = () => {
    if (!report) return;
    setDownloading(true);
    try {
      const doc = new jsPDF();
      addHeader(doc, "Monthly Sales Report", report.month);
      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.text(`Total KG sold this month: ${report.totalKg}kg  (vs previous month: ${report.previousMonthKg}kg, ${report.changeKg >= 0 ? "+" : ""}${report.changeKg}kg / ${report.changePercent}%)`, 14, 40);
      doc.text(`Total billed: Rs.${fmt(report.totalAmount)}   Cash: Rs.${fmt(report.cashCollected)}   GPay: Rs.${fmt(report.gpayCollected)}   Pending: Rs.${fmt(report.pendingAmount)}`, 14, 47);
      autoTable(doc, {
        startY: 55,
        head: [["Date", "KG Sold", "Amount Billed"]],
        body: report.dailyBreakdown.length ? report.dailyBreakdown.map(d => [formatDate(d.date), `${d.kg}kg`, `Rs.${fmt(d.amount)}`]) : [["No deliveries recorded this month.", "", ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      doc.save(`monthly-sales-report_${report.month}.pdf`);
    } finally { setDownloading(false); }
  };

  const paymentPieData = report ? [
    { label: "Cash",    value: report.cashCollected,  color: "#16A34A" },
    { label: "GPay",    value: report.gpayCollected,  color: "#2563EB" },
    { label: "Mixed",   value: report.mixedCollected, color: "#9333EA" },
    { label: "Pending", value: report.pendingAmount,  color: "#DC2626" },
  ] : [];

  return (
    <AdminLayout title="Sales Reports">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track kg sold per day/month and download a PDF report</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {["day", "month"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${period === p ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>
                {p === "day" ? "Daily" : "Monthly"}
              </button>
            ))}
          </div>
          {period === "day"
            ? <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            : <input type="month" value={month} max={thisMonth()} onChange={e => setMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
          }
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

      {loading || !report ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* KG summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{period === "day" ? "KG Sold Today" : "KG Sold This Month"}</p>
            <p className="text-4xl font-bold text-gray-900">{report.totalKg}<span className="text-lg text-gray-400 ml-1">kg</span></p>
            <div className="mt-3">
              <ChangeBadge changePercent={report.changePercent} changeKg={report.changeKg} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              vs {period === "day" ? `yesterday (${report.previousDayKg}kg)` : `previous month (${report.previousMonthKg}kg)`}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Total Billed</p><p className="text-sm font-bold text-gray-900">₹{fmt(report.totalAmount)}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Completed</p><p className="text-sm font-bold text-gray-900">{report.completedCount ?? "—"}</p></div>
            </div>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4 self-start">Payment Collection Split</p>
            <PieChart data={paymentPieData} />
            <div className="w-full mt-5"><Legend data={paymentPieData} /></div>
          </div>

          {/* Download */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Export Report</p>
            <p className="text-sm text-gray-500 flex-1">
              {period === "day"
                ? `Download a PDF with every delivery for ${formatDate(report.date)}, plus the kg and collection totals shown here.`
                : `Download a PDF with the day-by-day kg breakdown for ${report.month}, plus the month's totals.`}
            </p>
            <button
              disabled={downloading}
              onClick={period === "day" ? downloadDailyPdf : downloadMonthlyPdf}
              className="mt-4 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" /></svg>
              {downloading ? "Generating..." : `Download ${period === "day" ? "Daily" : "Monthly"} PDF`}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}