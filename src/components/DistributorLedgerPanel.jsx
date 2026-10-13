// FILE: src/components/DistributorLedgerPanel.jsx
// NEW FILE — Feature: Distributor ledger (statement view).
// One reusable ledger for ONE distributor, used in two places:
//   1. the "Distributor Ledger" page (opens under each distributor), and
//   2. the distributor's own Details page (section "Company Ledger").
// Shows a proper statement table (Date | Particulars | Billed | Received |
// On credit | Balance) with an Opening and Closing balance, a date-range picker
// (quick ranges + From/To) to look at any previous day or period, record /
// remove payments, and a PDF download. It only uses the existing ledger
// API functions — no backend change.
import { useEffect, useMemo, useState } from "react";
import {
  getDistributorLedger, addDistributorPayment, deleteDistributorPayment, setDistributorCreditLimit,
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
// Cash / Online = money RECEIVED.  Credit = NO money: the amount moves onto the
// distributor's credit (needs a credit limit) and is never shown as received.
export function PaymentModal({ distributor, totals = {}, preset, onClose, onDone }) {
  const due = totals.dueNow ?? totals.pending ?? 0;
  const credit = totals.credit ?? 0;
  const limit = totals.creditLimit ?? 0;
  const avail = totals.creditAvailable ?? Math.max(limit - credit, 0);

  const firstTowards = preset?.towards || (due > 0 ? "bills" : "credit");
  const maxFor = (m, t) => (m === "credit" ? Math.min(due, avail) : t === "bills" ? due : credit);

  const [mode, setMode] = useState(preset?.mode || "cash");
  const [towards, setTowards] = useState(firstTowards);
  const [amount, setAmount] = useState(maxFor(preset?.mode || "cash", firstTowards) || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pick = (m, t = towards) => { setMode(m); setTowards(t); setAmount(maxFor(m, t) || ""); setError(""); };
  const max = maxFor(mode, towards);
  const noLimit = mode === "credit" && !(limit > 0);
  const tooMuch = Number(amount) > max + 0.001;

  const submit = async () => {
    setError("");
    if (!(Number(amount) > 0)) { setError("Enter an amount greater than 0."); return; }
    setSaving(true);
    try {
      await addDistributorPayment(distributor._id, { amount: Number(amount), mode, ...(mode === "credit" ? {} : { appliesTo: towards }), note });
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save the payment.");
    } finally { setSaving(false); }
  };

  const title = mode === "credit" ? "Move to Credit" : towards === "credit" ? "Receive Credit Payment" : "Record Payment";
  const label = mode === "credit" ? "Amount to put on credit (₹)" : "Amount received (₹)";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[92vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-1">{title} — {distributor.name}</h3>
        <p className="text-xs text-gray-500 mb-4">Due now <b className="text-red-500">{rupees(due)}</b> · On credit <b className="text-amber-600">{rupees(credit)}</b></p>

        <label className="text-xs font-medium text-gray-500">How was it settled?</label>
        <div className="flex gap-2 mt-1 mb-3">
          {["cash", "online", "credit"].map((m) => (
            <button key={m} type="button" onClick={() => pick(m)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${mode === m ? (m === "credit" ? "bg-amber-500 text-white" : "bg-teal-600 text-white") : "bg-white border border-gray-200 text-gray-500"}`}>{m === "online" ? "Online / GPay" : m === "credit" ? "Credit" : "Cash"}</button>
          ))}
        </div>

        {mode !== "credit" && due > 0 && credit > 0 && (
          <div className="mb-3" data-testid="towards">
            <label className="text-xs font-medium text-gray-500">Received towards</label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => pick(mode, "bills")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${towards === "bills" ? "bg-teal-50 border border-teal-500 text-teal-700" : "border border-gray-200 text-gray-500"}`}>Current dues<br />{rupees(due)}</button>
              <button type="button" onClick={() => pick(mode, "credit")} className={`flex-1 py-2 rounded-xl text-xs font-medium ${towards === "credit" ? "bg-amber-50 border border-amber-500 text-amber-700" : "border border-gray-200 text-gray-500"}`}>Credit balance<br />{rupees(credit)}</button>
            </div>
          </div>
        )}

        {mode === "credit" ? (
          <div className="text-[11px] bg-amber-50 text-amber-800 rounded-lg px-3 py-2 mb-3" data-testid="credit-help">
            <p>No money is received now. This amount is <b>not</b> counted as received — it goes to the distributor's <b>Credit</b>.</p>
            {noLimit
              ? <p className="mt-1 text-red-600 font-medium">No credit limit is set for this distributor. Set one in the “Distributor Credits” card first.</p>
              : <p className="mt-1">Credit limit {rupees(limit)} · already on credit {rupees(credit)} · available <b>{rupees(avail)}</b></p>}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 mb-3">{towards === "credit" ? "This repays the credit balance." : "This is counted as money received against the current dues."}</p>
        )}

        <label className="text-xs font-medium text-gray-500">{label}</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 mb-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <p className={`text-[11px] mb-3 ${tooMuch ? "text-red-500" : "text-gray-400"}`}>Up to {rupees(max)}</p>
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="mb-3 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving || noLimit || tooMuch || !(max > 0)} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40 ${mode === "credit" ? "bg-amber-500" : "bg-teal-600"}`}>
            {saving ? "Saving…" : mode === "credit" ? "Save to Credit" : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── the ledger itself ───────────────────────── */
// data = { bills, payments, totals } from getDistributorLedger()
export function LedgerPanel({ distributor, data, range, onRangeChange, onReload }) {
  const [payOpen, setPayOpen] = useState(false);
  const totals = data.totals || {};
  const st = useMemo(() => buildStatement(data.bills, data.payments, range, totals.credit || 0), [data, range]);
  const owedNow = totals.pending ?? 0;

  const removePayment = async (p) => {
    const msg = p.mode === "credit"
      ? `Remove this ${rupees(p.amount)} credit entry? It goes back to "due now".`
      : p.appliesTo === "credit"
        ? `Remove this ${rupees(p.amount)} credit repayment? The credit balance will go back up.`
        : `Remove this ${rupees(p.amount)} payment? The amount will be due again.`;
    if (!window.confirm(msg)) return;
    try { await deleteDistributorPayment(p._id); } catch (e) { window.alert(e?.response?.data?.message || "Could not remove it."); }
    onReload();
  };

  // right now (all time)
  const now = [
    { label: "Due now", value: totals.dueNow ?? owedNow, cls: "text-red-500", hint: "still to be settled" },
    { label: "On credit", value: totals.credit ?? 0, cls: "text-amber-600", hint: "kept by distributor" },
    { label: "Total owed to company", value: owedNow, cls: "text-gray-800", hint: "due now + on credit" },
  ];
  // for the chosen period
  const tiles = [
    { label: "Opening Balance", value: st.opening, cls: "text-gray-800" },
    { label: "Billed in Period", value: st.billed, cls: "text-gray-800" },
    { label: "Money Received in Period", value: st.received, cls: "text-green-600" },
    { label: "Closing Balance (total owed)", value: st.closing, cls: st.closing > 0 ? "text-red-500" : "text-green-600" },
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
          <button onClick={() => setPayOpen(true)} disabled={owedNow <= 0} className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold disabled:opacity-30">Record Payment</button>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Right now</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4" data-testid="now-summary">
        {now.map((t) => (
          <div key={t.label} className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-500">{t.label} <span className="text-gray-400">· {t.hint}</span></p>
            <p className={`text-lg font-bold mt-0.5 ${t.cls}`}>{rupees(t.value)}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Statement · {rangeLabel(range)}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-400">{t.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${t.cls}`}>{rupees(t.value)}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse min-w-[820px]" data-testid="statement">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-28">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold border-b border-r border-gray-200">Particulars</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-28">Billed (Dr)</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-28">Received (Cr)</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-r border-gray-200 w-28">On credit</th>
              <th className="text-right px-4 py-2.5 font-semibold border-b border-gray-200 w-32">Balance owed</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50/40 text-gray-600 italic">
              <td colSpan={5} className="px-4 py-2 border-b border-r border-gray-200">Opening balance{range.from ? ` (before ${fmtDay(range.from)})` : ""}</td>
              <td className="px-4 py-2 text-right border-b border-gray-200 font-semibold">{rupees(st.opening)}</td>
            </tr>
            {st.rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 border-b border-gray-200">No bills or payments in this period.</td></tr>
            )}
            {st.rows.map((r) => {
              const isCredit = !!r.creditDelta;
              return (
                <tr key={r.kind + r.id} className={isCredit ? "bg-amber-50/50" : r.kind === "bill" ? "bg-white" : "bg-green-50/30"}>
                  <td className="px-4 py-2.5 align-top border-b border-r border-gray-200 text-gray-600 whitespace-nowrap">{fmtDay(r.day)}</td>
                  <td className="px-4 py-2.5 align-top border-b border-r border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{r.title}</span>
                      {r.kind === "bill" && <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[r.bill.status]}`}>{r.bill.status}</span>}
                      {r.kind === "bill" && r.bill.creditAmount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">credit {rupees(r.bill.creditAmount)}</span>}
                      {r.kind === "payment" && <button onClick={() => removePayment(r.payment)} className="text-[11px] text-red-500 font-medium">Remove</button>}
                    </div>
                    {r.sub && <p className="text-xs text-gray-500 mt-0.5">{r.sub}</p>}
                  </td>
                  <td className="px-4 py-2.5 align-top text-right border-b border-r border-gray-200 text-gray-800">{r.debit ? rupees(r.debit) : ""}</td>
                  <td className="px-4 py-2.5 align-top text-right border-b border-r border-gray-200 text-green-600">{r.credit ? rupees(r.credit) : ""}</td>
                  <td className={`px-4 py-2.5 align-top text-right border-b border-r border-gray-200 font-medium ${r.creditDelta > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {r.creditDelta ? `${r.creditDelta > 0 ? "+" : "−"}${rupees(Math.abs(r.creditDelta))}` : ""}
                  </td>
                  <td className="px-4 py-2.5 align-top text-right border-b border-gray-200 font-medium text-gray-800">{rupees(r.balance)}</td>
                </tr>
              );
            })}
            <tr className="bg-red-50 font-bold text-red-600">
              <td colSpan={5} className="px-4 py-2.5 border-r border-gray-200">Closing balance (total owed to company)</td>
              <td className="px-4 py-2.5 text-right">{rupees(st.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">“Received” is real cash / online money only. “On credit” is not money — it shows what was moved to credit (+) and what the distributor repaid (−).</p>

      {payOpen && (
        <PaymentModal distributor={distributor} totals={totals} onClose={() => setPayOpen(false)} onDone={() => { setPayOpen(false); onReload(); }} />
      )}
    </div>
  );
}

/* ───────────────────────── Distributor Credits card ───────────────────────── */
// Shows the credit this distributor keeps with the company, lets admin set / increase the
// credit limit, and receive a repayment. Credit can never go above the limit.
export function DistributorCreditCard({ distributor, data, onReload }) {
  const t = data.totals || {};
  const limit = t.creditLimit ?? 0;
  const credit = t.credit ?? 0;
  const avail = t.creditAvailable ?? Math.max(limit - credit, 0);
  const pct = limit > 0 ? Math.min(100, Math.round((credit / limit) * 100)) : 0;

  const [limitInput, setLimitInput] = useState(String(limit || ""));
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [saving, setSaving] = useState(false);
  const [repay, setRepay] = useState(false);
  useEffect(() => { setLimitInput(String(limit || "")); }, [limit]);

  const saveLimit = async () => {
    setMsg({ ok: true, text: "" });
    if (limitInput === "" || Number(limitInput) < 0) { setMsg({ ok: false, text: "Enter the credit limit (0 or more)." }); return; }
    setSaving(true);
    try {
      await setDistributorCreditLimit(distributor._id, Number(limitInput));
      setMsg({ ok: true, text: "Credit limit saved." });
      onReload();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || "Could not save the limit." });
    } finally { setSaving(false); }
  };

  const history = (data.payments || []).filter((p) => p.mode === "credit" || p.appliesTo === "credit").slice(0, 8);
  const atLimit = limit > 0 && credit >= limit;

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 mb-6" data-testid="credit-card">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="font-semibold text-gray-800">Distributor Credits</p>
          <p className="text-xs text-gray-400">Credit {distributor.name || "this distributor"} is keeping with the company. Credit is not money received.</p>
        </div>
        <button onClick={() => setRepay(true)} disabled={credit <= 0} className="px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold disabled:opacity-30">Receive credit payment</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-amber-50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-amber-700">Credit with distributor</p>
          <p className="text-xl font-bold text-amber-700">{rupees(credit)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-gray-500">Credit limit</p>
          <p className="text-xl font-bold text-gray-800">{limit > 0 ? rupees(limit) : "Not set"}</p>
        </div>
        <div className="bg-green-50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-green-700">Available credit</p>
          <p className="text-xl font-bold text-green-700">{rupees(avail)}</p>
        </div>
      </div>

      {limit > 0 && (
        <div className="mb-3">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full ${atLimit ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} /></div>
          <p className="text-[11px] text-gray-400 mt-1">{pct}% of the limit used</p>
        </div>
      )}
      {atLimit && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3" role="alert">Credit limit reached. No more credit can be given until the distributor repays or you increase the limit below.</p>}
      {limit <= 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">Set a credit limit to allow credit for this distributor. With no limit, credit cannot be given.</p>}

      <div className="flex flex-wrap items-end gap-2 mb-1">
        <label className="text-xs text-gray-500">{limit > 0 ? "Change / increase credit limit (₹)" : "Set credit limit (₹)"}
          <input type="number" min="0" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} aria-label="Credit limit" className="block mt-1 w-44 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </label>
        <button onClick={saveLimit} disabled={saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold disabled:opacity-50">{saving ? "Saving…" : "Save limit"}</button>
      </div>
      {msg.text && <p className={`text-xs mb-2 ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}

      <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Credit history</p>
      {history.length === 0 ? <p className="text-xs text-gray-400">No credit given yet.</p> : (
        <div className="divide-y divide-gray-50">
          {history.map((p) => (
            <div key={p._id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-gray-700">{p.mode === "credit" ? "Given on credit" : `Repaid by distributor (${p.mode === "online" ? "Online / GPay" : "Cash"})`}</p>
                <p className="text-[11px] text-gray-400">{fmtDay(todayISOOf(p.receivedAt))}{p.note ? ` · ${p.note}` : ""}</p>
              </div>
              <span className={`font-semibold ${p.mode === "credit" ? "text-amber-600" : "text-green-600"}`}>{p.mode === "credit" ? "+" : "−"}{rupees(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {repay && (
        <PaymentModal distributor={distributor} totals={t} preset={{ mode: "cash", towards: "credit" }} onClose={() => setRepay(false)} onDone={() => { setRepay(false); onReload(); }} />
      )}
    </div>
  );
}
const todayISOOf = (v) => { const d = new Date(v); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

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

  const distributor = { _id: distributorId, name: distributorName, employeeId };

  return (
    <>
      {data && <DistributorCreditCard distributor={distributor} data={data} onReload={load} />}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6" data-testid="company-ledger">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <p className="font-semibold text-gray-800">Company Ledger</p>
          {data && <span className="text-xs text-gray-500">Total owed to company <b className="text-red-500">{rupees(data.totals?.pending)}</b></span>}
        </div>
        <p className="text-xs text-gray-400 mb-4">Bills for the batter / products {distributorName || "this distributor"} took from admin, the money received, and what is on credit.</p>
        {error && <p className="text-sm text-red-500">{error} <button onClick={load} className="underline font-medium">Retry</button></p>}
        {!data && !error && <p className="text-sm text-gray-400">Loading…</p>}
        {data && (
          <LedgerPanel distributor={distributor} data={data} range={range} onRangeChange={setRange} onReload={load} />
        )}
      </div>
    </>
  );
}