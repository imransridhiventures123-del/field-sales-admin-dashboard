// FILE: src/components/DistributorDailyDeliveries.jsx
// NEW FILE — Daily deliveries tracker for ONE distributor (admin side).
// Admin can move to the previous / next day (or pick any date) and see, for
// that day: shops, kg, how much was billed, and how it was collected —
// Cash / Online (GPay) / Credit. Uses only EXISTING admin APIs:
//   today  -> GET /api/deliveries/admin/today-status?distributorId=
//   other  -> GET /api/deliveries/admin?distributorId=&date=YYYY-MM-DD
import { useEffect, useMemo, useState, useCallback } from "react";
import { getAdminDeliveries, getAdminTodayStatus } from "../api/deliveryApi";
import { EditPaymentModal } from "./DistributorEditModals"; // NEW — admin can edit cash/online/credit

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const shiftKey = (k, days) => { const d = fromKey(k); d.setDate(d.getDate() + days); return toKey(d); };
const money = (n) => `₹${Math.round((Number(n) || 0) * 100) / 100}`;
const kg = (n) => Math.round((Number(n) || 0) * 100) / 100;

function dayLabel(key) {
  const today = toKey(new Date());
  if (key === today) return "Today";
  if (key === shiftKey(today, -1)) return "Yesterday";
  if (key === shiftKey(today, 1)) return "Tomorrow";
  return "";
}

// Normalise both API shapes into one row shape.
function fromRecord(r) {
  const charged = Number(r.amountCharged) || 0;
  const cash = r.cashAmount !== undefined && r.cashAmount !== null ? r.cashAmount : (r.amountPaid || 0); // old records: amountPaid = cash
  return {
    key: r._id,
    id: r._id,
    shopName: r.shopName || r.customer?.shopName || "—",
    source: r.source,
    status: r.status || "delivered",
    idlyKg: r.idlyKg || 0, dosaKg: r.dosaKg || 0, extraItems: r.extraItems || [],
    charged, cash: Number(cash) || 0, online: Number(r.onlineAmount) || 0, credit: Number(r.creditAmount) || 0,
    time: r.deliveredAt || r.updatedAt || r.createdAt || null,
  };
}
function fromTodayShop(s, i) {
  return {
    key: `t${i}`,
    shopName: s.shopName || "—",
    source: s.source,
    status: s.status || "pending",
    idlyKg: s.idlyKg || 0, dosaKg: s.dosaKg || 0, extraItems: s.extraItems || [],
    charged: Number(s.amountCharged) || 0, cash: Number(s.cashAmount) || 0, online: Number(s.onlineAmount) || 0, credit: Number(s.creditAmount) || 0,
    time: null,
  };
}

const STATUS = {
  delivered: { label: "Delivered", cls: "bg-green-50 text-green-700 border-green-100" },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-100" },
  skipped:   { label: "Skipped",   cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function Tile({ label, value, sub, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-800", teal: "bg-teal-50 text-teal-700", green: "bg-green-50 text-green-700",
    blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-xl px-3 py-3 ${tones[tone]}`}>
      <p className="text-[11px] opacity-70">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
      {sub && <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DistributorDailyDeliveries({ distributorId, onChanged }) {
  const [dateKey, setDateKey] = useState(toKey(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // row being edited

  const isToday = dateKey === toKey(new Date());

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    // Today: the status list (includes not-yet-delivered shops) + the day's records,
    // so each delivered row can be matched to its record id and become editable.
    const todayReq = Promise.all([
      getAdminTodayStatus(distributorId),
      getAdminDeliveries({ distributorId, date: dateKey }).catch(() => ({ records: [] })),
    ]).then(([d, recs]) => {
      const pool = [...(recs.records || [])];
      return (d.shops || []).map((s, i) => {
        const row = fromTodayShop(s, i);
        if (s.status === "delivered") {
          const at = pool.findIndex((r) => r.status === "delivered" && String(r.customer?._id || r.customer) === String(s.customerId)
            && (r.idlyKg || 0) === row.idlyKg && (r.dosaKg || 0) === row.dosaKg && (Number(r.amountCharged) || 0) === row.charged);
          if (at >= 0) row.id = pool.splice(at, 1)[0]._id;
        }
        return row;
      });
    });
    const req = isToday
      ? todayReq
      : getAdminDeliveries({ distributorId, date: dateKey }).then((d) => (d.records || []).map(fromRecord));
    req.then(setRows).catch(() => { setRows([]); setError("Couldn't load deliveries for this date. Please try again."); }).finally(() => setLoading(false));
  }, [distributorId, dateKey, isToday]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const t = { shops: rows.length, delivered: 0, pending: 0, skipped: 0, idly: 0, dosa: 0, charged: 0, cash: 0, online: 0, credit: 0 };
    rows.forEach((r) => {
      t[r.status] = (t[r.status] || 0) + 1;
      if (r.status === "delivered") {
        t.idly += r.idlyKg; t.dosa += r.dosaKg;
        t.charged += r.charged; t.cash += r.cash; t.online += r.online; t.credit += r.credit;
      }
    });
    return t;
  }, [rows]);

  const shown = rows.filter((r) =>
    (filter === "all" || r.status === filter || (filter === "credit" && r.status === "delivered" && r.credit > 0)) &&
    (!q.trim() || r.shopName.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const chips = [
    ["all", `All (${totals.shops})`], ["delivered", `Delivered (${totals.delivered})`],
    ["pending", `Pending (${totals.pending})`], ["skipped", `Skipped (${totals.skipped})`],
    ["credit", "On credit"],
  ];

  const full = fromKey(dateKey).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const navBtn = "w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6" data-testid="daily-deliveries">
      {/* Header + date navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-gray-800">Daily Deliveries</p>
          <p className="text-xs text-gray-400">{dayLabel(dateKey) ? `${dayLabel(dateKey)} · ` : ""}{full}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous day" onClick={() => setDateKey(shiftKey(dateKey, -1))} className={navBtn}>‹</button>
          <input
            type="date" aria-label="Select date" value={dateKey}
            onChange={(e) => e.target.value && setDateKey(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="button" aria-label="Next day" onClick={() => setDateKey(shiftKey(dateKey, 1))} className={navBtn}>›</button>
          <button
            type="button" onClick={() => setDateKey(toKey(new Date()))} disabled={isToday}
            className="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-medium disabled:opacity-40"
          >Today</button>
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {/* Summary: how the money was collected */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Tile tone="teal"  label="Total billed" value={money(totals.charged)} sub={`${totals.delivered} delivered`} />
        <Tile tone="green" label="Cash collected" value={money(totals.cash)} />
        <Tile tone="blue"  label="Online (GPay/UPI)" value={money(totals.online)} />
        <Tile tone="amber" label="On credit" value={money(totals.credit)} />
        <Tile             label="Quantity" value={`${kg(totals.idly)} / ${kg(totals.dosa)} kg`} sub="Idly / Dosa" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([k, label]) => (
            <button
              key={k} type="button" onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${filter === k ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >{label}</button>
          ))}
        </div>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shop…"
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3" role="alert">{error}</div>}

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-10">Loading deliveries…</p>
      ) : shown.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">{rows.length === 0 ? "No deliveries or orders on this date." : "No shops match this filter."}</p>
          {rows.length === 0 && <p className="text-xs text-gray-400 mt-1">Use ‹ › to check other days.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Shop</th>
                <th className="text-left px-3 py-2.5 font-medium">Items</th>
                <th className="text-center px-3 py-2.5 font-medium">Status</th>
                <th className="text-right px-3 py-2.5 font-medium">Billed</th>
                <th className="text-right px-3 py-2.5 font-medium">Cash</th>
                <th className="text-right px-3 py-2.5 font-medium">Online</th>
                <th className="text-right px-3 py-2.5 font-medium">Credit</th>
                <th className="px-3 py-2.5 w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shown.map((r) => {
                const st = STATUS[r.status] || STATUS.pending;
                const done = r.status === "delivered";
                return (
                  <tr key={r.key} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-800">{r.shopName}</p>
                      <p className="text-[11px] text-gray-400">
                        {r.source === "manual" ? "Added by distributor" : "Approved request"}
                        {r.time ? ` · ${new Date(r.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {kg(r.idlyKg)}kg idly · {kg(r.dosaKg)}kg dosa
                      {(r.extraItems || []).map((it, i) => <span key={i} className="block text-gray-400">{it.qty} {it.unit || "kg"} {it.productName || it.productKey}</span>)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{done ? money(r.charged) : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-green-700">{done ? money(r.cash) : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-sky-700">{done ? money(r.online) : "—"}</td>
                    <td className={`px-3 py-2.5 text-right ${done && r.credit > 0 ? "text-amber-600 font-semibold" : "text-gray-400"}`}>{done ? money(r.credit) : "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      {done && r.id && (
                        <button type="button" onClick={() => setEditing(r)} className="text-xs text-teal-600 font-medium hover:underline" aria-label={`Edit payment for ${r.shopName}`}>✎ Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 text-sm font-semibold text-gray-800">
              <tr>
                <td className="px-3 py-2.5" colSpan={3}>Day total (delivered)</td>
                <td className="px-3 py-2.5 text-right">{money(totals.charged)}</td>
                <td className="px-3 py-2.5 text-right text-green-700">{money(totals.cash)}</td>
                <td className="px-3 py-2.5 text-right text-sky-700">{money(totals.online)}</td>
                <td className="px-3 py-2.5 text-right text-amber-600">{money(totals.credit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {editing && (
        <EditPaymentModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); onChanged?.(); }}
        />
      )}
    </div>
  );
}