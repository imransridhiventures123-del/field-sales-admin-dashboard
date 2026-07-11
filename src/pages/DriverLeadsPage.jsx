// FILE: src/pages/DriverLeadsPage.jsx
// NEW FILE — Feature 1: "Drivers List"
// A place to manually save backup-driver leads. If a regular driver can't
// come for duty, open this list, pick someone available in the right area,
// and call them straight from the card.
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";
import { getDriverLeads, createDriverLead, updateDriverLead, deleteDriverLead } from "../api/driverLeadApi";

const STATUS_LABEL = { available: "Available", contacted: "Contacted", hired: "Hired", not_interested: "Not Interested" };
const STATUS_COLOR = {
  available:      "bg-green-50 text-green-700 border-green-200",
  contacted:      "bg-amber-50 text-amber-700 border-amber-200",
  hired:          "bg-blue-50 text-blue-700 border-blue-200",
  not_interested: "bg-gray-100 text-gray-500 border-gray-200",
};
const VEHICLE_LABEL = { bike: "🏍️ Bike", auto: "🛺 Auto", van: "🚐 Van", own_lorry: "🚚 Own Lorry", other: "Other" };

function FormField({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400" />
    </div>
  );
}

// ════════════════════════════════════════
// ADD LEAD MODAL
// ════════════════════════════════════════
function AddLeadModal({ onSave, onClose }) {
  const [name, setName]           = useState("");
  const [mobile, setMobile]       = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [area, setArea]           = useState("");
  const [vehicleType, setVehicleType] = useState("bike");
  const [experience, setExperience]   = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [source, setSource]       = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  const handleSave = async () => {
    if (!name.trim()) return setErr("Name is required.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setErr("Enter a valid 10-digit mobile number.");
    setSaving(true); setErr("");
    try {
      await createDriverLead({
        name: name.trim(), mobile, altMobile, area: area.trim(),
        vehicleType, experience: experience.trim(),
        expectedSalary: expectedSalary || undefined, source: source.trim(), notes: notes.trim(),
      });
      onSave();
    } catch (e) { setErr(e.response?.data?.message || "Could not save this lead."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{ maxHeight: "92vh" }}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div><h3 className="font-bold text-gray-900">Add Driver Lead</h3><p className="text-xs text-gray-400 mt-0.5">Save details now, call them only when you actually need a backup</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" value={name} onChange={setName} placeholder="e.g. Kumar" required />
            <FormField label="Mobile" value={mobile} onChange={v => setMobile(v.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" required />
            <FormField label="Alt. Mobile" value={altMobile} onChange={v => setAltMobile(v.replace(/\D/g, "").slice(0, 10))} placeholder="Optional" />
            <FormField label="Area" value={area} onChange={setArea} placeholder="e.g. Perambur" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vehicle</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400">
                {Object.entries(VEHICLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <FormField label="Experience" value={experience} onChange={setExperience} placeholder="e.g. 2 years" />
            <FormField label="Expected Salary (₹)" value={expectedSalary} onChange={setExpectedSalary} type="number" placeholder="Optional" />
            <FormField label="Source" value={source} onChange={setSource} placeholder="e.g. referral, OLX" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Anything worth remembering about this lead"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 resize-none" />
          </div>
          {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
export default function DriverLeadsPage() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]   = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null); // lead id whose card is expanded
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getDriverLeads(statusFilter || undefined)
      .then(d => { setLeads(d.leads || []); setError(null); })
      .catch(e => { console.error(e); setError("Could not load driver leads."); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleStatusChange = async (lead, status) => {
    setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, status } : l));
    await updateDriverLead(lead._id, { status }).catch(load);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this driver lead?")) return;
    setDeleting(id);
    await deleteDriverLead(id).catch(console.error);
    setLeads(prev => prev.filter(l => l._id !== id));
    setDeleting(null);
  };

  const filtered = leads.filter(l =>
    (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.mobile || "").includes(search) ||
    (l.area || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Drivers List">
      {showAdd && <AddLeadModal onSave={() => { setShowAdd(false); load(); }} onClose={() => setShowAdd(false)} />}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5 text-xs text-blue-700">
        📇 Backup driver leads — save them here when you find one, and call from this list the moment your regular driver can't make it for duty.
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-sm flex-1 min-w-[220px]">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile, area..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300" />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">+ Add Driver Lead</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-2">🧑‍✈️</p>
          <p className="text-gray-700 font-semibold">No driver leads yet</p>
          <p className="text-gray-400 text-sm mt-1">Add someone the moment you get a lead — before you actually need them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const isOpen = expanded === lead._id;
            return (
              <div key={lead._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : lead._id)}>
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                    {lead.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{lead.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[lead.status]}`}>{STATUS_LABEL[lead.status]}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">+91 {lead.mobile} · {VEHICLE_LABEL[lead.vehicleType]} {lead.area && `· ${lead.area}`}</p>
                  </div>
                  <a href={`tel:${lead.mobile}`} onClick={e => e.stopPropagation()}
                    className="px-3 py-2 bg-green-50 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-100 flex-shrink-0">📞 Call</a>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div><p className="text-[10px] text-gray-400 uppercase">Alt. Mobile</p><p className="text-sm text-gray-800">{lead.altMobile ? `+91 ${lead.altMobile}` : "—"}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Experience</p><p className="text-sm text-gray-800">{lead.experience || "—"}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Expected Salary</p><p className="text-sm text-gray-800">{lead.expectedSalary ? `₹${lead.expectedSalary}` : "—"}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Source</p><p className="text-sm text-gray-800">{lead.source || "—"}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Added On</p><p className="text-sm text-gray-800">{formatDate(lead.createdAt)}</p></div>
                    </div>
                    {lead.notes && (
                      <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{lead.notes}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <span className="text-xs text-gray-400 mr-1">Mark as:</span>
                      {Object.entries(STATUS_LABEL).map(([k, l]) => (
                        <button key={k} onClick={() => handleStatusChange(lead, k)}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition ${lead.status === k ? STATUS_COLOR[k] : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"}`}>
                          {l}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(lead._id)} disabled={deleting === lead._id}
                        className="ml-auto text-[11px] font-semibold px-3 py-1.5 rounded-full border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-50">
                        {deleting === lead._id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}