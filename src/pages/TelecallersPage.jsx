// FILE: src/pages/TelecallersPage.jsx — OWNER: Imran
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";

const STATUS_STYLE = {
  available:   { dot:"bg-green-500",  label:"Available",   text:"text-green-700",  bg:"bg-green-50"  },
  busy:        { dot:"bg-amber-500",  label:"Busy",        text:"text-amber-700",  bg:"bg-amber-50"  },
  unavailable: { dot:"bg-red-400",    label:"Unavailable", text:"text-red-600",    bg:"bg-red-50"    },
};

const DUMMY = [
  { _id:"tc1", name:"Priya R",   phone:"8925864472", status:"available",   assignedToday:12, totalAssigned:145 },
  { _id:"tc2", name:"Divya S",   phone:"9876541002", status:"available",   assignedToday:8,  totalAssigned:98  },
  { _id:"tc3", name:"Meena K",   phone:"9876541003", status:"busy",        assignedToday:15, totalAssigned:201 },
  { _id:"tc4", name:"Lakshmi P", phone:"9876541004", status:"available",   assignedToday:6,  totalAssigned:77  },
  { _id:"tc5", name:"Kavitha M", phone:"9876541005", status:"unavailable", assignedToday:0,  totalAssigned:54  },
  { _id:"tc6", name:"Anitha B",  phone:"9876541006", status:"available",   assignedToday:10, totalAssigned:132 },
];

export default function TelecallersPage() {
  const [editing, setEditing] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  return (
    <AdminLayout title="Telecallers">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DUMMY.map(tc => {
          const s = STATUS_STYLE[tc.status];
          return (
            <div key={tc._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 font-bold">{getInitials(tc.name)}</div>
                  <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${s.dot} rounded-full border-2 border-white`}/>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{tc.name}</p>
                  <p className="text-xs text-gray-400 font-mono">+91 {tc.phone}</p>
                </div>
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
                    <button onClick={()=>setEditing(null)} className="text-xs text-green-600 font-semibold">Save</button>
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
    </AdminLayout>
  );
}