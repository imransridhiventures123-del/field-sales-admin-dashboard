// FILE: src/pages/distributor-admin/DistributorDetailPage.jsx
// UI REDESIGN ONLY — matches the reference screenshot exactly (4
// gradient stat cards, Assigned Customers card with search+filter and
// empty-state illustration, Distributor Details card with copy icons
// and Reset Password). All data calls are unchanged.
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import GradientStatCard from "../../components/GradientStatCard";
import EmptyStateIllustration from "../../components/EmptyStateIllustration";
import {
  getDistributorById,
  unassignCustomer,
  resetDistributorPassword,
  assignCustomerToDistributor,
} from "../../api/distributorApi";
import { getCustomers, updateCustomerPricing } from "../../api/customerApi";
import { getProducts } from "../../api/productApi";
import { getAdminDeliverySummary, getAdminDeliveries, getAdminTodayStatus, getAdminLedger } from "../../api/deliveryApi";
import { DistributorLedgerSection } from "../../components/DistributorLedgerPanel"; // NEW — company ledger (bills + payments)

function CopyField({ icon, label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} /></svg>
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{value || "—"}</span>
        {value && (
          <button onClick={copy} className="text-gray-300 hover:text-teal-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>
        )}
        {copied && <span className="text-[10px] text-green-500">Copied</span>}
      </div>
    </div>
  );
}

export default function DistributorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [distributor, setDistributor] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allCustomers, setAllCustomers] = useState([]);
  const [pickCustomer, setPickCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [showAssign, setShowAssign] = useState(false);   // NEW — assign panel open/closed
  const [assignSearch, setAssignSearch] = useState("");  // NEW — search inside the assign panel
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  // NEW — ask for this customer's pricing right when admin assigns them
  // (the distributor can change it later from their Customers tab).
  const [products, setProducts] = useState([]);
  const [assignPrices, setAssignPrices] = useState({}); // { [productKey]: string }
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  // NEW — today's shop-by-shop status and the ledger for this distributor
  const [todayStatus, setTodayStatus] = useState(null);
  const [ledger, setLedger] = useState(null);
  // NEW (additive) — Feature: real-time distributor workflow. Margin/
  // revenue/credit monitoring for this specific distributor.
  const [summary, setSummary] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);

  const load = () => {
    setLoading(true);
    getDistributorById(id)
      .then((data) => { setDistributor(data.distributor); setCustomers(data.customers || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  // NEW (additive) — load this distributor's performance monitoring data
  useEffect(() => {
    getAdminTodayStatus(id).then(setTodayStatus).catch(() => {});
    getAdminLedger(id).then(setLedger).catch(() => {});
    getProducts().then((d) => setProducts((d.products || []).filter((p) => p.isActive !== false))).catch(() => {});
    getAdminDeliverySummary(id).then(setSummary).catch(() => {});
    getAdminDeliveries({ distributorId: id }).then((d) => setRecentDeliveries(d.records || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    getCustomers?.()
      .then((data) => setAllCustomers(data.customers || data || []))  // ALL customers (search + badges handle the rest)
      .catch(() => {});
  }, [customers]);

  const handleAssign = async () => {
    if (!pickCustomer) return;
    const picked = allCustomers.find((c) => c._id === pickCustomer);
    if (picked?.assignedDistributor && String(picked.assignedDistributor?._id || picked.assignedDistributor) !== String(id)
        && !window.confirm(`${picked.shopName} is already assigned to another distributor. Move to this distributor?`)) return;
    setAssignError("");
    setAssigning(true);
    try {
      await assignCustomerToDistributor(id, pickCustomer);
      // Save whatever price boxes were filled in; a blank box means "use the
      // normal catalog price" for that product.
      const items = Object.entries(assignPrices)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([productKey, v]) => ({ productKey, customerRatePerKg: Number(v) }));
      if (items.length > 0) await updateCustomerPricing(pickCustomer, items);
      setPickCustomer("");
      setAssignPrices({});
      setAssignSearch("");
      setShowAssign(false);
      load();
      getAdminTodayStatus(id).then(setTodayStatus).catch(() => {});
    } catch (err) {
      setAssignError(err?.response?.data?.message || "Couldn't assign this customer. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (customerId) => {
    await unassignCustomer(customerId);
    load();
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setResetMsg("Password must be at least 6 characters."); return; }
    const data = await resetDistributorPassword(id, newPassword);
    setResetMsg(`Password reset. New login: ${data.loginCredentials.employeeId} / ${data.loginCredentials.password}`);
    setNewPassword("");
  };

  // NEW — searchable list for the assign panel: shop, owner, phone, address
  const assignOptions = (() => {
    const q = assignSearch.trim().toLowerCase();
    const list = q
      ? allCustomers.filter((c) => [c.shopName, c.ownerName, c.phone, c.address].some((v) => String(v || "").toLowerCase().includes(q)))
      : allCustomers;
    return list.slice(0, 50);
  })();
  const pickedCustomer = allCustomers.find((c) => c._id === pickCustomer);

  const filteredCustomers = customers.filter((c) => (c.shopName || "").toLowerCase().includes(search.toLowerCase()));

  if (loading || !distributor) {
    return (
      <DistributorAdminLayout
        icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        title="Distributor Details" subtitle="Loading…"
      >
        <div className="text-center text-gray-400 py-10">Loading…</div>
      </DistributorAdminLayout>
    );
  }

  return (
    <DistributorAdminLayout
      icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      title="Distributor Details"
      subtitle="View and manage distributor information, assigned customers and performance"
    >
      <button onClick={() => navigate("/distributor-admin/all")} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to All Distributors
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <GradientStatCard color="teal"   icon="M5 13l4 4L19 7" label="Employee ID" value={distributor.employeeId} />
        <GradientStatCard color="purple" icon="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" label="Zone" value={distributor.zone?.name || "—"} />
        <GradientStatCard color="green"  icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" label="Customers Assigned" value={customers.length} subtext={customers.length ? undefined : "No customers assigned yet"} />
        <GradientStatCard color="orange" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" label="Stock (Idly/Dosa Kg)" value={`${distributor.currentStockKg?.idly || 0} / ${distributor.currentStockKg?.dosa || 0}`} />
      </div>

      {/* NEW (additive) — Feature: real-time distributor workflow.
          Margin/revenue/credit monitoring for this distributor, per
          your feature #7 ("PWA se aatha sob data admin dashboard me
          dhikaana"). */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <GradientStatCard color="teal" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1" label="Today's Margin" value={`₹${summary.todayMargin}`} subtext={`Total: ₹${summary.totalMargin}`} />
          <GradientStatCard color="green" icon="M9 7h6m-6 4h6m-6 4h4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" label="Today's Collections" value={`₹${summary.todayCollections}`} subtext={`Revenue: ₹${summary.todayRevenue}`} />
          <GradientStatCard color="orange" icon="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" label="Today's Credits" value={`₹${summary.todayCredits}`} subtext={`Total credits: ₹${summary.totalCredits}`} />
          <GradientStatCard color="purple" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" label="Total Revenue" value={`₹${summary.totalRevenue}`} subtext="All-time" />
        </div>
      )}

      {/* NEW — today's shops: which shops this distributor took orders for, and their status */}
      {todayStatus && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6" data-testid="today-shops">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="font-semibold text-gray-800">Today's Shops</p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Ordered {todayStatus.totals.shopsOrdered}</span>
              <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">Delivered {todayStatus.totals.shopsDelivered}</span>
              <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700">Pending {todayStatus.totals.shopsPending}</span>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500">Skipped {todayStatus.totals.shopsSkipped}</span>
            </div>
          </div>
          {(todayStatus.shops || []).length === 0 && <p className="text-sm text-gray-400">No orders taken today yet.</p>}
          <div className="divide-y divide-gray-50">
            {(todayStatus.shops || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{s.shopName} <span className="text-[10px] text-gray-400 font-normal">{s.source === "manual" ? "· added by distributor" : "· approved request"}</span></p>
                  <p className="text-xs text-gray-400">{s.idlyKg}kg idly · {s.dosaKg}kg dosa{(s.extraItems || []).map((it) => ` · ${it.qty} ${it.unit || "kg"} ${it.productName || it.productKey}`).join("")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${s.status === "delivered" ? "bg-green-50 text-green-700" : s.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.status === "delivered" ? "✓ Delivered" : s.status === "pending" ? "Pending" : "Skipped"}
                  </span>
                  {s.status === "delivered" && (
                    <p className="text-[11px] text-gray-400 mt-0.5">₹{s.amountCharged} · Cash ₹{s.cashAmount} · GPay ₹{s.onlineAmount} · Credit ₹{s.creditAmount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW — this distributor's customer-wise ledger */}
      {ledger && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6" data-testid="ledger">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="font-semibold text-gray-800">Ledger</p>
            <span className="text-xs text-gray-500">Outstanding <b className="text-red-500">₹{ledger.totals.outstanding}</b> · Ordered ₹{ledger.totals.totalOrdered}</span>
          </div>
          {ledger.customerLedger.length === 0 && <p className="text-sm text-gray-400">No completed orders yet.</p>}
          {ledger.customerLedger.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="text-gray-400 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2 font-medium">Customer</th>
                    <th className="text-right py-2 font-medium">Ordered</th>
                    <th className="text-right py-2 font-medium">Cash</th>
                    <th className="text-right py-2 font-medium">GPay</th>
                    <th className="text-right py-2 font-medium">Credit</th>
                    <th className="text-right py-2 font-medium">Paid back</th>
                    <th className="text-right py-2 font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.customerLedger.map((c) => (
                    <tr key={c.customerId}>
                      <td className="py-2 font-medium text-gray-800">{c.shopName}</td>
                      <td className="py-2 text-right text-gray-600">₹{c.totalOrdered}</td>
                      <td className="py-2 text-right text-gray-600">₹{c.cashPaid}</td>
                      <td className="py-2 text-right text-gray-600">₹{c.onlinePaid}</td>
                      <td className="py-2 text-right text-amber-600">₹{c.creditGiven}</td>
                      <td className="py-2 text-right text-gray-600">₹{c.received}</td>
                      <td className={`py-2 text-right font-semibold ${c.outstanding > 0 ? "text-red-500" : "text-green-600"}`}>{c.outstanding > 0 ? `₹${c.outstanding}` : "Settled"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NEW — this distributor's company ledger: bills for batter/products
          taken from admin + payments made, with date range and PDF. */}
      <DistributorLedgerSection distributorId={id} distributorName={distributor.name} employeeId={distributor.employeeId} />

      {recentDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="font-semibold text-gray-800 mb-3">Recent Deliveries</p>
          <div className="divide-y divide-gray-50">
            {recentDeliveries.slice(0, 8).map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-gray-700">{r.shopName || r.customer?.shopName}</p>
                  <p className="text-xs text-gray-400">{r.idlyKg}kg idly · {r.dosaKg}kg dosa · {new Date(r.date).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-700">₹{r.amountCharged}</p>
                  <span className={`text-[11px] ${r.status === "skipped" ? "text-gray-400" : r.status === "pending" || r.paymentStatus === "credit" ? "text-amber-600" : "text-green-600"}`}>
                    {r.status === "skipped" ? "Skipped" : r.status === "pending" ? "Pending" : r.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Assigned Customers</p>
                <p className="text-xs text-gray-400">Manage customers assigned to this distributor</p>
              </div>
            </div>
            <button onClick={() => setShowAssign((v) => !v)} className="px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              {showAssign ? "Close" : "Assign Customer"}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assigned customers by name or phone…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          {showAssign && (
            <div className="mb-4 border border-teal-100 bg-teal-50/40 rounded-2xl p-3">
              <p className="text-sm font-semibold text-gray-800">Assign a customer</p>
              <p className="text-[11px] text-gray-500 mb-3">Search by shop name, owner, phone or address, then tap a customer.</p>
              <input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Type e.g. hotel sakthi…"
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
              />
              <p className="text-[11px] text-gray-400 mb-1">{assignOptions.length} of {allCustomers.length} customers{assignSearch ? " match" : ""}</p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
                {assignOptions.map((c) => {
                  const ownerId = String(c.assignedDistributor?._id || c.assignedDistributor || "");
                  const here = ownerId && ownerId === String(id);
                  const elsewhere = ownerId && !here;
                  const selected = pickCustomer === c._id;
                  return (
                    <button
                      type="button" key={c._id} disabled={here}
                      onClick={() => { setPickCustomer(c._id); setAssignPrices({}); setAssignError(""); }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 ${selected ? "bg-teal-50" : "hover:bg-gray-50"} ${here ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.shopName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{[c.ownerName, c.phone, c.address].filter(Boolean).join(" · ")}</p>
                      </div>
                      {here && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">Already here</span>}
                      {elsewhere && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">Assigned elsewhere</span>}
                      {selected && <span className="text-teal-600 text-sm">✓</span>}
                    </button>
                  );
                })}
                {assignOptions.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No customer found for “{assignSearch}”.</p>}
              </div>
              {allCustomers.length > 0 && assignOptions.length === 50 && <p className="text-[11px] text-gray-400 mt-1">Showing first 50 — type to narrow down.</p>}
            </div>
          )}
          {pickCustomer && showAssign && (
            <div className="mb-4 bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Pricing for {pickedCustomer?.shopName || "this customer"} (optional)</p>
              <p className="text-[11px] text-gray-400 mb-3">Leave a box empty to use the normal catalog price. The distributor can change it later.</p>
              {assignError && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3" role="alert">{assignError}</div>}
              <div className="space-y-2 mb-3">
                {products.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-gray-700">{p.name}</span>
                    <span className="text-[10px] text-gray-400">catalog ₹{p.customerRatePerKg}</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                      <input
                        type="number" min="0" aria-label={`${p.name} price`}
                        value={assignPrices[p.key] ?? ""}
                        onChange={(e) => setAssignPrices((prev) => ({ ...prev, [p.key]: e.target.value }))}
                        placeholder="default"
                        className="w-full pl-5 pr-2 py-1 rounded-md border border-gray-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-[11px] text-gray-400">No products in the catalog yet.</p>}
              </div>
              <button onClick={handleAssign} disabled={assigning} className="w-full py-2 rounded-xl bg-teal-50 text-teal-600 text-xs font-medium disabled:opacity-60">
                {assigning ? "Assigning…" : `Assign ${pickedCustomer?.shopName || "customer"} to this distributor`}
              </button>
            </div>
          )}

          {filteredCustomers.length === 0 ? (
            <EmptyStateIllustration
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
              title="No customers assigned yet"
              description="This distributor doesn't have any customers assigned. Assign customers to get started."
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <div key={c._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.shopName}</p>
                    <p className="text-xs text-gray-400">{c.phone} · {c.totalKg || 0}kg total</p>
                  </div>
                  <button onClick={() => handleUnassign(c._id)} className="text-xs text-red-500 font-medium">Unassign</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Distributor Details</p>
              <p className="text-xs text-gray-400">PWA login and location information</p>
            </div>
          </div>

          <div className="mb-2">
            <CopyField icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" label="Phone" value={distributor.phone} />
            <CopyField icon="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" label="Address" value={distributor.address ? `${distributor.address}, Chennai Tamil Nadu` : "—"} />
            <CopyField icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" label="Fridge Location" value={distributor.fridgeLocation?.address} />
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Reset PWA Login Password</p>
                <p className="text-xs text-gray-400">Create a new password for distributor PWA access</p>
              </div>
            </div>

            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>

            <button onClick={handleResetPassword} className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Reset Password
            </button>
            {resetMsg && <p className="text-xs text-green-600 mt-2">{resetMsg}</p>}
          </div>
        </div>
      </div>
    </DistributorAdminLayout>
  );
}