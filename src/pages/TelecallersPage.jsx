// FILE: src/pages/TelecallersPage.jsx — OWNER: Imran
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";
import { getTelecallers, createTelecaller, updateTelecaller, deleteTelecaller } from "../api/telecallersApi";

const STATUS_STYLE = {
  available:   { dot:"bg-green-500",  label:"Available",   text:"text-green-700",  bg:"bg-green-50"  },
  busy:        { dot:"bg-amber-500",  label:"Busy",        text:"text-amber-700",  bg:"bg-amber-50"  },
  unavailable: { dot:"bg-red-400",    label:"Unavailable", text:"text-red-600",    bg:"bg-red-50"    },
};

function AddTelecallerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", phone: "", status: "available" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Phone number must be 10 digits");
      return;
    }

    setSaving(true);
    try {
      const res = await createTelecaller({
        name: form.name.trim(),
        phone: form.phone.trim(),
        status: form.status,
      });
      onCreated(res.telecaller);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create telecaller");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Telecaller</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Priya R"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Initial Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm font-medium text-white bg-blue-600 rounded-xl py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Telecaller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TelecallersPage() {
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadTelecallers = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getTelecallers();
      setTelecallers(res.telecallers || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load telecallers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTelecallers(); }, []);

  const handleSaveStatus = async (id) => {
    try {
      const res = await updateTelecaller(id, { status: newStatus });
      setTelecallers((prev) => prev.map((t) => (t._id === id ? res.telecaller : t)));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update status");
    } finally {
      setEditing(null);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this telecaller?")) return;
    try {
      await deleteTelecaller(id);
      setTelecallers((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to remove telecaller");
    }
  };

  return (
    <AdminLayout title="Telecallers">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{telecallers.length} telecaller{telecallers.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add Telecaller
        </button>
      </div>

      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading telecallers...</p>
      ) : telecallers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          No telecallers yet. Click "Add Telecaller" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {telecallers.map(tc => {
            const s = STATUS_STYLE[tc.status];
            return (
              <div key={tc._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 font-bold">{getInitials(tc.name)}</div>
                      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${s.dot} rounded-full border-2 border-white`}/>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tc.name}</p>
                      <p className="text-xs text-gray-400 font-mono">+91 {tc.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(tc._id)} className="text-gray-300 hover:text-red-500 text-sm" title="Remove">✕</button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  {editing === tc._id ? (
                    <div className="flex items-center gap-2">
                      <select value={newStatus} onChange={e=>setNewStatus(e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 outline-none">
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                      <button onClick={()=>handleSaveStatus(tc._id)} className="text-xs text-green-600 font-semibold">Save</button>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{s.label}
                    </span>
                  )}
                  <button onClick={()=>{ setEditing(tc._id); setNewStatus(tc.status); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {editing===tc._id ? "" : "Edit status"}
                  </button>
                </div>

                <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                  <div className="text-center"><p className="font-bold text-gray-900 text-base">{tc.assignedToday}</p><p>Today</p></div>
                  <div className="text-center"><p className="font-bold text-gray-900 text-base">{tc.totalAssigned}</p><p>Total</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddTelecallerModal
          onClose={() => setShowAddModal(false)}
          onCreated={(tc) => setTelecallers((prev) => [tc, ...prev])}
        />
      )}
    </AdminLayout>
  );
}