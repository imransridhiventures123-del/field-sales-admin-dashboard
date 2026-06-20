// FILE: src/pages/ShopsPage.jsx — OWNER: Naveen
// CHANGE: Removed DUMMY_SHOPS. Loads the real shop directory from
// GET /api/admin/shops (built on the backend by aggregating all Visit
// documents grouped by shopCode).

import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { FOLLOWUP_LABEL, FOLLOWUP_COLOR, formatDate } from "../utils/helpers";
import { getShops } from "../api/visitsApi";

export default function ShopsPage() {
  const [search, setSearch] = useState("");
  const [shops, setShops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    getShops()
      .then((data) => {
        if (!active) return;
        setShops(data.shops || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Shops fetch error:", err.message);
        setError("Could not load the shops database. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = shops.filter(s =>
    (s.shopName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile || "").includes(search)
  );

  return (
    <AdminLayout title="Shops Database">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm mb-5 max-w-sm">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search shop, owner, mobile..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300"/>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{shops.length === 0 ? "No shops have been visited yet." : "No shops match your search."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(shop => (
            <div key={shop._id || shop.shopCode} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{shop.shopName} {shop.shopCode && <span className="text-xs text-gray-400 font-normal font-mono ml-1">{shop.shopCode}</span>}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{shop.ownerName || "—"} · <span className="text-blue-600 font-medium">+91 {shop.mobile || "—"}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{shop.address || "—"}</p>
                  </div>
                  {shop.lastFollowUp && (
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ml-3 flex-shrink-0 ${FOLLOWUP_COLOR[shop.lastFollowUp]}`}>{FOLLOWUP_LABEL[shop.lastFollowUp]}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-gray-900">{shop.totalVisits}</p>
                <p className="text-[10px] text-gray-400">total visits</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Last: {formatDate(shop.lastVisit)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}