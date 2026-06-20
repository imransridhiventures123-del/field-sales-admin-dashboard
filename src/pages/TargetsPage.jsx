// FILE: src/pages/TargetsPage.jsx — OWNER: Imran
// CHANGE: Removed DUMMY data. Loads real employees from GET /api/admin/employees
// and saves edits via PUT /api/admin/employees/:id/target (real DB write).

import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";
import { getEmployees, updateTarget } from "../api/employeesApi";

export default function TargetsPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [editing, setEditing]   = useState(null);
  const [editVal, setEditVal]   = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        if (!active) return;
        setEmployees(data.employees || []);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("Targets fetch error:", err.message);
        setError("Could not load the sales team. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEmployees();
    return () => { active = false; };
  }, []);

  const startEdit = (emp) => {
    setEditing(emp._id);
    setEditVal(String(emp.dailyTarget || 20));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditVal("");
  };

  const saveEdit = async (id) => {
    const value = Number(editVal);
    if (!value || value < 1) return;
    setSaving(true);
    try {
      const data = await updateTarget(id, value);
      // Update just that one employee in local state with the server's response
      setEmployees((prev) =>
        prev.map((e) => (e._id === id ? { ...e, dailyTarget: data.employee?.dailyTarget ?? value } : e))
      );
      setEditing(null);
    } catch (err) {
      console.error("Update target error:", err.message);
      alert("Could not save the target. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Target Management">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Target Management">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm text-gray-500">Set daily shop visit targets for each field employee. Changes are saved immediately.</p>
        </div>
        {employees.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No field employees registered yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map(emp => {
              const weeklyTarget = emp.weeklyTarget || 100;
              const weeklyDone   = emp.weeklyDone || 0;
              const pct = Math.round((weeklyDone / weeklyTarget) * 100);
              return (
                <div key={emp._id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">{getInitials(emp.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${pct>=100?"bg-green-500":pct>=60?"bg-blue-500":"bg-amber-400"}`} style={{width:`${Math.min(pct,100)}%`}}/>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{weeklyDone}/{weeklyTarget} this week</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editing === emp._id ? (
                      <>
                        <input type="number" min="1" value={editVal} onChange={e=>setEditVal(e.target.value)}
                          className="w-16 border border-blue-300 rounded-xl px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-blue-100"/>
                        <button disabled={saving} onClick={()=>saveEdit(emp._id)} className="text-xs text-green-600 font-semibold disabled:opacity-50">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button disabled={saving} onClick={cancelEdit} className="text-xs text-gray-400 disabled:opacity-50">Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{emp.dailyTarget || 20}</p>
                          <p className="text-[10px] text-gray-400">shops/day</p>
                        </div>
                        <button onClick={()=>startEdit(emp)}
                          className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition font-medium">
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}