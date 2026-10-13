// FILE: src/components/DistributorEditModals.jsx
// NEW FILE — two small edit pop-ups used on the Distributor Details page:
//   EditStockModal   — change the fridge stock (an increase asks for bill amount + cash collected)
//   EditPaymentModal — change Cash / GPay / Credit of one delivered order
import { useState } from "react";
import { updateDistributorStock, updateDeliveryPayment } from "../api/adminEditApi";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n) => `₹${r2(n)}`;
const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

function Shell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto" role="dialog" aria-label={title}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Fridge stock ───────────────────────── */
export function EditStockModal({ distributor, products = [], onClose, onSaved }) {
  const curIdly = r2(distributor.currentStockKg?.idly || 0);
  const curDosa = r2(distributor.currentStockKg?.dosa || 0);
  const [idly, setIdly] = useState(String(curIdly));
  const [dosa, setDosa] = useState(String(curDosa));
  const [billAmount, setBillAmount] = useState(null);   // null = use the suggested amount
  const [cash, setCash] = useState("");
  const [mode, setMode] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dIdly = r2((Number(idly) || 0) - curIdly);
  const dDosa = r2((Number(dosa) || 0) - curDosa);
  const increased = dIdly > 0 || dDosa > 0;
  const rate = (key) => Number(products.find((p) => p.key === key)?.companyRatePerKg) || 0;
  const suggested = r2(Math.max(dIdly, 0) * rate("idly") + Math.max(dDosa, 0) * rate("dosa"));
  const bill = billAmount === null ? suggested : billAmount;

  const invalid = idly === "" || dosa === "" || Number(idly) < 0 || Number(dosa) < 0;

  const save = async () => {
    setError(""); setSaving(true);
    try {
      const payload = { idly: Number(idly), dosa: Number(dosa) };
      if (increased) {
        payload.billAmount = Number(bill) || 0;
        payload.cashCollected = Number(cash) || 0;
        payload.mode = mode;
      }
      const data = await updateDistributorStock(distributor._id, payload);
      onSaved?.(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Couldn't save. Please try again.");
    } finally { setSaving(false); }
  };

  const delta = (d) => (d === 0 ? "no change" : `${d > 0 ? "+" : ""}${d} kg`);

  return (
    <Shell title="Edit fridge stock" subtitle={`${distributor.name} · now ${curIdly} kg idly / ${curDosa} kg dosa`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-1">
        <label className="text-xs text-gray-500">Idly (kg)
          <input type="number" min="0" step="any" value={idly} onChange={(e) => setIdly(e.target.value)} className={`${inputCls} mt-1`} aria-label="Idly stock" />
          <span className={`text-[11px] ${dIdly > 0 ? "text-green-600" : dIdly < 0 ? "text-red-500" : "text-gray-400"}`}>{delta(dIdly)}</span>
        </label>
        <label className="text-xs text-gray-500">Dosa (kg)
          <input type="number" min="0" step="any" value={dosa} onChange={(e) => setDosa(e.target.value)} className={`${inputCls} mt-1`} aria-label="Dosa stock" />
          <span className={`text-[11px] ${dDosa > 0 ? "text-green-600" : dDosa < 0 ? "text-red-500" : "text-gray-400"}`}>{delta(dDosa)}</span>
        </label>
      </div>

      {increased && (
        <div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-100 p-3" data-testid="increase-box">
          <p className="text-sm font-semibold text-gray-800">Stock increased — collect payment</p>
          <p className="text-[11px] text-gray-500 mb-3">
            Added: {dIdly > 0 ? `${dIdly} kg idly` : ""}{dIdly > 0 && dDosa > 0 ? " + " : ""}{dDosa > 0 ? `${dDosa} kg dosa` : ""}.
            A bill is added to this distributor's ledger and the cash you collected is recorded as a payment.
          </p>
          <label className="text-xs text-gray-500 block mb-3">Bill amount for the added kg (₹)
            <input type="number" min="0" step="any" value={billAmount === null ? suggested : billAmount} onChange={(e) => setBillAmount(e.target.value === "" ? 0 : Number(e.target.value))} className={`${inputCls} mt-1`} aria-label="Bill amount" />
            <span className="text-[11px] text-gray-400">Suggested from company rate: {money(suggested)}. You can change it.</span>
          </label>
          <label className="text-xs text-gray-500 block mb-2">Cash collected from distributor (₹)
            <input type="number" min="0" step="any" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" className={`${inputCls} mt-1`} aria-label="Cash collected" />
          </label>
          <div className="flex gap-2 mb-1">
            {["cash", "online"].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-1 rounded-full text-xs border ${mode === m ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200"}`}>{m === "cash" ? "Cash" : "Online / GPay"}</button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Left to pay on this bill: <b>{money(Math.max(bill - (Number(cash) || 0), 0))}</b></p>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mt-3" role="alert">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
        <button type="button" onClick={save} disabled={saving || invalid} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </Shell>
  );
}

/* ───────────────────────── Delivery payment ───────────────────────── */
// row: { id, shopName, charged, cash, online, credit }
export function EditPaymentModal({ row, onClose, onSaved }) {
  const [cash, setCash] = useState(String(r2(row.cash)));
  const [online, setOnline] = useState(String(r2(row.online)));
  const [credit, setCredit] = useState(String(r2(row.credit)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sum = r2((Number(cash) || 0) + (Number(online) || 0) + (Number(credit) || 0));
  const left = r2(row.charged - sum);
  const balanced = Math.abs(left) <= 0.01;
  const allIn = (c, o, k) => { setCash(String(c)); setOnline(String(o)); setCredit(String(k)); };

  const save = async () => {
    setError(""); setSaving(true);
    try {
      await updateDeliveryPayment(row.id, { cashAmount: Number(cash) || 0, onlineAmount: Number(online) || 0, creditAmount: Number(credit) || 0 });
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Couldn't save. Please try again.");
    } finally { setSaving(false); }
  };

  const Field = ({ label, value, set }) => (
    <label className="text-xs text-gray-500">{label}
      <input type="number" min="0" step="any" value={value} onChange={(e) => set(e.target.value)} className={`${inputCls} mt-1`} aria-label={label} />
    </label>
  );

  return (
    <Shell title="Edit payment" subtitle={`${row.shopName} · bill ${money(row.charged)}`} onClose={onClose}>
      <p className="text-[11px] text-gray-500 mb-2">Only how it was paid changes — kg and bill amount stay the same. The shop's ledger and the distributor totals update automatically.</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button type="button" onClick={() => allIn(row.charged, 0, 0)} className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] text-gray-600">All cash</button>
        <button type="button" onClick={() => allIn(0, row.charged, 0)} className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] text-gray-600">All online</button>
        <button type="button" onClick={() => allIn(0, 0, row.charged)} className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] text-gray-600">All credit</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Cash (₹)" value={cash} set={setCash} />
        <Field label="Online (₹)" value={online} set={setOnline} />
        <Field label="Credit (₹)" value={credit} set={setCredit} />
      </div>
      <p className={`text-xs mt-3 ${balanced ? "text-green-600" : "text-red-500"}`} data-testid="balance">
        {balanced ? "✓ Adds up to the bill" : left > 0 ? `${money(left)} still to assign` : `${money(-left)} too much`}
      </p>
      {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mt-3" role="alert">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
        <button type="button" onClick={save} disabled={saving || !balanced} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </Shell>
  );
}