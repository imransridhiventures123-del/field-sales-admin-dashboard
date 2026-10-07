// FILE: src/pages/CustomerDetailPage.jsx
// NEW FILE — Feature 2: Customer profile + full delivery history
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate, formatDateTime } from "../utils/helpers";
import { getCustomerById, updateCustomerTag, updateWhatsappGroup, updateCustomerPricing } from "../api/customerApi";
import { getProducts } from "../api/productApi";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const statusColor = { pending: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700", skipped: "bg-gray-100 text-gray-500" };
const payColor     = { cash: "bg-green-50 text-green-700", gpay: "bg-blue-50 text-blue-700", mixed: "bg-purple-50 text-purple-700", pending: "bg-red-50 text-red-600" };

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer]     = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [savingTag, setSavingTag]   = useState(false);
  const [waGroup, setWaGroup]       = useState("");
  const [savingWa, setSavingWa]     = useState(false);
  const [waSaved, setWaSaved]       = useState(false);
  // NEW — Feature: per-customer custom pricing
  const [products, setProducts]     = useState([]);
  const [prices, setPrices]         = useState({}); // { [productKey]: string — "" means "use catalog default" }
  const [savingPricing, setSavingPricing] = useState(false);
  const [pricingSaved, setPricingSaved]   = useState(false);
  const [pricingError, setPricingError]   = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getCustomerById(id), getProducts()])
      .then(([d, p]) => {
        setCustomer(d.customer); setDeliveries(d.deliveries || []); setWaGroup(d.customer?.whatsappGroupName || ""); setError(null);
        setProducts((p.products || []).filter((x) => x.isActive !== false));
        const initial = {};
        (d.customer?.customPricing || []).forEach((it) => { initial[it.productKey] = String(it.customerRatePerKg); });
        setPrices(initial);
      })
      .catch(e => { console.error(e); setError("Could not load this customer."); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const setTag = async (tag) => {
    setSavingTag(true);
    try { const d = await updateCustomerTag(id, tag); setCustomer(d.customer); }
    catch (e) { console.error(e); }
    finally { setSavingTag(false); }
  };

  const saveWaGroup = async () => {
    setSavingWa(true); setWaSaved(false);
    try { const d = await updateWhatsappGroup(id, waGroup.trim()); setCustomer(d.customer); setWaSaved(true); setTimeout(()=>setWaSaved(false), 2000); }
    catch (e) { console.error(e); }
    finally { setSavingWa(false); }
  };

  // NEW — Feature: per-customer custom pricing. Only products with a
  // non-empty box are sent — leaving a box blank means "use the normal
  // catalog price for this customer".
  const savePricing = async () => {
    setPricingError(""); setSavingPricing(true); setPricingSaved(false);
    try {
      const items = Object.entries(prices)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([productKey, v]) => ({ productKey, customerRatePerKg: Number(v) }));
      const d = await updateCustomerPricing(id, items);
      setCustomer(d.customer);
      setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000);
    } catch (e) {
      setPricingError(e?.response?.data?.message || "Couldn't save pricing.");
    } finally { setSavingPricing(false); }
  };

  if (loading) return <AdminLayout title="Customer"><div className="h-40 bg-gray-100 rounded-2xl animate-pulse" /></AdminLayout>;
  if (error || !customer) return (
    <AdminLayout title="Customer">
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error || "Customer not found."}</div>
      <button onClick={() => navigate("/customers")} className="mt-4 text-sm text-blue-600 font-semibold">← Back to Customers</button>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Customer Detail">
      <button onClick={() => navigate("/customers")} className="text-sm text-blue-600 font-semibold mb-4 inline-flex items-center gap-1">← Back to Customers</button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
              {customer.shopName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{customer.shopName}</h2>
              <p className="text-sm text-gray-500">{customer.ownerName || "—"} · <a href={`tel:${customer.phone}`} className="text-blue-600 font-medium">+91 {customer.phone}</a></p>
              <p className="text-xs text-gray-400 mt-1">📍 {customer.address || "—"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-gray-400">Tag this customer</span>
            <div className="flex gap-2">
              <button disabled={savingTag} onClick={() => setTag("regular")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${customer.tag === "regular" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                Regular
              </button>
              <button disabled={savingTag} onClick={() => setTag("irregular")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${customer.tag === "irregular" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                Irregular
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Total KG</p><p className="text-lg font-bold text-gray-900">{customer.totalKg}kg</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Total Orders</p><p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Total Billed</p><p className="text-lg font-bold text-gray-900">₹{fmt(customer.totalAmount)}</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 uppercase">Customer Since</p><p className="text-sm font-semibold text-gray-700">{formatDate(customer.firstDeliveryDate)}</p></div>
        </div>

        {/* WhatsApp group — used by the Daily Invoices feature to know which group gets this customer's invoice */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">WhatsApp Group Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={waGroup}
              onChange={e => setWaGroup(e.target.value)}
              placeholder="e.g. ABC Hotel Orders"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={saveWaGroup}
              disabled={savingWa || waGroup.trim() === (customer.whatsappGroupName||"")}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {savingWa ? "Saving..." : waSaved ? "✓ Saved" : "Save"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Paste the exact WhatsApp group name — used to send this customer's daily invoice.</p>
        </div>

        {/* NEW — Feature: per-customer custom pricing */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pricing for this customer</label>

          {customer.addedByDistributor ? (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-xl px-4 py-3">
              This customer was added by their distributor — only the distributor can set pricing for them.
              {(customer.customPricing || []).length > 0 && (
                <div className="mt-2 space-y-1">
                  {customer.customPricing.map((it) => {
                    const p = products.find((x) => x.key === it.productKey);
                    return <p key={it.productKey} className="text-xs">{p?.name || it.productKey}: ₹{it.customerRatePerKg}/{p?.unit || "kg"} <span className="text-amber-500">(distributor's price)</span></p>;
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Leave a box empty to use the normal catalog price for that product. Fill it in to charge this customer a different rate.</p>
              {pricingError && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">{pricingError}</div>}
              <div className="space-y-2 mb-3">
                {products.map((p) => (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">catalog: ₹{p.customerRatePerKg}/{p.unit || "kg"}</span>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                      <input
                        type="number" min="0"
                        value={prices[p.key] ?? ""}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [p.key]: e.target.value }))}
                        placeholder="default"
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-xs text-gray-400">No products in the catalog yet.</p>}
              </div>
              <button
                onClick={savePricing}
                disabled={savingPricing}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPricing ? "Saving..." : pricingSaved ? "✓ Saved" : "Save Pricing"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delivery history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Delivery History</h3>
          <p className="text-xs text-gray-400 mt-0.5">{deliveries.length} deliveries recorded</p>
        </div>
        {deliveries.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No deliveries recorded for this customer yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deliveries.map(d => (
              <div key={d._id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-gray-800">{formatDate(d.deliveryDate)}</p>
                  <p className="text-xs text-gray-400">{d.driver?.name ? `Driver: ${d.driver.name}` : "—"} {d.completedAt && `· ${formatDateTime(d.completedAt)}`}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[d.status]}`}>{d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{d.quantity} kg</span>
                <span className="text-xs font-semibold text-gray-700">₹{fmt(d.totalAmount)}</span>
                {d.status === "completed" && (
                  <>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${payColor[d.paymentType]}`}>{d.paymentType === "gpay" ? "GPay" : d.paymentType?.charAt(0).toUpperCase() + d.paymentType?.slice(1)}</span>
                    <span className="text-xs text-green-700">Received: ₹{fmt(d.amountReceived)}</span>
                    {d.pendingAmount > 0 && <span className="text-xs text-red-500">Pending: ₹{fmt(d.pendingAmount)}</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}