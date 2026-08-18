// FILE: src/pages/DeliveriesPage.jsx
// ADDED:
// 1. Map tab — delivery pins (fixed) + driver moving location
// 2. Porter tab — show deliveries moved to porter section
// 3. Lat/lng manual input (no map picker required)

import { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import AdminLayout from "../components/AdminLayout";
import InvoiceTypeModal from "../components/InvoiceTypeModal";
import {
  getDrivers, getDriverDeliveries, getAllDeliveries,
  createDelivery, updateDelivery, deleteDelivery,
  createDriver, deleteDriver, updateDriverRoute,
} from "../api/deliveryApi";
import { searchCustomers } from "../api/customerApi";
import { getLiveLocations } from "../api/employeesApi";

const today    = () => new Date().toISOString().split("T")[0];
const fmt      = (n) => Number(n||0).toLocaleString("en-IN");

// FIX: some delivery documents in the DB predate later schema fields
// (status, quantity, totalAmount, ownerName, phone, address, paymentType,
// amountReceived, pendingAmount, sortOrder) — so the API can legitimately
// return objects where these are missing/undefined. Every place in this
// page that reads them (list cards, porter cards, map view, summary
// totals) assumed they'd always be present and crashed on
// `undefined.charAt(...)` / NaN math. Normalizing once, right where data
// enters the component, means every downstream usage stays safe without
// having to litter `|| ""` / `?.` everywhere.
const normalizeDelivery = (d) => ({
  ...d,
  status:         d.status || "pending",
  ownerName:      d.ownerName || "",
  phone:          d.phone || "",
  address:        d.address || "",
  quantity:       Number(d.quantity) || 0,
  totalAmount:    Number(d.totalAmount) || 0,
  amountReceived: Number(d.amountReceived) || 0,
  pendingAmount:  Number(d.pendingAmount) || 0,
  paymentType:    d.paymentType || "pending",
  sortOrder:      Number(d.sortOrder) || 0,
  gstEnabled:     Boolean(d.gstEnabled),
  gstAmount:      Number(d.gstAmount) || 0,
});
const normalizeList = (arr) => (arr || []).map(normalizeDelivery);
// FIX (GST not reflected on cards): `totalAmount` is intentionally stored
// PRE-GST on the backend (see driverController's computeDeliveryPricing
// comment — invoices apply GST separately at download time, so storing a
// GST-inclusive totalAmount there would double-charge GST on the invoice
// PDF). That's correct for invoicing, but every card in this page was
// displaying that raw pre-GST totalAmount even when GST was ON — so a
// delivery assigned with GST enabled showed a lower amount on its card
// than what was actually confirmed at assign time. This computes the
// GST-inclusive figure purely for card display, without touching how
// totalAmount is stored or how invoices calculate GST.
const cardTotal = (d) => Math.round(((d.totalAmount||0) + (d.gstEnabled ? (d.gstAmount||0) : 0) + Number.EPSILON) * 100) / 100;
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
const LIBS     = [];
const CHENNAI  = { lat: 13.0827, lng: 80.2707 };
const SHOP_KEY = "sridhi_delivery_shops";

function saveShopToLocal(s) {
  try {
    const all = JSON.parse(localStorage.getItem(SHOP_KEY)||"[]");
    const f   = all.filter(x => x.shopName.toLowerCase() !== s.shopName.toLowerCase());
    f.unshift({...s, savedAt:Date.now()});
    localStorage.setItem(SHOP_KEY, JSON.stringify(f.slice(0,100)));
  } catch {}
}

// ── FormField ─────────────────────────────────────────────
function FormField({ label, value, onChange, type="text", placeholder="", required=false, hint="", readOnly=false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-blue-400 normal-case font-normal ml-2">{hint}</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        step={type==="number"?"any":undefined} readOnly={readOnly}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${readOnly?"bg-gray-50 border-gray-100 text-gray-500":"border-gray-200 text-gray-800 focus:border-blue-400"}`}/>
    </div>
  );
}

// ── Shop name field with DATABASE-backed autocomplete ──────
// Server-side search (GET /api/admin/customers?q=) — debounced, so we
// never download the whole customer table into the browser, and every
// device/browser sees the same live results (Feature 18/11).
function ShopNameField({ value, onChange, onShopSelect }) {
  const [sugg, setSugg]     = useState([]);
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const runSearch = (q) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const d = await searchCustomers(q, 8);
        setSugg(d.customers || []);
        setShow(true);
      } catch { setSugg([]); }
      finally { setLoading(false); }
    }, 300); // small debounce — avoids firing an API call on every keystroke
  };

  const handle = e => {
    const v = e.target.value; onChange(v);
    if (v.trim().length >= 2) runSearch(v);
    else { setShow(false); setSugg([]); }
  };

  return (
    <div ref={wrapRef} className="relative col-span-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        Customer Name <span className="text-red-400">*</span>
        {loading && <span className="text-gray-300 normal-case font-normal ml-2">searching...</span>}
      </label>
      <input type="text" value={value} onChange={handle}
        onFocus={() => { if (value.trim().length>=2 && sugg.length) setShow(true); }}
        placeholder="e.g. Annas Mess, Hotel Murugan... (type 2+ letters)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"/>
      {show && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 sticky top-0">
            <p className="text-[11px] font-bold text-blue-700">🏪 Existing customers — click to auto-fill, then just enter kg</p>
          </div>
          {sugg.length === 0 ? (
            <p className="px-4 py-4 text-xs text-gray-400 text-center">{loading?"Searching...":"No customers found — you can still type a new one."}</p>
          ) : sugg.map((s,i) => {
            const rate = s.totalKg > 0 ? s.totalAmount / s.totalKg : 0;
            return (
              <button key={s._id||i} type="button" onClick={() => { onShopSelect({ ...s, rate }); setShow(false); }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0">
                <p className="text-sm font-bold text-gray-900">{s.shopName}</p>
                <p className="text-xs text-gray-500">{s.ownerName} · {s.phone}</p>
                <p className="text-xs text-gray-400 truncate">📍 {s.address}</p>
                {rate > 0 && <p className="text-[11px] text-green-600 font-semibold mt-0.5">~₹{rate.toFixed(1)}/kg (from history)</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── New Driver Modal ───────────────────────────────────────
function NewDriverModal({ onSave, onClose }) {
  const [name,setName]=useState(""); const [mobile,setMobile]=useState(""); const [pass,setPass]=useState("");
  const [saving,setSaving]=useState(false); const [err,setErr]=useState("");
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
          <h3 className="font-bold text-gray-900">Create Driver Account</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Full Name" value={name} onChange={setName} placeholder="Raju Kumar" required/>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mobile <span className="text-red-400">*</span></label>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400">
              <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200">+91</span>
              <input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,""))} placeholder="9876543210" maxLength={10} className="flex-1 px-3 py-2.5 text-sm outline-none"/>
            </div>
          </div>
          <FormField label="Password" value={pass} onChange={setPass} type="password" placeholder="Min 6 chars" required/>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={go} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {saving?"Creating...":"Create Driver"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Delivery Modal ────────────────────────────────
function DeliveryModal({ driverId, delivery, activeDate, onSave, onClose }) {
  const isEdit=!!delivery;
  const [shopName,setShopName]=useState(delivery?.shopName||"");
  const [ownerName,setOwnerName]=useState(delivery?.ownerName||"");
  const [phone,setPhone]=useState(delivery?.phone||"");
  const [address,setAddress]=useState(delivery?.address||"");
  const [latitude,setLatitude]=useState(delivery?.latitude?String(delivery.latitude):"");
  const [longitude,setLongitude]=useState(delivery?.longitude?String(delivery.longitude):"");
  const [productName,setProductName]=useState(delivery?.productName||"Idly Batter");
  const [quantity,setQuantity]=useState(String(delivery?.quantity||""));
  const [pricePerKg,setPricePerKg]=useState(() => {
    if (delivery?.pricePerKg) return String(delivery.pricePerKg);
    // Backward compatibility: older deliveries saved before this feature
    // have no pricePerKg — derive one from totalAmount so editing them
    // doesn't show a blank price.
    if (delivery?.quantity && delivery?.totalAmount) return String(Math.round((delivery.totalAmount/delivery.quantity)*100)/100);
    return "";
  });
  const [gstEnabled,setGstEnabled]=useState(Boolean(delivery?.gstEnabled));
  const [sortOrder,setSortOrder]=useState(String(delivery?.sortOrder||""));
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const [customerId,setCustomerId]=useState(delivery?.customer||null); // existing Customer._id — delivery is linked to it, never duplicated
  const [gpsStatus,setGpsStatus]=useState(null); // null = not selected yet | "filled" | "missing" — shown right under Lat/Lng so it's obvious whether GPS actually came from the customer record

  const fillFromShop = s => {
    setShopName(s.shopName||""); setOwnerName(s.ownerName||""); setPhone(s.phone||""); setAddress(s.address||"");
    const hasGps = s.latitude!=null && s.longitude!=null;
    setLatitude(hasGps?String(s.latitude):""); setLongitude(hasGps?String(s.longitude):"");
    setGpsStatus(hasGps?"filled":"missing");
    if(s.productName) setProductName(s.productName);
    setCustomerId(s._id||null);
    // Pre-fill Price/KG from this customer's average rate (order history) —
    // admin only needs to confirm it or type today's kg.
    if (s.rate > 0) setPricePerKg(String(Number(s.rate.toFixed(2))));
  };

  // ── Live price calculation (Quantity × Price/KG, +5% GST if enabled) ──
  const qtyNum   = Number(quantity) || 0;
  const priceNum = Number(pricePerKg) || 0;
  const subtotal = Math.round((qtyNum * priceNum + Number.EPSILON) * 100) / 100;
  const gstAmount = gstEnabled ? Math.round((subtotal * 5 / 100 + Number.EPSILON) * 100) / 100 : 0;
  const grandTotal = Math.round((subtotal + gstAmount + Number.EPSILON) * 100) / 100;

  const handleSave = async () => {
    if (!shopName||!ownerName||!phone||!address||!quantity||!pricePerKg) return setError("Fill all required fields.");
    if (qtyNum <= 0) return setError("Quantity must be greater than 0.");
    if (priceNum < 0) return setError("Price per KG cannot be negative.");
    setSaving(true); setError("");
    try {
      const payload = { driver:driverId, customer:customerId||undefined, shopName:shopName.trim(), ownerName:ownerName.trim(),
        phone:phone.trim(), address:address.trim(),
        latitude:latitude?parseFloat(latitude):undefined, longitude:longitude?parseFloat(longitude):undefined,
        productName:productName.trim(), quantity:qtyNum, pricePerKg:priceNum, gstEnabled,
        sortOrder:Number(sortOrder)||0 };
      // FIX: deliveryDate used to be hardcoded to today() on every save —
      // including EDIT. That silently moved an existing delivery's date to
      // "today" on every edit, making it vanish from the date it was
      // actually assigned on and reappear only under today's date.
      // Now: new deliveries use whatever date is currently selected on the
      // page (so assigning while viewing an older date stores it there,
      // not on "today"); edits never touch deliveryDate at all, so the
      // record stays on the day it was originally assigned to.
      if (!isEdit) payload.deliveryDate = activeDate || today();
      // NOTE: subtotal/gstAmount/totalAmount are intentionally NOT sent —
      // the backend always recomputes them from quantity+pricePerKg+gstEnabled
      // (Feature 14: never trust frontend math for money).
      if(isEdit) await updateDelivery(delivery._id,payload);
      else       await createDelivery(payload);
      saveShopToLocal({shopName:shopName.trim(),ownerName:ownerName.trim(),phone:phone.trim(),
        address:address.trim(),latitude:payload.latitude,longitude:payload.longitude,
        productName:productName.trim(),totalAmount:subtotal});
      onSave();
    } catch(e) { setError(e.response?.data?.message||"Save failed."); }
    finally { setSaving(false); }
  };

  const mapLink = latitude&&longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{maxHeight:"92vh"}}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-gray-900">{isEdit?"Edit Delivery":"Assign Delivery"}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl font-light">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <ShopNameField value={shopName} onChange={v=>{setShopName(v);setCustomerId(null);}} onShopSelect={fillFromShop}/>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Annas" required/>
            <FormField label="Phone" value={phone} onChange={setPhone} placeholder="9999999999" type="tel" required/>
          </div>
          <FormField label="Address" value={address} onChange={setAddress} placeholder="5/A Teeds Garden, Perambur..." required/>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude" value={latitude} onChange={v=>{setLatitude(v);setGpsStatus(null);}} type="number" placeholder="Not set" hint="GPS"/>
            <FormField label="Longitude" value={longitude} onChange={v=>{setLongitude(v);setGpsStatus(null);}} type="number" placeholder="Not set" hint="GPS"/>
          </div>
          {gpsStatus==="filled" && (
            <p className="text-xs text-green-600 font-semibold -mt-2">✓ GPS auto-filled from this customer's saved record</p>
          )}
          {gpsStatus==="missing" && (
            <p className="text-xs text-amber-600 font-semibold -mt-2">⚠ No GPS saved for this customer yet — enter it manually below, or it will stay blank</p>
          )}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">📍 How to get Lat/Lng: Google Maps → Search shop → Long press → Copy coordinates</p>
            {mapLink && <a href={mapLink} target="_blank" rel="noreferrer" className="underline font-semibold">✓ Verify on Google Maps ↗</a>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Product" value={productName} onChange={setProductName} placeholder="Idly Batter"/>
            <FormField label="Priority" value={sortOrder} onChange={setSortOrder} type="number" placeholder="1"/>
          </div>

          {/* Today's Delivery — pricing block */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Delivery</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantity (KG)" value={quantity} onChange={setQuantity} type="number" placeholder="5" required/>
              <FormField label="Price Per KG (₹)" value={pricePerKg} onChange={setPricePerKg} type="number" placeholder="35" required/>
            </div>

            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">GST</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button type="button" onClick={()=>setGstEnabled(false)}
                  className={`px-3 py-1 text-xs font-semibold ${!gstEnabled?"bg-gray-700 text-white":"bg-white text-gray-500"}`}>OFF</button>
                <button type="button" onClick={()=>setGstEnabled(true)}
                  className={`px-3 py-1 text-xs font-semibold ${gstEnabled?"bg-blue-600 text-white":"bg-white text-gray-500"}`}>ON (5%)</button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">₹{fmt(subtotal)}</span>
              </div>
              {gstEnabled && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST (5%)</span>
                  <span className="font-semibold text-gray-800">₹{fmt(gstAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base pt-1.5 border-t border-gray-100">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="font-bold text-blue-600">₹{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {saving?"Saving...":isEdit?"Update":"Assign Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delivery Map View ──────────────────────────────────────
function DeliveryMapView({ deliveries, isLoaded, driverLocations }) {
  const [selected, setSelected] = useState(null);
  const withGps = deliveries.filter(d => d.latitude && d.longitude);
  const center  = withGps[0] ? { lat: withGps[0].latitude, lng: withGps[0].longitude } : CHENNAI;

  const deliveryIcon = (status) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <circle cx="16" cy="16" r="14" fill="${status==="completed"?"#16a34a":status==="skipped"?"#9ca3af":"#1d4ed8"}" stroke="white" stroke-width="3"/>
        <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
          ${status==="completed"?"✓":status==="skipped"?"✕":"📦"}
        </text>
        <polygon points="10,28 22,28 16,38" fill="${status==="completed"?"#16a34a":status==="skipped"?"#9ca3af":"#1d4ed8"}"/>
      </svg>`)}`,
    scaledSize: { width: 32, height: 40 },
  });

  const driverIcon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#16a34a" stroke="white" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" font-size="18">🚚</text>
      </svg>`)}`,
    scaledSize: { width: 40, height: 40 },
  };

  if (!isLoaded) return <div className="h-full flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="relative h-full">
      <GoogleMap
        mapContainerStyle={{ height:"100%", width:"100%" }}
        center={center} zoom={13}
        options={{ streetViewControl:false, gestureHandling:"greedy" }}
      >
        {/* Delivery fixed pins */}
        {withGps.map(d => (
          <Marker key={d._id} position={{ lat:d.latitude, lng:d.longitude }}
            icon={deliveryIcon(d.status)} title={d.shopName}
            onClick={() => setSelected(selected?._id===d._id ? null : d)}/>
        ))}

        {/* Driver live positions — moving */}
        {driverLocations.map(loc => loc.latitude && loc.longitude && (
          <Marker key={`drv-${loc.employee?._id}`}
            position={{ lat:loc.latitude, lng:loc.longitude }}
            icon={driverIcon} title={`Driver: ${loc.employee?.name}`}
            animation={window.google?.maps?.Animation?.BOUNCE}/>
        ))}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3 text-xs space-y-1.5">
        <p className="font-semibold text-gray-700 text-xs mb-2">Legend</p>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"/><span>Pending delivery</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"/><span>Completed delivery</span></div>
        <div className="flex items-center gap-2"><span>🚚</span><span>Driver (live)</span></div>
      </div>

      {selected && (
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-xs">
          <p className="font-bold text-gray-900">{selected.shopName}</p>
          <p className="text-xs text-gray-500">{selected.ownerName} · {selected.phone}</p>
          <p className="text-xs text-gray-400 mt-1">📍 {selected.address}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">{selected.quantity}kg</span>
            <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full font-semibold">₹{fmt(cardTotal(selected))}</span>
          </div>
          <button onClick={() => setSelected(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Close ✕</button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function DeliveriesPage() {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey:MAPS_KEY, libraries:LIBS, id:"deliveries-map" });

  const [drivers,      setDrivers]      = useState([]);
  const [activeDriver, setActive]       = useState(null);
  const [deliveries,   setDeliveries]   = useState([]);
  const [porter,       setPorter]       = useState([]);
  const [date,         setDate]         = useState(today());
  const [loading,      setLoading]      = useState(false);
  const [modal,        setModal]        = useState(null);
  const [driverModal,  setDriverModal]  = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [activeTab,    setActiveTab]    = useState("list"); // "list" | "map" | "porter"
  const [driverLocs,   setDriverLocs]   = useState([]);
  const [invoiceFor,   setInvoiceFor]   = useState(null); // delivery for which the invoice popup is open

  const loadDrivers = () => getDrivers().then(d => {
    const list = d.drivers||[]; setDrivers(list);
    if (list.length && !activeDriver) setActive(list[0]);
  }).catch(console.error);

  useEffect(() => { loadDrivers(); }, []);

  useEffect(() => {
    if (!activeDriver) return;
    setLoading(true);
    Promise.all([
      getDriverDeliveries(activeDriver._id, date, "delivery"),
      getDriverDeliveries(activeDriver._id, date, "porter"),
    ]).then(([main, por]) => {
      setDeliveries(normalizeList(main.deliveries));
      setPorter(normalizeList(por.deliveries));
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeDriver, date]);

  // Poll driver live locations for map tab
  useEffect(() => {
    if (activeTab !== "map") return;
    const fetch = async () => {
      try {
        const data = await getLiveLocations();
        setDriverLocs((data.locations||[]).filter(l => l.employee?.role === "driver"));
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, [activeTab]);

  const refresh = () => {
    setModal(null);
    if (!activeDriver) return;
    Promise.all([
      getDriverDeliveries(activeDriver._id, date, "delivery"),
      getDriverDeliveries(activeDriver._id, date, "porter"),
    ]).then(([main, por]) => { setDeliveries(normalizeList(main.deliveries)); setPorter(normalizeList(por.deliveries)); });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    setDeleting(id);
    await deleteDelivery(id).catch(console.error);
    setDeliveries(p => p.filter(d => d._id!==id));
    setDeleting(null);
  };

  const summary = {
    total:   deliveries.length, done: deliveries.filter(d=>d.status==="completed").length,
    kg:      deliveries.reduce((s,d)=>s+d.quantity,0), bill: deliveries.reduce((s,d)=>s+d.totalAmount,0),
    paid:    deliveries.reduce((s,d)=>s+(d.amountReceived||0),0),
    pending: deliveries.reduce((s,d)=>s+(d.pendingAmount||0),0),
    porter:  porter.length,
  };

  const statusC = { pending:"bg-amber-100 text-amber-700", completed:"bg-green-100 text-green-700", skipped:"bg-gray-100 text-gray-500" };
  const payC    = { cash:"bg-green-50 text-green-700", gpay:"bg-blue-50 text-blue-700", mixed:"bg-purple-50 text-purple-700", pending:"bg-red-50 text-red-600" };

  const renderDeliveryCard = (d, i) => (
    <div key={d._id} className={`bg-white rounded-2xl border mb-3 p-4 ${d.status==="completed"?"border-green-200":d.status==="skipped"?"border-gray-200 opacity-60":"border-gray-100"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${d.status==="completed"?"bg-green-500 text-white":"bg-blue-100 text-blue-700"}`}>
          {d.status==="completed"?"✓":(d.sortOrder||i+1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div><p className="font-semibold text-gray-900">{d.shopName}</p><p className="text-xs text-gray-500">{d.ownerName} · {d.phone}</p></div>
            {d.status==="completed"
              ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">✅ Completed</span>
              : <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusC[d.status]||statusC.pending}`}>{d.status.charAt(0).toUpperCase()+d.status.slice(1)}</span>
            }
          </div>
          <p className="text-xs text-gray-400 mt-1">📍 {d.address}</p>
          {d.latitude&&d.longitude&&<p className="text-[10px] text-gray-300 font-mono">{Number(d.latitude).toFixed(4)},{Number(d.longitude).toFixed(4)}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{d.quantity}kg</span>
            <span className="text-xs font-semibold text-gray-700">₹{fmt(cardTotal(d))}</span>
            {d.status==="completed"&&<><span className={`text-xs font-semibold px-2 py-1 rounded-full ${payC[d.paymentType]}`}>{d.paymentType==="gpay"?"GPay":d.paymentType?.charAt(0).toUpperCase()+d.paymentType?.slice(1)}</span><span className="text-xs text-green-700">₹{fmt(d.amountReceived)}</span>{d.pendingAmount>0&&<span className="text-xs text-red-500">Pending ₹{fmt(d.pendingAmount)}</span>}</>}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {d.latitude&&d.longitude&&<a href={`https://maps.google.com/?q=${d.latitude},${d.longitude}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-center">Maps↗</a>}
          {d.status==="pending"&&<button onClick={()=>setModal(d)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Edit</button>}
          {d.status==="completed"&&<button onClick={()=>setInvoiceFor(d)} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 text-center">Download Invoice</button>}
          <button onClick={()=>handleDelete(d._id)} disabled={deleting===d._id} className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50">{deleting===d._id?"...":"Del"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Deliveries">
      {modal!==null&&<DeliveryModal driverId={activeDriver?._id} delivery={modal==="add"?null:modal} activeDate={date} onSave={refresh} onClose={()=>setModal(null)}/>}
      {driverModal&&<NewDriverModal onSave={()=>{setDriverModal(false);loadDrivers();}} onClose={()=>setDriverModal(false)}/>}
      {invoiceFor&&<InvoiceTypeModal delivery={invoiceFor} onClose={()=>setInvoiceFor(null)}/>}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-gray-900">Daily Deliveries</h1><p className="text-sm text-gray-500">Assign and track driver deliveries</p></div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
          <button onClick={()=>setDriverModal(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">+ New Driver</button>
          {activeDriver&&<button onClick={()=>setModal("add")} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">+ Add Delivery</button>}
        </div>
      </div>

      <div className="flex gap-5" style={{ height: "calc(100vh - 200px)" }}>
        {/* Drivers */}
        <div className="w-52 flex-shrink-0 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Drivers</p>
          {drivers.length===0?(
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">🚚</p><p className="text-sm font-semibold text-blue-800">No drivers</p>
              <button onClick={()=>setDriverModal(true)} className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl">+ Create</button>
            </div>
          ):drivers.map(d=>(
            <div key={d._id} className={`rounded-2xl border p-3 mb-2 transition cursor-pointer ${activeDriver?._id===d._id?"border-blue-400 bg-blue-50":"border-gray-100 bg-white hover:border-blue-200"}`}>
              <div className="flex items-center gap-2" onClick={()=>setActive(d)}>
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">{d.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-400">+91 {d.mobile}</p>
                </div>
              </div>
              {/* Route label — used to group/label this driver's section on the Daily Order Sheet PDF */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-gray-400 flex-shrink-0">Route:</span>
                <span className={`text-[11px] font-medium truncate flex-1 ${d.route?"text-gray-700":"text-gray-300 italic"}`}>{d.route||"not set"}</span>
                <button
                  onClick={async(e)=>{
                    e.stopPropagation();
                    const next = window.prompt(`Set route/area for ${d.name}:`, d.route||"");
                    if (next===null) return;
                    await updateDriverRoute(d._id, next.trim()).catch(console.error);
                    loadDrivers();
                  }}
                  className="text-[10px] text-blue-500 hover:text-blue-700 flex-shrink-0"
                >Edit</button>
              </div>
              <button onClick={async()=>{if(!window.confirm(`Delete ${d.name}?`))return;await deleteDriver(d._id).catch(console.error);loadDrivers();if(activeDriver?._id===d._id)setActive(null);}} className="mt-2 w-full text-xs text-red-400 border border-red-100 rounded-lg py-1 hover:bg-red-50">Remove</button>
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Summary + Tabs */}
          {deliveries.length>0&&(
            <div className="grid grid-cols-7 gap-2 mb-3">
              {[{l:"Total",v:summary.total,c:"text-gray-900"},{l:"Done",v:summary.done,c:"text-green-600"},{l:"KG",v:`${summary.kg}kg`,c:"text-blue-600"},{l:"Bill",v:`₹${fmt(summary.bill)}`,c:"text-gray-900"},{l:"Collected",v:`₹${fmt(summary.paid)}`,c:"text-green-600"},{l:"Pending",v:`₹${fmt(summary.pending)}`,c:"text-red-500"},{l:"Porter",v:summary.porter,c:"text-purple-600"}].map(s=>(
                <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-2 text-center">
                  <p className="text-xs text-gray-400">{s.l}</p><p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-2 mb-3">
            {[
              { key:"list",   label:"📋 List",      count: deliveries.length },
              { key:"map",    label:"🗺️ Map",       count: null },
              { key:"porter", label:"👷 Porter",    count: porter.length },
            ].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${activeTab===t.key?"border-blue-400 bg-blue-50 text-blue-700":"border-gray-200 text-gray-500 hover:border-blue-200"}`}>
                {t.label}{t.count!==null?` (${t.count})`:""}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden rounded-2xl">
            {/* List tab */}
            {activeTab==="list"&&(
              <div className="h-full overflow-y-auto">
                {loading?[1,2,3].map(i=><div key={i} className="h-28 bg-gray-100 rounded-2xl mb-3 animate-pulse"/>):
                 deliveries.length===0?(
                  <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <p className="text-4xl mb-3">🚚</p><p className="text-gray-700 font-semibold">No deliveries</p>
                    <p className="text-gray-400 text-sm">{activeDriver?`Click "+ Add Delivery" for ${activeDriver.name}`:"Select a driver"}</p>
                  </div>
                 ):deliveries.map(renderDeliveryCard)}
              </div>
            )}

            {/* Map tab */}
            {activeTab==="map"&&(
              <div className="h-full">
                {deliveries.filter(d=>d.latitude&&d.longitude).length===0?(
                  <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                    <div className="text-center"><p className="text-4xl mb-3">📍</p><p className="text-gray-600 font-semibold">No deliveries with GPS coordinates</p><p className="text-gray-400 text-sm mt-1">Add latitude & longitude when creating deliveries</p></div>
                  </div>
                ):(
                  <DeliveryMapView deliveries={deliveries} isLoaded={isLoaded} driverLocations={driverLocs}/>
                )}
              </div>
            )}

            {/* Porter tab */}
            {activeTab==="porter"&&(
              <div className="h-full overflow-y-auto">
                {porter.length===0?(
                  <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <p className="text-4xl mb-3">👷</p><p className="text-gray-700 font-semibold">No porter deliveries</p>
                    <p className="text-gray-400 text-sm mt-1">Driver can move deliveries to porter section from their app</p>
                  </div>
                ):porter.map((d,i)=>(
                  <div key={d._id} className="bg-white rounded-2xl border border-purple-200 mb-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">P</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{d.shopName}</p>
                        <p className="text-xs text-gray-500">{d.ownerName} · {d.phone}</p>
                        <p className="text-xs text-gray-400 mt-1">📍 {d.address}</p>
                        {d.porterNote&&<p className="text-xs text-purple-600 mt-1 italic">📦 {d.porterNote}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">{d.quantity}kg</span>
                          <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full font-semibold">₹{fmt(cardTotal(d))}</span>
                          {d.status==="completed"
                            ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">✅ Completed</span>
                            : <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusC[d.status]||statusC.pending}`}>{d.status.charAt(0).toUpperCase()+d.status.slice(1)}</span>
                          }
                          {d.status==="completed"&&<button onClick={()=>setInvoiceFor(d)} className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full hover:bg-green-700">Download Invoice</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}