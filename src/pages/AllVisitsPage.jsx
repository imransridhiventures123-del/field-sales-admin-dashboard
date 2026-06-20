// FILE: src/pages/AllVisitsPage.jsx
// OWNER: Naveen
// CHANGE: Removed DUMMY_VISITS. Loads real visits from GET /api/admin/visits.
// Status + field-type filters are sent to the backend; the text search box
// filters the loaded page client-side. Also fixed a routing bug — rows were
// navigating to "/all-visits/:id" but the only registered detail route in
// App.jsx is "/visits/:id", so clicking a row used to 404 → redirect to login.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import DataTable   from "../components/DataTable";
import { formatDateTime, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";
import { getAllVisits } from "../api/visitsApi";

const COLUMNS = [
  { key:"shopName",      label:"Shop",       render: r => <div><p className="font-medium text-gray-900">{r.shopName}</p><p className="text-xs text-gray-400">{r.shopCode || "—"}</p></div> },
  { key:"employeeName",  label:"Employee",   render: r => r.employee?.name || "—" },
  { key:"mobile",        label:"Contact",    render: r => r.mobile ? <span className="font-mono text-blue-600">+91 {r.mobile}</span> : "—" },
  { key:"fieldType",     label:"Type",       render: r => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.fieldType==="Field Sales" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{r.fieldType}</span> },
  { key:"followUpStatus",label:"Follow-up",  render: r => r.followUp?.status ? <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[r.followUp.status]}`}>{FOLLOWUP_LABEL[r.followUp.status]}</span> : "—" },
  { key:"status",        label:"Status",     render: r => <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>{r.status}</span> },
  { key:"createdAt",     label:"Time",       render: r => <span className="text-gray-500">{formatDateTime(r.createdAt)}</span> },
];

export default function AllVisitsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [visits, setVisits]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    const fetchVisits = async () => {
      setLoading(true);
      try {
        const data = await getAllVisits({
          page: 1,
          limit: 200,
          status: statusFilter !== "All" ? statusFilter : undefined,
          fieldType: typeFilter !== "All" ? typeFilter : undefined,
        });
        if (!active) return;
        setVisits(data.visits || []);
        setTotal(data.total || 0);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("All visits fetch error:", err.message);
        setError("Could not load visits. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVisits();
    return () => { active = false; };
  }, [statusFilter, typeFilter]);

  const filtered = visits.filter(v => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      (v.shopName || "").toLowerCase().includes(s) ||
      (v.employee?.name || "").toLowerCase().includes(s) ||
      (v.shopCode || "").toLowerCase().includes(s)
    );
  });

  return (
    <AdminLayout title="All Visits">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search shop, employee, code..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300"/>
        </div>
        <div className="flex gap-2">
          {["All","Completed","Pending","Rejected"].map(f => (
            <button key={f} onClick={()=>setStatusFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${statusFilter===f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All","Field Sales","Collection"].map(f => (
            <button key={f} onClick={()=>setTypeFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${typeFilter===f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-500 border-gray-200"}`}>{f}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      <p className="text-xs text-gray-400 mb-3">
        {loading ? "Loading..." : `${filtered.length} visit${filtered.length !== 1 ? "s" : ""} found${search ? "" : ` (of ${total} total)`}`}
      </p>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Loading visits...</p>
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={filtered}
          onRowClick={(row) => navigate(`/visits/${row._id}`)}
          emptyText="No visits match your filters"
        />
      )}
    </AdminLayout>
  );
}