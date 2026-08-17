// FILE: src/components/InvoiceTypeModal.jsx
// PURPOSE: "Select Invoice Type" popup shown when Download Invoice is
// clicked on a completed delivery. Reusable across pages.
import { useState } from "react";
import { downloadInvoice } from "../api/invoiceApi";

export default function InvoiceTypeModal({ delivery, onClose }) {
  const [type, setType]         = useState("without-gst");
  const [downloading, setDownloading] = useState(false);
  const [err, setErr]           = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setErr("");
    try {
      await downloadInvoice(delivery._id, type);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to download invoice.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Download Invoice</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose Invoice Type</p>

          <label className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${type==="with-gst"?"border-blue-500 bg-blue-50":"border-gray-200 hover:bg-gray-50"}`}>
            <input type="radio" name="invoiceType" checked={type==="with-gst"} onChange={()=>setType("with-gst")} className="accent-blue-600"/>
            <div>
              <p className="text-sm font-semibold text-gray-900">With GST</p>
              <p className="text-xs text-gray-500">Tax invoice with CGST/SGST breakup</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${type==="without-gst"?"border-blue-500 bg-blue-50":"border-gray-200 hover:bg-gray-50"}`}>
            <input type="radio" name="invoiceType" checked={type==="without-gst"} onChange={()=>setType("without-gst")} className="accent-blue-600"/>
            <div>
              <p className="text-sm font-semibold text-gray-900">Without GST</p>
              <p className="text-xs text-gray-500">Plain invoice, no tax breakup</p>
            </div>
          </label>

          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} disabled={downloading} className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleDownload} disabled={downloading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}