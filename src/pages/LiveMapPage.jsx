// FILE: src/pages/LiveMapPage.jsx
// OWNER: Imran
// CHANGE: Removed DUMMY_LOCATIONS + static map iframe.
// Now polls GET /api/admin/locations/live every 10s and plots real
// employee GPS pins on an OpenStreetMap (via Leaflet — no API key needed).

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminLayout from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";
import { getLiveLocations } from "../api/employeesApi";
import { getEmployees } from "../api/employeesApi";

const CHENNAI_CENTER = [13.0827, 80.2707];
const POLL_MS = 10000;

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec < 5 ? "just now" : diffSec + " sec ago"}`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// Small colored dot marker — avoids broken default-icon asset paths with bundlers
function dotIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 2px ${color}33;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
const ONLINE_ICON = dotIcon("#16a34a");

// Recenters the map when the selected employee changes
function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected?.latitude && selected?.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 15, { duration: 0.8 });
    }
  }, [selected, map]);
  return null;
}

export default function LiveMapPage() {
  const [locations, setLocations] = useState([]);   // online employees with live GPS
  const [allEmployees, setAllEmployees] = useState([]); // full roster (for offline list)
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  // Fetch the full roster once (for the offline list + names)
  useEffect(() => {
    getEmployees()
      .then((data) => setAllEmployees(data.employees || []))
      .catch((err) => console.error("Employees fetch error:", err.message));
  }, []);

  // Poll live locations every 10s
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await getLiveLocations();
        setLocations(data.locations || []);
      } catch (err) {
        console.error("Live locations fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
    pollRef.current = setInterval(fetchLive, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const onlineIds = new Set(locations.map((l) => l.employee?._id));
  const offline = allEmployees.filter((e) => !onlineIds.has(e._id));

  const center = locations[0]
    ? [locations[0].latitude, locations[0].longitude]
    : CHENNAI_CENTER;

  return (
    <AdminLayout title="Live Field Map">
      <div className="flex gap-5 h-[calc(100vh-140px)]">

        {/* Left panel — employee list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Online */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"/>
              Online ({locations.length})
            </p>
            <div className="space-y-2">
              {loading ? (
                <p className="text-xs text-gray-400 px-1">Loading...</p>
              ) : locations.length === 0 ? (
                <p className="text-xs text-gray-400 px-1">No one is online right now.</p>
              ) : locations.map((loc) => {
                const emp = loc.employee;
                if (!emp) return null;
                return (
                  <div key={emp._id} onClick={() => setSelected(loc)}
                    className={`bg-white rounded-2xl border p-4 cursor-pointer transition ${selected?.employee?._id === emp._id ? "border-blue-400 shadow-md" : "border-gray-100 hover:border-blue-200"}`}>
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
                    <p className="text-[11px] text-gray-400 mt-1">±{loc.accuracy ?? "—"}m · Updated {timeAgo(loc.updatedAt)}</p>
                  </div>
                );
              })}
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
                      <p className="text-[11px] text-gray-400">Last seen: {timeAgo(emp.lastSeen)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative">
          <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToSelected selected={selected} />
            {locations.map((loc) => {
              const emp = loc.employee;
              if (!emp || loc.latitude == null || loc.longitude == null) return null;
              return (
                <Marker
                  key={emp._id}
                  position={[loc.latitude, loc.longitude]}
                  icon={ONLINE_ICON}
                  eventHandlers={{ click: () => setSelected(loc) }}
                >
                  <Popup>
                    <p className="font-semibold">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.employeeId}</p>
                    <p className="text-xs text-gray-500">±{loc.accuracy ?? "—"}m accuracy</p>
                    <p className="text-xs text-gray-400">Updated {timeAgo(loc.updatedAt)}</p>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Selected employee overlay */}
          {selected && selected.employee && (
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-64 z-[1000]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">{selected.employee.name}</p>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <p className="font-mono">Lat: {selected.latitude?.toFixed(5)}</p>
                <p className="font-mono">Lng: {selected.longitude?.toFixed(5)}</p>
                <p>Accuracy: ±{selected.accuracy ?? "—"}m</p>
                <p>Updated: {timeAgo(selected.updatedAt)}</p>
              </div>
            </div>
          )}

          {locations.length === 0 && !loading && (
            <div className="absolute bottom-4 left-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 z-[1000]">
              No employees are currently online. Pins appear here as soon as someone toggles "Online" in the app.
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}