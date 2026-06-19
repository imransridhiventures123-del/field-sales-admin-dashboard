// FILE: src/pages/AllVisitsPage.jsx
// OWNER: Naveen

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import DataTable   from "../components/DataTable";
import { formatDateTime, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";

const DUMMY_VISITS = [
  { _id:"v1", shopName:"Annas Provision Store", shopCode:"AP001", ownerName:"Annas",   mobile:"9876540001", employeeName:"Rakesh Kumar", fieldType:"Field Sales", followUpStatus:"interested",   status:"Completed", address:"123 Main St, Chennai", createdAt:new Date().toISOString() },
  { _id:"v2", shopName:"Big Bazaar",            shopCode:"BB001", ownerName:"Ravi",    mobile:"9876540002", employeeName:"Naveen S",     fieldType:"Collection",  followUpStatus:"payment_due",  status:"Completed", address:"456 Anna Salai, Chennai", createdAt:new Date(Date.now()-1800000).toISOString() },
  { _id:"v3", shopName:"Sri Murugan Stores",    shopCode:"SM001", ownerName:"Murugan", mobile:"9876540003", employeeName:"Divya R",      fieldType:"Field Sales", followUpStatus:"callback",     status:"Pending",   address:"789 Gandhi Rd, Chennai", createdAt:new Date(Date.now()-3600000).toISOString() },
  { _id:"v4", shopName:"Kumar Stores",          shopCode:"KS001", ownerName:"Kumar",   mobile:"9876540004", employeeName:"Priya S",      fieldType:"Collection",  followUpStatus:"order_placed", status:"Completed", address:"12 West St, Chennai", createdAt:new Date(Date.now()-5400000).toISOString() },
  { _id:"v5", shopName:"Daily Fresh Mart",      shopCode:"DF001", ownerName:"Rajan",   mobile:"9876540005", employeeName:"Rajan M",      fieldType:"Field Sales", followUpStatus:"not_interested",status:"Rejected", address:"55 North Ave, Chennai", createdAt:new Date(Date.now()-7200000).toISOString() },
];

const COLUMNS = [
  { key:"shopName",      label:"Shop",       render: r => <div><p className="font-medium text-gray-900">{r.shopName}</p><p className="text-xs text-gray-400">{r.shopCode}</p></div> },
  { key:"employeeName",  label:"Employee" },
  { key:"mobile",        label:"Contact",    render: r => <span className="font-mono text-blue-600">+91 {r.mobile}</span> },
  { key:"fieldType",     label:"Type",       render: r => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.fieldType==="Field Sales" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{r.fieldType}</span> },
  { key:"followUpStatus",label:"Follow-up",  render: r => r.followUpStatus ? <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[r.followUpStatus]}`}>{FOLLOWUP_LABEL[r.followUpStatus]}</span> : "—" },
  { key:"status",        label:"Status",     render: r => <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>{r.status}</span> },
  { key:"createdAt",     label:"Time",       render: r => <span className="text-gray-500">{formatDateTime(r.createdAt)}</span> },
];

export default function AllVisitsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");

  const filtered = DUMMY_VISITS.filter(v => {
    const s = search.toLowerCase();
    const matchSearch = v.shopName.toLowerCase().includes(s) || v.employeeName.toLowerCase().includes(s) || v.shopCode.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    const matchType   = typeFilter   === "All" || v.fieldType === typeFilter;
    return matchSearch && matchStatus && matchType;
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

      <p className="text-xs text-gray-400 mb-3">{filtered.length} visit{filtered.length !== 1 ? "s" : ""} found</p>

      <DataTable
        columns={COLUMNS}
        data={filtered}
        onRowClick={(row) => navigate(`/all-visits/${row._id}`)}
        emptyText="No visits match your filters"
      />
    </AdminLayout>
  );
}