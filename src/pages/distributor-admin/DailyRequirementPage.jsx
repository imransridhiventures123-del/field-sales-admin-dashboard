// FILE: src/pages/distributor-admin/DailyRequirementPage.jsx
// UI REDESIGN ONLY — matches the reference screenshot exactly (status
// pill tabs each showing a live count, a search+filter bar, a proper
// table layout instead of cards, the empty-state illustration, and a
// "Showing X of Y requests" pagination footer). All data calls
// (getAllBatterRequests / approveBatterRequest / rejectBatterRequest)
// are unchanged.
import { useEffect, useState, Fragment } from "react";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import EmptyStateIllustration from "../../components/EmptyStateIllustration";
import { getAllBatterRequests, approveBatterRequest, rejectBatterRequest } from "../../api/batterRequestApi";
import { getAllProductRequests, approveProductRequest, rejectProductRequest } from "../../api/productRequestApi";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  partially_approved: "bg-teal-50 text-teal-600",
  rejected: "bg-red-50 text-red-600",
};

const TABS = [
  { key: "pending", label: "Pending", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "approved", label: "Approved", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "partially_approved", label: "Partially Approved", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "rejected", label: "Rejected", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "", label: "All", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
];

// NEW — Feature: admin-managed product catalog (Level 2). Quantities of
// products other than Idly/Dosa as " · 3 packet Paneer Pack".
const extrasText = (items) =>
  (items || []).map((it) => ` · ${it.qty} ${it.unit || "kg"} ${it.productName || it.productKey}`).join("");

function ApproveModal({ request, onClose, onDone }) {
  const [idlyKg, setIdlyKg] = useState(request.requestedIdlyKg);
  const [dosaKg, setDosaKg] = useState(request.requestedDosaKg);
  // NEW — one approve box per other product the distributor asked for,
  // pre-filled with the full requested quantity.
  const [extraQty, setExtraQty] = useState(() => {
    const init = {};
    (request.requestedExtraItems || []).forEach((it) => { init[it.productKey] = it.qty; });
    return init;
  });
  const [deliveryTime, setDeliveryTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await approveBatterRequest(request._id, {
        approvedIdlyKg: Number(idlyKg), approvedDosaKg: Number(dosaKg),
        approvedExtraItems: (request.requestedExtraItems || []).map((it) => ({ productKey: it.productKey, qty: Number(extraQty[it.productKey]) || 0 })),
        deliveryTime, adminNote: note,
      });
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't approve this request. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-1">Approve Request — {request.distributor?.name}</h3>
        <p className="text-xs text-gray-400 mb-4">Requested: {request.requestedIdlyKg}kg idly / {request.requestedDosaKg}kg dosa{extrasText(request.requestedExtraItems)}</p>
        {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">{error}</div>}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Idly batter to approve (kg)</label>
            <input type="number" value={idlyKg} onChange={(e) => setIdlyKg(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Dosa batter to approve (kg)</label>
            <input type="number" value={dosaKg} onChange={(e) => setDosaKg(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
        </div>
        {(request.requestedExtraItems || []).length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {request.requestedExtraItems.map((it) => (
              <div key={it.productKey}>
                <label className="text-xs font-medium text-gray-500">{it.productName || it.productKey} to approve ({it.unit || "kg"})</label>
                <input
                  type="number" min="0" value={extraQty[it.productKey] ?? ""}
                  onChange={(e) => setExtraQty((q) => ({ ...q, [it.productKey]: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Requested: {it.qty}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500">Delivery time</label>
          <input placeholder="e.g. 6:30 PM today" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500">Note to distributor (optional)</label>
          <input placeholder="e.g. Only 30kg idly batter available today" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving…" : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ NEW — Product Requests section ══════════════════ */
const fmtDay = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return s || "—";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};
const fmtClock = (s) => {
  if (!/^\d{2}:\d{2}$/.test(s || "")) return s || "";
  let [h, m] = s.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
};
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function ProductApproveModal({ request, onClose, onDone }) {
  const [qtys, setQtys] = useState(() => Object.fromEntries(request.items.map((it) => [it.productKey, it.qty])));
  const [deliveryDate, setDeliveryDate] = useState(request.requestedDeliveryDate || "");
  const [deliveryTime, setDeliveryTime] = useState(request.requestedDeliveryTime || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!deliveryDate || !deliveryTime) { setError("Please choose the delivery day and time."); return; }
    setSaving(true);
    try {
      await approveProductRequest(request._id, {
        approvedItems: request.items.map((it) => ({ productKey: it.productKey, qty: Number(qtys[it.productKey]) || 0 })),
        deliveryDate, deliveryTime, adminNote: note,
      });
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not approve. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-1">Approve Product Request — {request.distributor?.name}</h3>
        <p className="text-xs text-gray-400 mb-4">Distributor wants it on {fmtDay(request.requestedDeliveryDate)} at {fmtClock(request.requestedDeliveryTime)}</p>

        <div className="space-y-2 mb-4">
          {request.items.map((it) => (
            <div key={it.productKey} className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                {it.productName}
                <span className="block text-[11px] text-gray-400">Requested {it.qty} {it.unit} · {rupees(it.ratePerUnit)}/{it.unit}</span>
              </div>
              <input type="number" min="0" max={it.qty} value={qtys[it.productKey]} onChange={(e) => setQtys({ ...qtys, [it.productKey]: e.target.value })} className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Delivery day</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Delivery time</label>
            <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500">Note to distributor (optional)</label>
          <input placeholder="e.g. Only 30kg available today" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </div>
        <p className="text-[11px] text-gray-400 mb-3">Approving adds the approved Idly / Dosa kg to this distributor's batter stock and sends them a notification.</p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving…" : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRequestsSection({ onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    getAllProductRequests()
      .then((d) => setRequests(d.requests || []))
      .finally(() => setLoading(false));
    if (onChanged) onChanged();
  };
  useEffect(() => { load(); }, []);

  const count = (k) => (k ? requests.filter((r) => r.status === k).length : requests.length);
  const shown = requests.filter((r) => !filter || r.status === filter);

  const reject = async (id) => {
    const note = window.prompt("Reason for rejecting (optional):", "");
    if (note === null) return;
    await rejectProductRequest(id, note);
    load();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.key || "all"} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${filter === t.key ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            {t.label}
            <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${filter === t.key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{count(t.key)}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && <div className="text-center text-gray-400 py-14">Loading…</div>}
        {!loading && shown.length === 0 && <div className="text-center text-gray-400 py-14 text-sm">No product requests for this filter.</div>}
        {!loading && shown.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Distributor</th>
                <th className="text-left px-5 py-3 font-medium">Products</th>
                <th className="text-left px-5 py-3 font-medium">Wants it on</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shown.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 align-top">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{r.distributor?.name}</p>
                    <p className="text-xs text-gray-400">{r.distributor?.employeeId}{r.distributor?.zone?.name ? ` · ${r.distributor.zone.name}` : ""}</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">{new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {r.items.map((it) => (
                      <p key={it.productKey}>
                        {it.productName}: <b>{it.qty} {it.unit}</b>
                        <span className="text-xs text-gray-400"> × {rupees(it.ratePerUnit)}</span>
                        {r.status !== "pending" && r.status !== "rejected" && <span className="text-xs text-teal-600"> (approved {it.approvedQty})</span>}
                      </p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">Total: <b>{rupees(r.totalAmount)}</b></p>
                    {r.distributorNote && <p className="text-xs text-gray-400 mt-0.5">Note: {r.distributorNote}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    <p>{fmtDay(r.requestedDeliveryDate)}</p>
                    <p className="text-xs text-gray-400">{fmtClock(r.requestedDeliveryTime)}</p>
                    {r.deliveryDate && r.status !== "rejected" && (
                      <p className="text-xs text-teal-600 mt-1">Admin sends: {fmtDay(r.deliveryDate)} {fmtClock(r.deliveryTime)}</p>
                    )}
                    {r.adminNote && <p className="text-xs text-gray-400 mt-0.5">Admin note: {r.adminNote}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {r.status === "pending" ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => reject(r._id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium">Reject</button>
                        <button onClick={() => setModal(r)} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium">Approve</button>
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ProductApproveModal request={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </>
  );
}


export default function DailyRequirementPage() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [modalRequest, setModalRequest] = useState(null);
  const [expanded, setExpanded] = useState(null);
  // NEW — "Batter Requests" vs "Product Requests" toggle
  const [section, setSection] = useState("batter");
  const [productPending, setProductPending] = useState(0);
  const refreshProductPending = () =>
    getAllProductRequests({ status: "pending" }).then((d) => setProductPending(d.pendingCount || 0)).catch(() => {});
  useEffect(() => { refreshProductPending(); }, []);
  // NEW — Feature: Daily Requirement date navigator. Lets admin go back
  // (and forward, up to today) to see how many requests were
  // approved/rejected/pending on any given day.
  const [viewDate, setViewDate] = useState(new Date());
  const toISODate = (d) => d.toISOString().slice(0, 10);
  const isToday = (d) => toISODate(d) === toISODate(new Date());
  const shiftDate = (delta) => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + delta);
    if (toISODate(next) > toISODate(new Date())) return; // no future dates
    setViewDate(next);
  };

  const load = () => {
    setLoading(true);
    getAllBatterRequests({ date: toISODate(viewDate) })
      .then((data) => setAllRequests(data.requests || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [viewDate]);

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key ? allRequests.filter((r) => r.status === t.key).length : allRequests.length;
    return acc;
  }, {});

  const filtered = allRequests
    .filter((r) => !filter || r.status === filter)
    .filter((r) => (r.distributor?.name + r.distributor?.employeeId + (r.distributor?.zone?.name || "")).toLowerCase().includes(search.toLowerCase()));

  const handleReject = async (id) => {
    const note = window.prompt("Reason for rejecting (optional):", "");
    if (note === null) return;
    await rejectBatterRequest(id, note);
    load();
  };

  return (
    <DistributorAdminLayout
      icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      title="Daily Requirement"
      subtitle="View and manage daily distributor requirements"
    >
      {/* NEW — section toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSection("batter")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${section === "batter" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>Batter Requests</button>
        <button onClick={() => setSection("products")} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${section === "products" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
          Product Requests
          {productPending > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center">{productPending}</span>}
        </button>
      </div>

      {section === "products" ? (
        <ProductRequestsSection onChanged={refreshProductPending} />
      ) : (
      <>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key || "all"}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${filter === t.key ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
            <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${filter === t.key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* NEW — date navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5 mb-4 max-w-xs">
        <button onClick={() => shiftDate(-1)} className="text-gray-500 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          {isToday(viewDate) ? "Today" : viewDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday(viewDate)}
          className="text-gray-500 p-1 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            </div>
            <p className="font-semibold text-gray-800 text-sm">Daily Requirements</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by distributor name, ID or location…" className="pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm w-72" />
            </div>
            <button onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filter
            </button>
          </div>
        </div>

        {loading && <div className="text-center text-gray-400 py-14">Loading…</div>}

        {!loading && filtered.length === 0 && (
          <EmptyStateIllustration
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            title="No requests for this filter today."
            description="Try changing the filter or check back later for new requests."
            action={
              <button onClick={load} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
            }
          />
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Distributor Name</th>
                <th className="text-left px-5 py-3 font-medium">Distributor ID</th>
                <th className="text-left px-5 py-3 font-medium">Location</th>
                <th className="text-left px-5 py-3 font-medium">Request Date</th>
                <th className="text-left px-5 py-3 font-medium">Requirement Details</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => (
                <Fragment key={r._id}>
                  <tr className="hover:bg-gray-50 align-top">
                    <td className="px-5 py-4 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{r.distributor?.name}</td>
                    <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600 text-xs font-medium">{r.distributor?.employeeId}</span></td>
                    <td className="px-5 py-4 text-gray-500">{r.distributor?.zone?.name || "—"}</td>
                    <td className="px-5 py-4 text-gray-500">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>Req: {r.requestedIdlyKg}kg idly / {r.requestedDosaKg}kg dosa{extrasText(r.requestedExtraItems)}</p>
                      {r.status !== "pending" && <p className="text-xs text-gray-400">Approved: {r.approvedIdlyKg}kg / {r.approvedDosaKg}kg{extrasText(r.approvedExtraItems)}</p>}
                      <button onClick={() => setExpanded(expanded === r._id ? null : r._id)} className="text-[11px] text-teal-600 font-medium mt-1">
                        {expanded === r._id ? "Hide" : "View"} breakdown ({r.customerOrders?.length || 0})
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {r.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleReject(r._id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium">Reject</button>
                          <button onClick={() => setModalRequest(r)} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium">Approve</button>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                  {expanded === r._id && (
                    <tr>
                      <td colSpan={8} className="px-5 pb-4 bg-gray-50">
                        <div className="pt-2 space-y-1">
                          {(r.customerOrders || []).map((c, idx) => (
                            <div key={idx} className="flex justify-between gap-4 text-xs text-gray-600 max-w-xl">
                              <span>{c.shopName || "Customer"}</span>
                              <span>{c.idlyKg}kg idly · {c.dosaKg}kg dosa{extrasText(c.extraItems)}</span>
                            </div>
                          ))}
                          {/* NEW — distributor's requested delivery date/time */}
                          {r.requestedDeliveryDate && (
                            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1 mt-1 inline-block">
                              Distributor wants delivery by: {new Date(r.requestedDeliveryDate).toLocaleDateString("en-IN")}
                              {r.requestedDeliveryTime && ` at ${r.requestedDeliveryTime}`}
                            </p>
                          )}
                          {r.deliveryTime && <p className="text-xs text-gray-500 mt-1">Delivery time: <b>{r.deliveryTime}</b></p>}
                          {r.adminNote && <p className="text-xs text-gray-500">Note: {r.adminNote}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          <span>Showing {filtered.length} of {filtered.length} requests</span>
          <div className="flex items-center gap-2">
            <button disabled className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button disabled className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>

      {modalRequest && (
        <ApproveModal request={modalRequest} onClose={() => setModalRequest(null)} onDone={() => { setModalRequest(null); load(); }} />
      )}
      </>
      )}
    </DistributorAdminLayout>
  );
}