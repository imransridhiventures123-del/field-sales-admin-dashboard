// FILE: src/pages/LiveMapPage.jsx
// ADDED: Drivers shown on map with green markers (different from blue employee markers)
// Same getLiveLocations API — drivers appear automatically when they share location

import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, OverlayViewF, OVERLAY_MOUSE_TARGET, InfoWindow } from "@react-google-maps/api";
import AdminLayout   from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";
import { getLiveLocations, getEmployees } from "../api/employeesApi";
import { getDrivers } from "../api/deliveryApi";

const POLL_MS        = 3000;
const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };
const MAPS_KEY       = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

function timeAgo(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

// Photo marker — blue for employees, green for drivers
function PhotoMarker({ loc, isSelected, onClick, isDriver }) {
  const person = loc.employee;
  if (!person || !loc.latitude || !loc.longitude) return null;
  const color = isDriver ? "#16a34a" : "#1d4ed8";

  return (
    <OverlayViewF
      position={{ lat: loc.latitude, lng: loc.longitude }}
      mapPaneName={OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(w,h) => ({ x: -w/2, y: -h })}
    >
      <div onClick={onClick} style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", userSelect:"none" }}>
        {isSelected && (
          <div style={{ position:"absolute", width:56, height:56, borderRadius:"50%", border:`3px solid ${color}`, top:-4, left:"50%", transform:"translateX(-50%)", animation:"pulse-ring 1.5s ease-out infinite", opacity:0.5 }} />
        )}
        <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", border:`3px solid ${color}`, boxShadow:"0 2px 8px rgba(0,0,0,0.25)", backgroundColor: isDriver ? "#dcfce7" : "#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          {person.photo
            ? <img src={person.photo} alt={person.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:14, fontWeight:700, color }}>{getInitials(person.name)}</span>
          }
          <div style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", backgroundColor: isDriver ? "#16a34a" : "#3b82f6", border:"2px solid white" }} />
        </div>
        <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:`7px solid ${color}`, marginTop:-1 }} />
        <div style={{ marginTop:2, backgroundColor: isSelected ? color : "rgba(0,0,0,0.7)", color:"#fff", fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:10, whiteSpace:"nowrap" }}>
          {isDriver ? "🚚 " : ""}{person.name.split(" ")[0]}
        </div>
      </div>
    </OverlayViewF>
  );
}

export default function LiveMapPage() {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY, id: "google-map-script" });
  const mapRef = useRef(null);
  const [locations,    setLocations]    = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allDrivers,   setAllDrivers]   = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Load employees + drivers once
  useEffect(() => {
    getEmployees().then(d => setAllEmployees(d.employees || [])).catch(console.error);
    getDrivers().then(d => setAllDrivers(d.drivers || [])).catch(console.error);
  }, []);

  // Poll live locations
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLiveLocations();
        const locs = data.locations || [];
        setLocations(locs);
        setSelected(prev => {
          if (!prev) return null;
          return locs.find(l => l.employee?._id === prev.employee?._id) || null;
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (selected?.latitude && mapRef.current) {
      mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
    }
  }, [selected?.latitude, selected?.longitude]);

  const onlineIds = new Set(locations.map(l => l.employee?._id));
  const offlineEmp = allEmployees.filter(e => !onlineIds.has(e._id) && e.role !== "driver");
  const offlineDrv = allDrivers.filter(d => !onlineIds.has(d._id));

  // Separate online employees and drivers
  const onlineEmployees = locations.filter(l => l.employee?.role !== "driver");
  const onlineDrivers   = locations.filter(l => l.employee?.role === "driver");

  if (!MAPS_KEY) return <AdminLayout title="Live Field Map"><div className="flex items-center justify-center h-96 bg-amber-50 rounded-2xl"><p className="text-amber-700">Add VITE_GOOGLE_MAPS_KEY to .env</p></div></AdminLayout>;
  if (loadError) return <AdminLayout title="Live Field Map"><div className="flex items-center justify-center h-96 bg-red-50 rounded-2xl"><p className="text-red-500">Map failed to load</p></div></AdminLayout>;

  return (
    <AdminLayout title="Live Field Map">
      <div className="flex gap-5 h-[calc(100vh-140px)]">

        {/* Left panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto pr-1 space-y-4">

          {/* Online field sales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block" />
              Field Sales Online ({onlineEmployees.length})
            </p>
            {onlineEmployees.length === 0 && <p className="text-xs text-gray-400 px-1">No employees online</p>}
            {onlineEmployees.map(loc => {
              const emp = loc.employee;
              if (!emp) return null;
              const isSel = selected?.employee?._id === emp._id;
              return (
                <div key={emp._id} onClick={() => setSelected(isSel ? null : loc)}
                  className={`bg-white rounded-2xl border p-3 cursor-pointer mb-2 transition ${isSel ? "border-blue-400 shadow-md" : "border-gray-100 hover:border-blue-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-xs font-bold relative">
                      {getInitials(emp.name)}
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-400">{timeAgo(loc.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Online drivers */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
              Drivers Online ({onlineDrivers.length})
            </p>
            {onlineDrivers.length === 0 && <p className="text-xs text-gray-400 px-1">No drivers online</p>}
            {onlineDrivers.map(loc => {
              const drv = loc.employee;
              if (!drv) return null;
              const isSel = selected?.employee?._id === drv._id;
              return (
                <div key={drv._id} onClick={() => setSelected(isSel ? null : loc)}
                  className={`bg-white rounded-2xl border p-3 cursor-pointer mb-2 transition ${isSel ? "border-green-400 shadow-md" : "border-gray-100 hover:border-green-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-700 text-xs font-bold relative">
                      🚚
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{drv.name}</p>
                      <p className="text-[11px] text-gray-400">{timeAgo(loc.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Offline ({offlineEmp.length + offlineDrv.length})
            </p>
            {[...offlineEmp, ...offlineDrv].map(p => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-3 opacity-50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold">
                    {p.role === "driver" ? "🚚" : getInitials(p.name)}
                  </div>
                  <p className="text-sm text-gray-600">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ height:"100%", width:"100%" }}
              center={selected?.latitude ? { lat:selected.latitude, lng:selected.longitude } : locations[0] ? { lat:locations[0].latitude, lng:locations[0].longitude } : CHENNAI_CENTER}
              zoom={13}
              options={{ streetViewControl:false, fullscreenControl:true, gestureHandling:"greedy" }}
              onLoad={m => { mapRef.current = m; }}
            >
              {locations.map(loc => (
                <PhotoMarker key={loc.employee?._id} loc={loc}
                  isSelected={selected?.employee?._id === loc.employee?._id}
                  isDriver={loc.employee?.role === "driver"}
                  onClick={() => setSelected(selected?.employee?._id === loc.employee?._id ? null : loc)}
                />
              ))}
              {selected?.employee && selected.latitude && (
                <InfoWindow position={{ lat:selected.latitude, lng:selected.longitude }} onCloseClick={() => setSelected(null)}>
                  <div className="p-1 min-w-[150px]">
                    <p className="font-bold text-gray-900 text-sm">{selected.employee.name}</p>
                    <p className="text-xs text-gray-500">{selected.employee.role === "driver" ? "🚚 Driver" : "Field Sales"}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(selected.updatedAt)}</p>
                    <a href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">Open in Google Maps ↗</a>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse-ring { 0% { transform:translateX(-50%) scale(1); opacity:0.5; } 100% { transform:translateX(-50%) scale(1.8); opacity:0; } }`}</style>
    </AdminLayout>
  );
}