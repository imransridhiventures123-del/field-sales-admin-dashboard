// FILE: src/pages/TargetsPage.jsx — OWNER: Imran
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";

const DUMMY = [
  { _id:"e1", name:"Rakesh Kumar", employeeId:"EMP001", dailyTarget:20, weeklyTarget:100, monthlyTarget:400, todayVisits:8,  weeklyDone:67  },
  { _id:"e2", name:"Naveen S",     employeeId:"EMP002", dailyTarget:20, weeklyTarget:100, monthlyTarget:400, todayVisits:5,  weeklyDone:45  },
  { _id:"e3", name:"Divya R",      employeeId:"EMP003", dailyTarget:15, weeklyTarget:75,  monthlyTarget:300, todayVisits:6,  weeklyDone:52  },
  { _id:"e4", name:"Murugan K",    employeeId:"EMP004", dailyTarget:20, weeklyTarget:100, monthlyTarget:400, todayVisits:3,  weeklyDone:28  },
  { _id:"e5", name:"Priya S",      employeeId:"EMP005", dailyTarget:20, weeklyTarget:100, monthlyTarget:400, todayVisits:7,  weeklyDone:82  },
];

export default function TargetsPage() {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <AdminLayout title="Target Management">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm text-gray-500">Set daily shop visit targets for each field employee. Changes take effect from next working day.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {DUMMY.map(emp => {
            const pct = Math.round((emp.weeklyDone / emp.weeklyTarget) * 100);
            return (
              <div key={emp._id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">{getInitials(emp.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pct>=100?"bg-green-500":pct>=60?"bg-blue-500":"bg-amber-400"}`} style={{width:`${Math.min(pct,100)}%`}}/>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{emp.weeklyDone}/{emp.weeklyTarget} this week</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editing === emp._id ? (
                    <>
                      <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)}
                        className="w-16 border border-blue-300 rounded-xl px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-blue-100"/>
                      <button onClick={()=>setEditing(null)} className="text-xs text-green-600 font-semibold">Save</button>
                      <button onClick={()=>setEditing(null)} className="text-xs text-gray-400">Cancel</button>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{emp.dailyTarget}</p>
                        <p className="text-[10px] text-gray-400">shops/day</p>
                      </div>
                      <button onClick={()=>{ setEditing(emp._id); setEditVal(String(emp.dailyTarget)); }}
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
      </div>
    </AdminLayout>
  );
}