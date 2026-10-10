// FILE: src/components/DistributorLedgerPanel.jsx
// NEW FILE — Feature: Distributor ledger (statement view).
// One reusable ledger for ONE distributor, used in two places:
//   1. the "Distributor Ledger" page (opens under each distributor), and
//   2. the distributor's own Details page (section "Company Ledger").
// Shows a proper statement table (Date | Particulars | Billed | Received |
// Balance) with an Opening and Closing balance, a date-range picker
// (quick ranges + From/To) to look at any previous day or period, record /
// remove payments, and a PDF download. It only uses the existing ledger
// API functions — no backend change.
import { useEffect, useMemo, useState } from "react";
import {
  getDistributorLedger, addDistributorPayment, deleteDistributorPayment,
} from "../api/distributorBillApi";
import {
  PRESETS, presetRange, rangeLabel, buildStatement, fmtDay, todayISO, downloadStatementPdf,
} from "../utils/ledgerStatement";

export const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  pending: "bg-red-50 text-red-600",
  partial: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
};

/* ───────────────────────── date range bar ───────────────────────── */
export function DateRangeBar({ range, onChange }) {
  const today = todayISO();
  const active = PRESETS.find((p) => {
    const r = presetRange(p.key);
    return r.from === range.from && r.to === range.to;
  })?.key;

  const setFrom = (from) => onChange({ from, to: range.to && from && range.to < from ? from : range.to });
  const setTo = (to) => onChange({ from: range.from && to && range.from > to ? to : range.from, to });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key} type="button" onClick={() => onChange(presetRange(p.key))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${active === p.key ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >{p.label}</button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="text-[11px] font-medium text-gray-500">From
          <input type="date" aria-label="From date" max={today} value={range.from} onChange={(e) => setFrom(e.target.value)} className="block mt-0.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700" />
        </label>
        <label className="text-[11px] font-medium text-gray-500">To
          <input type="date" aria-label="To date" max={today} value={range.to} onChange={(e) => setTo(e.target.value)} className="block mt-0.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700" />
        </label>
      </div>
    </div>
  );
}

/* ───────────────────────── record payment ───────────────────────── */
export function PaymentModal({ distributor, pending, onClose, onDone }) {
  const [amount, setAmount] = useState(pending > 0 ? pending : "");
  const [mode, setMode] = useState("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!(Number(amount) > 0)) { setError("Enter an amount greater than 0."); return; }
    setSaving(true);
    try {
      await addDistributorPayment(distributor._id, { amount: Number(amount), mode, note });
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save the payment.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-gray-800 mb-1">Record Payment — {distributor.name}</h3>
        <p className="text-xs text-gray-400 mb-4">Pending balance: <b className="text-red-500">{rupees(pending)}</b></p>
        <label className="text-xs font-medium text-gray-500">Amount received (₹)</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <label className="text-xs font-medium text-gray-500">Paid by</label>
        <div className="flex gap-2 mt-1 mb-3">
          {["cash", "online"].map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${mode === m ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>{m === "online" ? "Online / GPay" : "Cash"}</button>
          ))}
        </div>
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="mb-3 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60">{saving ? "Saving…" : "Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── the ledger itself ───────────────────────── */
// data = { bills, payments, totals } from getDistributorLedger()
export function LedgerPanel({ distributor, data, range, onRangeChange, onReload }) {
  const [payOpen, setPayOpen] = useState(false);
  const st = useMemo(() => buildStatement(data.bills, data.payments, range), [data, range]);
  const pendingNow = data.totals?.pending ?? 0;

  const removePayment = async (p) => {
    if (!window.confirm(`Remove this ${rupees(p.amount)} payment? The pending balance will go back up.`)) return;
    await deleteDistributorPayment(p._id);
    onReload();
  };

  const tiles = [
    { label: "Opening Balance", value: st.opening, cls: "text-gray-800" },
    { label: "Billed in Period", value: st.billed, cls: "text-gray-800" },
    { label: "Received in Period", value: st.received, cls: "text-green-600" },
    { label: "Closing Balance (Pending)", value: st.closing, cls: st.closing > 0 ? "text-red-500" : "text-green-600" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <DateRangeBar range={range} onChange={onRangeChange} />
        <div className="flex gap-2">
          <button onClick={() => downloadStatementPdf({ distributor, statement: st, range })} className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </button>
          <button onClick={() => setPayOpen(true)} disabled={pendingNow <= 0} className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold disabled:opacity-30">Record Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-400">{t.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${t.cls}`}>{rupees(t.value)}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 mb-2">Statement for <b className="text-gray-600">{rangeLabel(range)}</b>. Overall pending right now: <b className="text-red-500">{rupees(pendingNow)}</b></p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse min-w-[720px]" data-testid="statement">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-28">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold border-b border-r border-gray-200">Particulars</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-32">Billed (Dr)</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-32">Received (Cr)</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-gray-200 w-32">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50/40 text-gray-600 italic">
              <td colSpan={4} className="px-4 py-2 border-b border-r border-gray-200">Opening balance{range.from ? ` (before ${fmtDay(range.from)})` : ""}</td>
              <td className="px-4 py-2 text-right border-b border-gray-200 font-semibold">{rupees(st.opening)}</td>
            </tr>
            {st.rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 border-b border-gray-200">No bills or payments in this period.</td></tr>
            )}
            {st.rows.map((r, i) => (
              <tr key={r.kind + r.id} className={i % 2 ? "bg-gray-50/60" : "bg-white"}>
                <td className="px-4 py-2.5 align-top border-b border-r border-gray-200 text-gray-600 whitespace-nowrap">{fmtDay(r.day)}</td>
                <td className="px-4 py-2.5 align-top border-b border-r border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{r.title}</span>
                    {r.kind === "bill" && <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[r.bill.status]}`}>{r.bill.status}</span>}
                    {r.kind === "payment" && <button onClick={() => removePayment(r.payment)} className="text-[11px] text-red-500 font-medium">Remove</button>}
                  </div>
                  {r.sub && <p className="text-xs text-gray-500 mt-0.5">{r.sub}</p>}
                </td>
                <td className="px-4 py-2.5 align-top text-right border-b border-r border-gray-200 text-gray-800">{r.debit ? rupees(r.debit) : ""}</td>
                <td className="px-4 py-2.5 align-top text-right border-b border-r border-gray-200 text-green-600">{r.credit ? rupees(r.credit) : ""}</td>
                <td className="px-4 py-2.5 align-top text-right border-b border-gray-200 font-medium text-gray-800">{rupees(r.balance)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold text-gray-700">
              <td colSpan={2} className="px-4 py-2.5 border-b border-r border-gray-200">Total for period</td>
              <td className="px-4 py-2.5 text-right border-b border-r border-gray-200">{rupees(st.billed)}</td>
              <td className="px-4 py-2.5 text-right border-b border-r border-gray-200 text-green-600">{rupees(st.received)}</td>
              <td className="px-4 py-2.5 border-b border-gray-200" />
            </tr>
            <tr className="bg-red-50 font-bold text-red-600">
              <td colSpan={4} className="px-4 py-2.5 border-r border-gray-200">Closing balance (pending)</td>
              <td className="px-4 py-2.5 text-right">{rupees(st.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {payOpen && (
        <PaymentModal distributor={distributor} pending={pendingNow} onClose={() => setPayOpen(false)} onDone={() => { setPayOpen(false); onReload(); }} />
      )}
    </div>
  );
}

/* ───────────────────────── self-loading version (Details page) ───────────────────────── */
export function DistributorLedgerSection({ distributorId, distributorName, employeeId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });

  const load = () => {
    setError("");
    getDistributorLedger(distributorId)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || "Could not load the company ledger."));
  };
  useEffect(() => { load(); }, [distributorId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6" data-testid="company-ledger">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p className="font-semibold text-gray-800">Company Ledger</p>
        {data && <span className="text-xs text-gray-500">Pending to company <b className="text-red-500">{rupees(data.totals?.pending)}</b></span>}
      </div>
      <p className="text-xs text-gray-400 mb-4">Bills for the batter / products {distributorName || "this distributor"} took from admin, and the payments made.</p>
      {error && <p className="text-sm text-red-500">{error} <button onClick={load} className="underline font-medium">Retry</button></p>}
      {!data && !error && <p className="text-sm text-gray-400">Loading…</p>}
      {data && (
        <LedgerPanel
          distributor={{ _id: distributorId, name: distributorName, employeeId }}
          data={data} range={range} onRangeChange={setRange} onReload={load}
        />
      )}
    </div>
  );
}