// FILE: src/pages/LiveMapPage.jsx
// UPGRADE: Leaflet → Google Maps via @react-google-maps/api
// Full zoom, satellite view, smooth moving markers, street view disabled

import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import AdminLayout    from "../components/AdminLayout";
import { getInitials } from "../utils/helpers";
import { getLiveLocations, getEmployees } from "../api/employeesApi";

const POLL_MS        = 3000;
const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };
const MAPS_KEY       = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

const MAP_OPTIONS = {
  mapTypeControl:    true,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl:       true,
  gestureHandling:   "greedy",
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Custom map marker SVG — green pulsing dot for online employees
function makeMarkerIcon(isSelected) {
  const color  = isSelected ? "#1d4ed8" : "#16a34a";
  const size   = isSelected ? 20 : 16;
  return {
    path: window.google?.maps?.SymbolPath?.CIRCLE ?? 0,
    fillColor:    color,
    fillOpacity:  1,
    strokeColor:  "#fff",
    strokeWeight: 3,
    scale:        size / 2,
  };
}

export default function LiveMapPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    id: "google-map-script",
  });

  const mapRef                              = useRef(null);
  const [locations, setLocations]           = useState([]);
  const [allEmployees, setAllEmployees]     = useState([]);
  const [selected, setSelected]             = useState(null);
  const [loading, setLoading]               = useState(true);

  // Load all employees once (for offline list)
  useEffect(() => {
    getEmployees()
      .then(d => setAllEmployees(d.employees || []))
      .catch(e => console.error(e));
  }, []);

  // Poll live locations every 3 seconds
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLiveLocations();
        const locs = data.locations || [];
        setLocations(locs);
        // Update selected if still online
        setSelected(prev => {
          if (!prev) return null;
          return locs.find(l => l.employee?._id === prev.employee?._id) || null;
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Pan map to selected employee
  useEffect(() => {
    if (selected?.latitude && selected?.longitude && mapRef.current) {
      mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
    }
  }, [selected?.latitude, selected?.longitude]);

  const onMapLoad = useCallback(map => { mapRef.current = map; }, []);

  const onlineIds = new Set(locations.map(l => l.employee?._id));
  const offline   = allEmployees.filter(e => !onlineIds.has(e._id));

  // ── No API key set ──────────────────────────────────────────
  if (!MAPS_KEY) {
    return (
      <AdminLayout title="Live Field Map">
        <div className="flex items-center justify-center h-96 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="text-center">
            <p className="text-amber-700 font-semibold text-lg mb-2">Google Maps API Key Missing</p>
            <p className="text-amber-600 text-sm">Add <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> to your .env file and Vercel environment variables.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Maps API load error ─────────────────────────────────────
  if (loadError) {
    return (
      <AdminLayout title="Live Field Map">
        <div className="flex items-center justify-center h-96 bg-red-50 rounded-2xl border border-red-200">
          <div className="text-center">
            <p className="text-red-700 font-semibold text-lg mb-2">Maps failed to load</p>
            <p className="text-red-500 text-sm">Check that your API key is valid and Maps JavaScript API is enabled.</p>
            <p className="text-red-400 text-xs mt-2">{loadError.message}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Live Field Map">
      <div className="flex gap-5 h-[calc(100vh-140px)]">

        {/* ── Left panel ── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">

          {/* Online */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
              Online ({locations.length})
            </p>
            {loading ? (
              <p className="text-xs text-gray-400 px-1">Loading...</p>
            ) : locations.length === 0 ? (
              <p className="text-xs text-gray-400 px-1">No one online right now.</p>
            ) : (
              locations.map(loc => {
                const emp        = loc.employee;
                if (!emp) return null;
                const isSelected = selected?.employee?._id === emp._id;
                return (
                  <div
                    key={emp._id}
                    onClick={() => setSelected(isSelected ? null : loc)}
                    className={`bg-white rounded-2xl border p-4 cursor-pointer transition mb-2 ${isSelected ? "border-blue-400 shadow-md" : "border-gray-100 hover:border-blue-200"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-xs font-bold">
                          {getInitials(emp.name)}
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{emp.employeeId}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">±{loc.accuracy ?? "—"}m · {timeAgo(loc.updatedAt)}</p>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-blue-50 grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-500">
                        <span>Lat: {loc.latitude?.toFixed(5)}</span>
                        <span>Lng: {loc.longitude?.toFixed(5)}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Offline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Offline ({offline.length})
            </p>
            {offline.map(emp => (
              <div key={emp._id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold">
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{emp.name}</p>
                    <p className="text-[11px] text-gray-400">Last seen: {timeAgo(emp.lastSeen)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Google Map ── */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading Google Maps...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ height: "100%", width: "100%" }}
              center={
                selected?.latitude
                  ? { lat: selected.latitude, lng: selected.longitude }
                  : locations[0]
                  ? { lat: locations[0].latitude, lng: locations[0].longitude }
                  : CHENNAI_CENTER
              }
              zoom={13}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {/* Employee markers */}
              {locations.map(loc => {
                const emp = loc.employee;
                if (!emp || !loc.latitude || !loc.longitude) return null;
                const isSelected = selected?.employee?._id === emp._id;
                return (
                  <Marker
                    key={emp._id}
                    position={{ lat: loc.latitude, lng: loc.longitude }}
                    icon={makeMarkerIcon(isSelected)}
                    title={emp.name}
                    onClick={() => setSelected(isSelected ? null : loc)}
                    animation={isSelected ? window.google?.maps?.Animation?.BOUNCE : null}
                  />
                );
              })}

              {/* InfoWindow on selected employee */}
              {selected?.employee && selected.latitude && (
                <InfoWindow
                  position={{ lat: selected.latitude, lng: selected.longitude }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="p-1 min-w-[160px]">
                    <p className="font-bold text-gray-900 text-sm">{selected.employee.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{selected.employee.employeeId}</p>
                    <p className="text-xs text-gray-400 mt-1">±{selected.accuracy ?? "—"}m accuracy</p>
                    <p className="text-xs text-gray-400">{timeAgo(selected.updatedAt)}</p>
                    <a
                      href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* No one online overlay */}
          {isLoaded && locations.length === 0 && !loading && (
            <div className="absolute bottom-4 left-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 z-10">
              No employees online. Green dots appear when someone goes Online in the app.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}