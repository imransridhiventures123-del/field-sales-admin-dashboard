// FILE: src/pages/DailyInvoicesPage.jsx
// NEW FILE — Daily Invoice feature. Lets the admin generate invoices only
// for customers who had an order on a given business date, see the exact
// 3-state status (generated / no order / error) per customer, and
// download PDFs — individually or all at once (no ZIP, per spec).
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getDailyInvoiceStatus, generateDailyInvoices, downloadDailyInvoice } from "../api/dailyInvoiceApi";

// IST-correct default date — a plain UTC-based toISOString().slice(0,10)
// would show yesterday's date for the first ~5.5 hours of an IST day.
const todayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

const STATUS_STYLE = {
  generated:     { label: "Generated",   color: "bg-green-100 text-green-700" },
  error:         { label: "Error",       color: "bg-red-100 text-red-600" },
  pending:       { label: "Not generated yet", color: "bg-amber-100 text-amber-700" },
  not_required:  { label: "No Order",    color: "bg-gray-100 text-gray-400" },
};

export default function DailyInvoicesPage() {
  const [date, setDate]         = useState(todayIST());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = () => {
    setLoading(true); setError("");
    getDailyInvoiceStatus(date)
      .then(setData)
      .catch(e => setError(e.response?.data?.message || "Failed to load daily invoice status."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [date]);

  const handleGenerate = async () => {
    setGenerating(true); setError("");
    try {
      const result = await generateDailyInvoices(date);
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadOne = async (inv) => {
    setDownloadingId(inv.dailyInvoiceId);
    try { await downloadDailyInvoice(inv.dailyInvoiceId, inv.pdfFileName); }
    catch (e) { console.error(e); }
    finally { setDownloadingId(null); }
  };

  // "Download Today's Invoices" — individual PDF files, deliberately NOT a
  // ZIP. Browsers can block a burst of programmatic downloads, so we
  // trigger them one at a time with a short stagger, which every major
  // browser allows without extra prompts.
  const handleDownloadAll = async () => {
    const generated = (data?.invoices || []).filter(i => i.pdfStatus === "generated");
    if (generated.length === 0) return;
    setDownloadingAll(true);
    for (const inv of generated) {
      try { await downloadDailyInvoice(inv.dailyInvoiceId, inv.pdfFileName); }
      catch (e) { console.error(e); }
      await new Promise(r => setTimeout(r, 400));
    }
    setDownloadingAll(false);
  };

  const s = data;

  return (
    <AdminLayout title="Daily Invoices">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Daily Invoices</h2>
          <p className="text-xs text-gray-400 mt-0.5">Generate invoices only for customers who ordered on this date, ready for WhatsApp sending.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Today's Invoices"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

      {loading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : s && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] text-gray-400 uppercase font-semibold">Total Customers</p><p className="text-xl font-bold text-gray-900 mt-1">{s.totalCustomers}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] text-gray-400 uppercase font-semibold">Orders Today</p><p className="text-xl font-bold text-gray-900 mt-1">{s.customersWithOrders}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] text-gray-400 uppercase font-semibold">Invoices Generated</p><p className="text-xl font-bold text-green-600 mt-1">{s.invoicesGenerated}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] text-gray-400 uppercase font-semibold">No Orders</p><p className="text-xl font-bold text-gray-400 mt-1">{s.customersWithoutOrders}</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4"><p className="text-[10px] text-gray-400 uppercase font-semibold">Errors</p><p className={`text-xl font-bold mt-1 ${s.invoicesFailed>0?"text-red-500":"text-gray-300"}`}>{s.invoicesFailed}</p></div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Invoices for {date}</p>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll || s.invoicesGenerated === 0}
              className="px-4 py-2 bg-gray-800 text-white text-xs font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40"
            >
              {downloadingAll ? "Downloading..." : `Download Today's Invoices (${s.invoicesGenerated})`}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase">
              <div className="col-span-3">Customer</div>
              <div className="col-span-3">WhatsApp Group</div>
              <div className="col-span-2">Today's Order</div>
              <div className="col-span-2">Invoice</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {(s.invoices || []).length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No customers found.</div>
            ) : s.invoices.map(inv => {
              const st = STATUS_STYLE[inv.pdfStatus] || STATUS_STYLE.not_required;
              return (
                <div key={inv.customerId} className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-5 py-3 border-b border-gray-50 last:border-0 items-center">
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-sm font-semibold text-gray-900">{inv.customerName}</p>
                    <p className="text-xs text-gray-400">{inv.phone}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-xs text-gray-600 truncate">{inv.whatsappGroupName || <span className="text-gray-300 italic">not set</span>}</div>
                  <div className="sm:col-span-2 text-xs font-semibold">
                    {inv.hasOrder ? <span className="text-green-600">YES</span> : <span className="text-gray-300">NO</span>}
                  </div>
                  <div className="sm:col-span-2 text-xs text-gray-500 truncate">{inv.pdfFileName || "—"}</div>
                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    {inv.pdfStatus === "generated" && (
                      <button
                        onClick={() => handleDownloadOne(inv)}
                        disabled={downloadingId === inv.dailyInvoiceId}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {downloadingId === inv.dailyInvoiceId ? "..." : "Download"}
                      </button>
                    )}
                  </div>
                  {inv.pdfStatus === "error" && inv.errorMessage && (
                    <div className="col-span-2 sm:col-span-12 text-[11px] text-red-500 mt-1">⚠ {inv.errorMessage}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AdminLayout>
  );
}