// FILE: src/pages/LiveMapPage.jsx
// OWNER: Imran
// NOTE: Uses iframe embed of Google Maps for now (no library needed)
//       When backend ready, replace with real-time GPS coordinates from API

import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { STATUS_COLOR, getInitials } from "../utils/helpers";

const DUMMY_LOCATIONS = [
  { _id:"e1", name:"Rakesh Kumar", employeeId:"EMP001", status:"Online",  lat:13.0082, lng:80.2574, lastSeen:"2 min ago",  accuracy:15, shopName:"Annas Provision Store" },
  { _id:"e2", name:"Naveen S",     employeeId:"EMP002", status:"Online",  lat:13.0418, lng:80.2341, lastSeen:"5 min ago",  accuracy:22, shopName:"Big Bazaar" },
  { _id:"e3", name:"Divya R",      employeeId:"EMP003", status:"Online",  lat:13.0339, lng:80.2185, lastSeen:"1 min ago",  accuracy:8,  shopName:"Kumar Stores" },
  { _id:"e4", name:"Murugan K",    employeeId:"EMP004", status:"Offline", lat:null,    lng:null,    lastSeen:"2 hrs ago",  accuracy:null, shopName:null },
  { _id:"e5", name:"Priya S",      employeeId:"EMP005", status:"Online",  lat:13.0390, lng:80.2300, lastSeen:"30 sec ago", accuracy:12, shopName:"Daily Fresh Mart" },
];

export default function LiveMapPage() {
  const [selected, setSelected] = useState(null);
  const online  = DUMMY_LOCATIONS.filter(e => e.status === "Online");
  const offline = DUMMY_LOCATIONS.filter(e => e.status === "Offline");

  return (
    <AdminLayout title="Live Field Map">
      <div className="flex gap-5 h-[calc(100vh-140px)]">

        {/* Left panel — employee list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Online */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"/>
              Online ({online.length})
            </p>
            <div className="space-y-2">
              {online.map(emp => (
                <div key={emp._id} onClick={() => setSelected(emp)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer transition ${selected?._id === emp._id ? "border-blue-400 shadow-md" : "border-gray-100 hover:border-blue-200"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-xs font-bold">{getInitials(emp.name)}</div>
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{emp.employeeId}</p>
                    </div>
                  </div>
                  {emp.shopName && <p className="text-xs text-blue-600 truncate">📍 {emp.shopName}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">Last seen: {emp.lastSeen}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Offline ({offline.length})</p>
            <div className="space-y-2">
              {offline.map(emp => (
                <div key={emp._id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 text-xs font-bold">{getInitials(emp.name)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-400">Last seen: {emp.lastSeen}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative">
          {/* Map embed — Chennai area */}
          <iframe
            title="Live Field Map"
            width="100%" height="100%"
            style={{border:0}}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d31107.52!2d80.2341!3d13.0418!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1`}
          />

          {/* Selected employee overlay */}
          {selected && (
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <p>📍 {selected.shopName}</p>
                <p className="font-mono">Lat: {selected.lat?.toFixed(5)}</p>
                <p className="font-mono">Lng: {selected.lng?.toFixed(5)}</p>
                <p>Accuracy: ±{selected.accuracy}m</p>
                <p>Updated: {selected.lastSeen}</p>
              </div>
            </div>
          )}

          {/* Note about real-time */}
          <div className="absolute bottom-4 left-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
            ⚠️ Map is static — real GPS pins will show after backend connects
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}