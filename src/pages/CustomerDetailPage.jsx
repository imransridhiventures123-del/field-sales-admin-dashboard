// FILE: src/pages/CustomerDetailPage.jsx
// NEW FILE — Feature 2: Customer profile + full delivery history
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate, formatDateTime } from "../utils/helpers";
import { getCustomerById, updateCustomerTag, updateWhatsappGroup } from "../api/customerApi";

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

  const load = () => {
    setLoading(true);
    getCustomerById(id)
      .then(d => { setCustomer(d.customer); setDeliveries(d.deliveries || []); setWaGroup(d.customer?.whatsappGroupName || ""); setError(null); })
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