// FILE: src/pages/DeliveriesPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import AdminLayout from "../components/AdminLayout";
import {
  getDrivers, getDriverDeliveries,
  createDelivery, updateDelivery, deleteDelivery,
  createDriver, deleteDriver,
} from "../api/deliveryApi";

const today    = () => new Date().toISOString().split("T")[0];
const fmt      = (n) => Number(n || 0).toLocaleString("en-IN");
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
const CHENNAI  = { lat: 13.0827, lng: 80.2707 };
const SHOP_KEY = "sridhi_delivery_shops"; // localStorage key

// ─── localStorage shop helpers ─────────────────────────────
function saveShopToLocal(shop) {
  try {
    const all = JSON.parse(localStorage.getItem(SHOP_KEY) || "[]");
    const filtered = all.filter(s => s.shopName.toLowerCase() !== shop.shopName.toLowerCase());
    filtered.unshift({ ...shop, savedAt: Date.now() });
    localStorage.setItem(SHOP_KEY, JSON.stringify(filtered.slice(0, 100)));
  } catch {}
}
function searchShopsLocal(query) {
  try {
    const all = JSON.parse(localStorage.getItem(SHOP_KEY) || "[]");
    if (!query.trim()) return all.slice(0, 6);
    return all.filter(s => s.shopName.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  } catch { return []; }
}

// ─── Reverse geocode ───────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const url  = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`;
    const data = await fetch(url, { headers: { Accept: "application/json" } }).then(r => r.json());
    return data.display_name || "";
  } catch { return ""; }
}

// ─── Navigate map to area via Nominatim ───────────────────
async function geocodeArea(q) {
  try {
    const query = q.includes("India") ? q : `${q}, India`;
    const url   = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`;
    const data  = await fetch(url, { headers: { Accept: "application/json" } }).then(r => r.json());
    if (data?.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

// ════════════════════════════════════════
// MAP PICKER MODAL
// ════════════════════════════════════════
function MapPickerModal({ initialArea, onConfirm, onClose }) {
  // Load Maps directly inside modal — avoids conflict with LiveMapPage loader
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_KEY,
    id: "deliveries-map",
  });

  const [center,     setCenter]     = useState(CHENNAI);
  const [zoom,       setZoom]       = useState(13);
  const [pin,        setPin]        = useState(null);
  const [pinAddress, setPinAddress] = useState("");
  const [searchVal,  setSearchVal]  = useState(initialArea || "");
  const [searching,  setSearching]  = useState(false);
  const [geocoding,  setGeocoding]  = useState(false);
  const [msg,        setMsg]        = useState("");

  // Auto-search when modal opens
  useEffect(() => {
    if (initialArea?.trim().length > 2) doSearch(initialArea);
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setSearching(true); setMsg("");
    const c = await geocodeArea(q);
    if (c) { setCenter(c); setZoom(16); }
    else   { setMsg("Area not found — try 'Perambur Chennai' or 'T Nagar'"); }
    setSearching(false);
  };

  const handleClick = async (e) => {
    const lat = e.latLng.lat(), lng = e.latLng.lng();
    setPin({ lat, lng });
    setCenter({ lat, lng });
    setZoom(18);
    setGeocoding(true);
    const addr = await reverseGeocode(lat, lng);
    setPinAddress(addr);
    setGeocoding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           style={{ width: "min(700px, 95vw)", height: "min(600px, 90vh)" }}>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">📍 Pick Shop Location on Map</h3>
            <p className="text-xs text-gray-400">Search area → click exact shop → address fills automatically</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 flex items-center justify-center font-bold">✕</button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(searchVal)}
              placeholder="Type area: Perambur Chennai / T Nagar / Anna Nagar..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button onClick={() => doSearch(searchVal)} disabled={searching}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-60">
              {searching ? "..." : "Go →"}
            </button>
          </div>
          {msg
            ? <p className="text-xs text-amber-600 mt-1">⚠️ {msg}</p>
            : <p className="text-xs text-gray-400 mt-1">💡 After navigating to area — <b>click exact shop on map</b> to pin it</p>
          }
        </div>

        {/* Map — takes all remaining space */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {loadError ? (
            <div className="h-full flex items-center justify-center bg-red-50">
              <p className="text-sm text-red-500">Map failed to load. Check API key.</p>
            </div>
          ) : !isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center}
              zoom={zoom}
              onClick={handleClick}
              options={{ streetViewControl:false, mapTypeControl:true, fullscreenControl:false, gestureHandling:"greedy" }}
            >
              {pin && <Marker position={pin} animation={window.google?.maps?.Animation?.DROP} />}
            </GoogleMap>
          )}

          {/* Instruction overlay */}
          {isLoaded && !pin && (
            <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.75)", color:"#fff", padding:"8px 18px", borderRadius:24, fontSize:12, pointerEvents:"none", whiteSpace:"nowrap" }}>
              👆 Click on the exact shop location to pin it
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          {pin ? (
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                {geocoding
                  ? <p className="text-sm text-blue-500 flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />Getting address...</p>
                  : <><p className="text-[10px] text-blue-500 font-bold uppercase">Pinned Address</p>
                     <p className="text-sm text-blue-900 font-medium leading-snug">{pinAddress || "Address loading..."}</p></>
                }
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-1">
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                    <p className="text-[9px] font-bold text-green-600">LAT</p>
                    <p className="text-xs font-mono font-bold text-green-800">{pin.lat.toFixed(6)}</p>
                  </div>
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                    <p className="text-[9px] font-bold text-green-600">LNG</p>
                    <p className="text-xs font-mono font-bold text-green-800">{pin.lng.toFixed(6)}</p>
                  </div>
                </div>
                <button onClick={() => onConfirm(pin.lat, pin.lng, pinAddress)} disabled={geocoding}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 flex-shrink-0">
                  ✓ Use Location
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Wrong spot? Click elsewhere on map to reposition.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Search area → click exact shop building on map</p>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// ADDRESS FIELD — auto-opens map on typing
// ════════════════════════════════════════
function AddressField({ value, onChange, lat, lng, onLocationPicked }) {
  const [showMap,  setShowMap]  = useState(false);
  const autoOpenRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    // Auto-open map after user stops typing (1.2s delay)
    clearTimeout(autoOpenRef.current);
    if (val.trim().length >= 3 && !lat) {
      autoOpenRef.current = setTimeout(() => setShowMap(true), 1200);
    }
  };

  const handleConfirm = (newLat, newLng, addr) => {
    onLocationPicked(addr || value, newLat, newLng);
    setShowMap(false);
  };

  return (
    <div>
      {showMap && (
        <MapPickerModal
          initialArea={value}
          onConfirm={handleConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        Address <span className="text-red-400">*</span>
        <span className="text-blue-400 normal-case font-normal ml-2">— type area name → map opens automatically</span>
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Type area: Perambur, Chennai → map opens to pick exact shop"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400"
        />
        <button type="button" onClick={() => setShowMap(true)}
          title="Open map"
          className="w-11 h-11 flex items-center justify-center border-2 border-dashed border-blue-300 rounded-xl text-xl hover:bg-blue-50 hover:border-blue-400 transition flex-shrink-0">
          🗺️
        </button>
      </div>

      {lat && lng ? (
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <p className="text-[10px] text-green-600 font-bold">LAT ✓</p>
            <p className="text-xs font-mono text-green-800">{Number(lat).toFixed(6)}</p>
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <p className="text-[10px] text-green-600 font-bold">LNG ✓</p>
            <p className="text-xs font-mono text-green-800">{Number(lng).toFixed(6)}</p>
          </div>
          <button type="button" onClick={() => setShowMap(true)}
            className="flex-shrink-0 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-100">
            Change
          </button>
        </div>
      ) : value.length >= 3 ? (
        <p className="text-[11px] text-amber-600 mt-1.5">
          ⏳ Map opening automatically... or click 🗺️ to open now
        </p>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════
// SHOP NAME — localStorage autocomplete
// ════════════════════════════════════════
function ShopNameField({ value, onChange, onShopSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showList,    setShowList]    = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowList(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    const results = searchShopsLocal(val);
    setSuggestions(results);
    setShowList(results.length > 0);
  };

  const handleFocus = () => {
    const results = searchShopsLocal(value);
    setSuggestions(results);
    if (results.length) setShowList(true);
  };

  return (
    <div ref={wrapRef} className="relative col-span-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        Shop Name <span className="text-red-400">*</span>
        {suggestions.length > 0 && <span className="text-blue-400 normal-case font-normal ml-2">— click to auto-fill all fields</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={handleFocus}
        placeholder="e.g. Annas Mess — past shops appear as suggestions"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400"
      />

      {showList && suggestions.length > 0 && (
        <div className="absolute z-[200] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-[11px] font-bold text-blue-700">🏪 Previous customers — 1 click to fill all fields</p>
          </div>
          {suggestions.map((shop, i) => (
            <button key={i} type="button"
              onClick={() => { onShopSelect(shop); setShowList(false); }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{shop.shopName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{shop.ownerName} · {shop.phone}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">📍 {shop.address}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${shop.latitude ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {shop.latitude ? "GPS ✓" : "No GPS"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// FORM FIELD
// ════════════════════════════════════════
function FormField({ label, value, onChange, type="text", placeholder="", required=false }) {
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
// NEW DRIVER MODAL
// ════════════════════════════════════════
function NewDriverModal({ onSave, onClose }) {
  const [name,setName]=useState(""); const [mobile,setMobile]=useState(""); const [pass,setPass]=useState(""); const [saving,setSaving]=useState(false); const [err,setErr]=useState("");
  const go = async () => {
    if (!name.trim()) return setErr("Name required.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setErr("Valid 10-digit mobile.");
    if (pass.length<6) return setErr("Password min 6 chars.");
    setSaving(true); setErr("");
    try { await createDriver({name:name.trim(),mobile,password:pass}); onSave(); }
    catch(e) { setErr(e.response?.data?.message||"Failed."); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div><h3 className="font-bold text-gray-900">Create Driver Account</h3><p className="text-xs text-gray-400 mt-0.5">Driver logs in via mobile app</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Full Name" value={name} onChange={setName} placeholder="e.g. Raju Kumar" required />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mobile <span className="text-red-400">*</span></label>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400">
              <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200">+91</span>
              <input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,""))} placeholder="9876543210" maxLength={10} className="flex-1 px-3 py-2.5 text-sm outline-none"/>
            </div>
          </div>
          <FormField label="Password" value={pass} onChange={setPass} type="password" placeholder="Min 6 characters" required />
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={go} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{saving?"Creating...":"Create Driver"}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// ADD / EDIT DELIVERY MODAL
// ════════════════════════════════════════
function DeliveryModal({ driverId, delivery, onSave, onClose }) {
  const isEdit = !!delivery;
  const [shopName,    setShopName]    = useState(delivery?.shopName    || "");
  const [ownerName,   setOwnerName]   = useState(delivery?.ownerName   || "");
  const [phone,       setPhone]       = useState(delivery?.phone       || "");
  const [address,     setAddress]     = useState(delivery?.address     || "");
  const [latitude,    setLatitude]    = useState(delivery?.latitude    || "");
  const [longitude,   setLongitude]   = useState(delivery?.longitude   || "");
  const [productName, setProductName] = useState(delivery?.productName || "Idly Batter");
  const [quantity,    setQuantity]    = useState(String(delivery?.quantity    || ""));
  const [totalAmount, setTotalAmount] = useState(String(delivery?.totalAmount || ""));
  const [sortOrder,   setSortOrder]   = useState(String(delivery?.sortOrder   || ""));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const fillFromShop = (shop) => {
    setShopName(shop.shopName || ""); setOwnerName(shop.ownerName || "");
    setPhone(shop.phone || ""); setAddress(shop.address || "");
    setLatitude(shop.latitude || ""); setLongitude(shop.longitude || "");
    if (shop.productName) setProductName(shop.productName);
    if (shop.totalAmount) setTotalAmount(String(shop.totalAmount));
  };

  const fillLocation = (addr, lat, lng) => {
    if (addr) setAddress(addr);
    setLatitude(lat); setLongitude(lng);
  };

  const handleSave = async () => {
    if (!shopName||!ownerName||!phone||!address||!quantity||!totalAmount)
      return setError("Fill all required fields.");
    setSaving(true); setError("");
    try {
      const payload = {
        driver:driverId, shopName:shopName.trim(), ownerName:ownerName.trim(),
        phone:phone.trim(), address:address.trim(),
        latitude: latitude?Number(latitude):undefined,
        longitude:longitude?Number(longitude):undefined,
        productName:productName.trim(), quantity:Number(quantity),
        totalAmount:Number(totalAmount), sortOrder:Number(sortOrder)||0, deliveryDate:today(),
      };
      if (isEdit) await updateDelivery(delivery._id, payload);
      else        await createDelivery(payload);
      // Save to localStorage for future suggestions
      saveShopToLocal({ shopName:shopName.trim(), ownerName:ownerName.trim(), phone:phone.trim(),
        address:address.trim(), latitude:payload.latitude, longitude:payload.longitude,
        productName:productName.trim(), totalAmount:Number(totalAmount) });
      onSave();
    } catch(e) { setError(e.response?.data?.message||"Save failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{ maxHeight:"92vh" }}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-gray-900">{isEdit?"Edit Delivery":"Add Delivery"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <ShopNameField value={shopName} onChange={setShopName} onShopSelect={fillFromShop} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="e.g. Annas" required />
            <FormField label="Phone" value={phone} onChange={setPhone} placeholder="9999999999" type="tel" required />
          </div>
          <AddressField value={address} onChange={setAddress} lat={latitude} lng={longitude} onLocationPicked={fillLocation} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Product" value={productName} onChange={setProductName} placeholder="Idly Batter" />
            <FormField label="Qty (KG)" value={quantity} onChange={setQuantity} type="number" placeholder="50" required />
            <FormField label="Total Bill (₹)" value={totalAmount} onChange={setTotalAmount} type="number" placeholder="2500" required />
            <FormField label="Priority" value={sortOrder} onChange={setSortOrder} type="number" placeholder="1" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {saving?"Saving...":isEdit?"Update":"Add Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
export default function DeliveriesPage() {
  const [drivers,     setDrivers]     = useState([]);
  const [activeDriver,setActive]      = useState(null);
  const [deliveries,  setDeliveries]  = useState([]);
  const [date,        setDate]        = useState(today());
  const [loading,     setLoading]     = useState(false);
  const [modal,       setModal]       = useState(null);
  const [driverModal, setDriverModal] = useState(false);
  const [deleting,    setDeleting]    = useState(null);

  const loadDrivers = () => {
    getDrivers().then(d=>{const list=d.drivers||[];setDrivers(list);if(list.length&&!activeDriver)setActive(list[0]);}).catch(console.error);
  };

  const loadDeliveries = useCallback((showLoading=false) => {
    if (!activeDriver) return Promise.resolve();
    if (showLoading) setLoading(true);
    return getDriverDeliveries(activeDriver._id, date)
      .then(d => setDeliveries(d.deliveries || []))
      .catch(console.error)
      .finally(() => { if (showLoading) setLoading(false); });
  }, [activeDriver, date]);

  useEffect(() => { loadDrivers(); }, []);
  useEffect(() => { loadDeliveries(true); }, [loadDeliveries]);

  // Auto-refresh so driver completions show up without manual page reload
  useEffect(() => {
    if (!activeDriver) return;
    const poll = () => {
      if (document.visibilityState === "visible") loadDeliveries();
    };
    const id = setInterval(poll, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") loadDeliveries(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [activeDriver, loadDeliveries]);

  const refresh = () => { setModal(null); loadDeliveries(); };

  const handleDelete=async(id)=>{
    if(!window.confirm("Delete this delivery?"))return;
    setDeleting(id);
    await deleteDelivery(id).catch(console.error);
    setDeliveries(p=>p.filter(d=>d._id!==id));
    setDeleting(null);
  };

  const summary={
    total:deliveries.length, done:deliveries.filter(d=>d.status==="completed").length,
    kg:deliveries.reduce((s,d)=>s+d.quantity,0), bill:deliveries.reduce((s,d)=>s+d.totalAmount,0),
    paid:deliveries.reduce((s,d)=>s+(d.amountReceived||0),0), pending:deliveries.reduce((s,d)=>s+(d.pendingAmount||0),0),
  };
  const statusC={pending:"bg-amber-100 text-amber-700",completed:"bg-green-100 text-green-700",skipped:"bg-gray-100 text-gray-500"};
  const payC={cash:"bg-green-50 text-green-700",gpay:"bg-blue-50 text-blue-700",mixed:"bg-purple-50 text-purple-700",pending:"bg-red-50 text-red-600"};

  return (
    <AdminLayout title="Deliveries">
      {modal!==null&&<DeliveryModal driverId={activeDriver?._id} delivery={modal==="add"?null:modal} onSave={refresh} onClose={()=>setModal(null)}/>}
      {driverModal&&<NewDriverModal onSave={()=>{setDriverModal(false);loadDrivers();}} onClose={()=>setDriverModal(false)}/>}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-gray-900">Daily Deliveries</h1><p className="text-sm text-gray-500 mt-0.5">Assign and track driver deliveries</p></div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
          <button onClick={()=>setDriverModal(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">+ New Driver</button>
          {activeDriver&&<button onClick={()=>setModal("add")} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">+ Add Delivery</button>}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Drivers */}
        <div className="w-56 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Drivers</p>
          {drivers.length===0?(
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">🚚</p><p className="text-sm font-semibold text-blue-800">No drivers yet</p>
              <button onClick={()=>setDriverModal(true)} className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700">+ Create Driver</button>
            </div>
          ):drivers.map(d=>(
            <div key={d._id} className={`rounded-2xl border p-4 mb-2 transition ${activeDriver?._id===d._id?"border-blue-400 bg-blue-50":"border-gray-100 bg-white hover:border-blue-200"}`}>
              <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setActive(d)}>
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">{d.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-400">+91 {d.mobile}</p>
                  <p className="text-xs font-mono text-gray-400">{d.employeeId}</p>
                </div>
              </div>
              <button onClick={async()=>{if(!window.confirm(`Delete ${d.name}?`))return;await deleteDriver(d._id).catch(console.error);loadDrivers();if(activeDriver?._id===d._id)setActive(null);}}
                className="mt-2 w-full text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg py-1 hover:bg-red-50">Remove</button>
            </div>
          ))}
        </div>

        {/* Deliveries */}
        <div className="flex-1 min-w-0">
          {deliveries.length>0&&(
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[{l:"Total",v:summary.total,c:"text-gray-900"},{l:"Done",v:summary.done,c:"text-green-600"},{l:"KG",v:`${summary.kg}kg`,c:"text-blue-600"},{l:"Bill",v:`₹${fmt(summary.bill)}`,c:"text-gray-900"},{l:"Collected",v:`₹${fmt(summary.paid)}`,c:"text-green-600"},{l:"Pending",v:`₹${fmt(summary.pending)}`,c:"text-red-500"}].map(s=>(
                <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400">{s.l}</p><p className={`text-sm font-bold mt-0.5 ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
          )}
          {loading?[1,2,3].map(i=><div key={i} className="h-28 bg-gray-100 rounded-2xl mb-3 animate-pulse"/>):
           deliveries.length===0?(
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <p className="text-4xl mb-3">🚚</p>
              <p className="text-gray-700 font-semibold">No deliveries assigned</p>
              <p className="text-gray-400 text-sm mt-1">{activeDriver?`Click "+ Add Delivery" to assign shops to ${activeDriver.name}`:"Select a driver first"}</p>
            </div>
           ):deliveries.map((d,i)=>(
            <div key={d._id} className={`bg-white rounded-2xl border mb-3 p-4 ${d.status==="completed"?"border-green-200":d.status==="skipped"?"border-gray-200 opacity-60":"border-gray-100"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${d.status==="completed"?"bg-green-500 text-white":"bg-blue-100 text-blue-700"}`}>
                  {d.status==="completed"?"✓":(d.sortOrder||i+1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div><p className="font-semibold text-gray-900">{d.shopName}</p><p className="text-xs text-gray-500">{d.ownerName} · {d.phone}</p></div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusC[d.status]}`}>{d.status.charAt(0).toUpperCase()+d.status.slice(1)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">📍 {d.address}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{d.quantity} kg</span>
                    <span className="text-xs font-semibold text-gray-700">₹{fmt(d.totalAmount)}</span>
                    {d.status==="completed"&&<><span className={`text-xs font-semibold px-2 py-1 rounded-full ${payC[d.paymentType]}`}>{d.paymentType==="gpay"?"GPay":d.paymentType?.charAt(0).toUpperCase()+d.paymentType?.slice(1)}</span><span className="text-xs text-green-700">Received: ₹{fmt(d.amountReceived)}</span>{d.pendingAmount>0&&<span className="text-xs text-red-500">Pending: ₹{fmt(d.pendingAmount)}</span>}</>}
                  </div>
                  {d.notes&&<p className="text-xs text-gray-400 mt-1 italic">"{d.notes}"</p>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {d.latitude&&d.longitude&&<a href={`https://maps.google.com/?q=${d.latitude},${d.longitude}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-center">Maps ↗</a>}
                  {d.status==="pending"&&<button onClick={()=>setModal(d)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Edit</button>}
                  <button onClick={()=>handleDelete(d._id)} disabled={deleting===d._id} className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50">{deleting===d._id?"...":"Del"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}