// FILE: src/pages/CustomersPage.jsx
// NEW FILE — Feature 2: "Customers" directory
// Every phone number that has ever received a delivery ends up here
// automatically (no duplicates — see Backend customerController.js).
// Admin can tag each customer Regular / Irregular. The "kg sold today"
// headline figure only counts Regular-tagged customers.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";
import { getCustomers } from "../api/customerApi";

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    let active = true;
    getCustomers()
      .then(d => { if (!active) return; setCustomers(d.customers || []); setStats(d.stats || null); setError(null); })
      .catch(e => { if (!active) return; console.error(e); setError("Could not load the customers list."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = customers.filter(c => {
    const matchesSearch = (c.shopName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search);
    const matchesTag = !tagFilter || c.tag === tagFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <AdminLayout title="Customers">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5 text-xs text-blue-700">
        🏬 Every shop you deliver to shows up here automatically — matched by phone number, so the same customer never gets added twice.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Total Customers", v: stats?.totalCustomers ?? "—", c: "text-gray-900", icon: "👥" },
          { l: "Regular",         v: stats?.regularCount   ?? "—", c: "text-green-600", icon: "✅" },
          { l: "Irregular",       v: stats?.irregularCount ?? "—", c: "text-amber-600", icon: "🔁" },
          { l: "KG Sold Today (Regular only)", v: stats ? `${stats.todayKgRegular}kg` : "—", c: "text-blue-600", icon: "⚖️" },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xl">{s.icon}</p>
            <p className={`text-xl font-bold mt-1 ${s.c}`}>{s.v}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-sm flex-1 min-w-[220px]">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shop, owner, phone..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300" />
        </div>
        <div className="flex gap-2">
          {["", "regular", "irregular"].map(t => (
            <button key={t || "all"} onClick={() => setTagFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${tagFilter === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {t === "" ? "All" : t === "regular" ? "Regular" : "Irregular"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-2">🏬</p>
          <p className="text-gray-700 font-semibold">{customers.length === 0 ? "No customers yet" : "No customers match your search"}</p>
          <p className="text-gray-400 text-sm mt-1">{customers.length === 0 && "Add a delivery in the Deliveries tab and the customer will appear here."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c._id} onClick={() => navigate(`/customers/${c._id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 cursor-pointer hover:border-blue-200 transition">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                {c.shopName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900">{c.shopName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.ownerName || "—"} · <span className="text-blue-600 font-medium">+91 {c.phone}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.address || "—"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${c.tag === "regular" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {c.tag === "regular" ? "Regular" : "Irregular"}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-gray-900">{c.totalKg}kg</p>
                <p className="text-[10px] text-gray-400">{c.totalOrders} orders total</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Last: {formatDate(c.lastDeliveryDate)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}