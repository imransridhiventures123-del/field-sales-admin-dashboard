// FILE: src/pages/distributor-admin/ProductsPage.jsx
// UPDATED — Feature: admin-managed product catalog (Level 2).
// The admin can now:
//   - ADD a product (name, description, unit, company price, customer
//     price, picture — uploaded from the computer or pasted as a link)
//   - EDIT any product's name, description, unit, prices and picture
//   - turn a product ON/OFF for distributors (Active switch) — off
//     products disappear from the distributor app but keep their history
//   - DELETE a product (Idly and Dosa batter are core products and can
//     only be edited or switched off, never deleted)
// Everything a distributor sees on the customer page (picture, name,
// details, price, unit) comes from what is saved here.
import { useEffect, useRef, useState } from "react";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import { getProducts, updateProduct, createProduct, deleteProduct, uploadProductImage } from "../../api/productApi";

const CORE_KEYS = ["idly", "dosa"];
const UNIT_SUGGESTIONS = ["kg", "packet", "litre", "piece", "box", "dozen"];
const MAX_IMAGE_MB = 5;

const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

/* ══════════════ Picture picker: preview + upload + link ══════════════ */
function ImageField({ value, onChange, name }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [broken, setBroken] = useState(false);

  useEffect(() => { setBroken(false); }, [value]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be chosen again later
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG, PNG or WebP)."); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`Image is too big — maximum ${MAX_IMAGE_MB} MB.`); return; }
    setUploading(true);
    try {
      const data = await uploadProductImage(file);
      onChange(data.imageUrl);
    } catch (err) {
      setError(errMsg(err, "Upload failed. Check your connection and try again."));
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-500">Product picture</label>
      <div className="mt-1 flex items-start gap-3">
        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {value && !broken ? (
            <img src={value} alt={name || "Product"} onError={() => setBroken(true)} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-gray-300">{(name || "?").trim().charAt(0).toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-3 py-2 rounded-xl border border-teal-200 text-teal-700 text-xs font-semibold disabled:opacity-60"
            >
              {uploading ? "Uploading…" : value ? "Change picture" : "Upload picture"}
            </button>
            {value && !uploading && (
              <button type="button" onClick={() => onChange("")} className="text-xs text-gray-400 font-medium">Remove</button>
            )}
          </div>
          <input
            type="text" value={value || ""} onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image link (https://…)"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
          />
          {value && broken && <p className="text-[11px] text-amber-600 mt-1">This link can't be shown here (it may only work inside the distributor app).</p>}
          {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ Unit input with suggestions ══════════════ */
function UnitField({ value, onChange, disabled }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">Sold by (unit)</label>
      <input
        list="unit-suggestions" value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)} placeholder="kg, packet, litre…"
        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50 disabled:text-gray-400"
      />
      <datalist id="unit-suggestions">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
    </div>
  );
}

/* ══════════════ Add Product modal ══════════════ */
function AddProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", unit: "kg", companyRatePerKg: "", customerRatePerKg: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (form.customerRatePerKg === "" || Number(form.customerRatePerKg) < 0) { setError("Enter the customer price (0 or more)."); return; }
    if (form.companyRatePerKg !== "" && Number(form.companyRatePerKg) < 0) { setError("Company price can't be negative."); return; }
    setSaving(true);
    try {
      await createProduct({
        name: form.name.trim(), description: form.description.trim(), unit: form.unit.trim() || "kg",
        companyRatePerKg: Number(form.companyRatePerKg || 0), customerRatePerKg: Number(form.customerRatePerKg),
        imageUrl: form.imageUrl,
      });
      onCreated();
    } catch (err) {
      setError(errMsg(err, "Couldn't add the product. Please try again."));
    } finally { setSaving(false); }
  };

  const margin = Number(form.customerRatePerKg || 0) - Number(form.companyRatePerKg || 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
        <h3 className="font-semibold text-gray-800 text-lg mb-4">Add Product</h3>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Product name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paneer Pack" className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Details / description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="e.g. 250g fresh pack" className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none" />
          </div>
          <UnitField value={form.unit} onChange={(v) => set("unit", v)} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Company price (₹)</label>
              <input type="number" min="0" value={form.companyRatePerKg} onChange={(e) => set("companyRatePerKg", e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Customer price (₹) *</label>
              <input type="number" min="0" value={form.customerRatePerKg} onChange={(e) => set("customerRatePerKg", e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Margin (₹)</label>
              <div className="mt-1 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-semibold text-center">+₹{Number.isFinite(margin) ? margin : 0}</div>
            </div>
          </div>
          <ImageField value={form.imageUrl} onChange={(v) => set("imageUrl", v)} name={form.name} />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Adding…" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ One product card ══════════════ */
function ProductCard({ product, onChanged }) {
  const isCore = CORE_KEYS.includes(product.key);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = Object.keys(edits).length > 0;
  const val = (f) => (edits[f] !== undefined ? edits[f] : product[f] ?? "");
  const setField = (f, v) => setEdits((e) => ({ ...e, [f]: v }));

  const margin = Number(val("customerRatePerKg")) - Number(val("companyRatePerKg"));

  const save = async () => {
    setError("");
    if (!String(val("name")).trim()) { setError("Product name can't be empty."); return; }
    if (val("customerRatePerKg") === "" || Number(val("customerRatePerKg")) < 0) { setError("Enter a valid customer price."); return; }
    if (val("companyRatePerKg") === "" || Number(val("companyRatePerKg")) < 0) { setError("Enter a valid company price."); return; }
    setSaving(true);
    try {
      await updateProduct(product.key, {
        name: String(val("name")).trim(),
        description: val("description"),
        unit: String(val("unit")).trim() || "kg",
        companyRatePerKg: Number(val("companyRatePerKg")),
        customerRatePerKg: Number(val("customerRatePerKg")),
        imageUrl: val("imageUrl"),
      });
      setEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onChanged();
    } catch (err) {
      setError(errMsg(err, "Couldn't save changes."));
    } finally { setSaving(false); }
  };

  const toggleActive = async () => {
    setError(""); setToggling(true);
    try {
      await updateProduct(product.key, { isActive: !product.isActive });
      onChanged();
    } catch (err) { setError(errMsg(err, "Couldn't change visibility.")); }
    finally { setToggling(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${product.name}"?\n\nDistributors will no longer see it. Past orders and deliveries keep their own record of it.\n\n(To just hide it for now, use the Active switch instead.)`)) return;
    setError(""); setDeleting(true);
    try {
      await deleteProduct(product.key);
      onChanged();
    } catch (err) { setError(errMsg(err, "Couldn't delete the product.")); setDeleting(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${product.isActive ? "border-gray-100" : "border-amber-100 bg-amber-50/30"}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{product.name}</p>
          <p className="text-[11px] text-gray-400">
            ID: {product.key}{isCore && <span className="ml-2 px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 font-medium">Core product</span>}
          </p>
        </div>
        <button
          onClick={toggleActive} disabled={toggling} title={product.isActive ? "Visible to distributors" : "Hidden from distributors"}
          className="flex items-center gap-2 flex-shrink-0 disabled:opacity-60"
        >
          <span className={`text-xs font-medium ${product.isActive ? "text-teal-600" : "text-amber-600"}`}>{product.isActive ? "Active" : "Hidden"}</span>
          <span className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${product.isActive ? "bg-teal-600 justify-end" : "bg-gray-300 justify-start"}`}>
            <span className="w-5 h-5 rounded-full bg-white shadow" />
          </span>
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">{error}</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Product name</label>
            <input value={val("name")} onChange={(e) => setField("name", e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <UnitField value={val("unit")} onChange={(v) => setField("unit", v)} disabled={isCore} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Details / description</label>
          <textarea value={val("description")} onChange={(e) => setField("description", e.target.value)} rows={2} placeholder="Shown to distributors under the product name" className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Company price (₹)</label>
            <input type="number" min="0" value={val("companyRatePerKg")} onChange={(e) => setField("companyRatePerKg", e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Customer price (₹)</label>
            <input type="number" min="0" value={val("customerRatePerKg")} onChange={(e) => setField("customerRatePerKg", e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Margin (₹)</label>
            <div className="mt-1 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-semibold text-center">+₹{Number.isFinite(margin) ? margin : 0}</div>
          </div>
        </div>
        <ImageField value={val("imageUrl")} onChange={(v) => setField("imageUrl", v)} name={val("name")} />
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={!dirty || saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-40">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {dirty && !saving && <button onClick={() => { setEdits({}); setError(""); }} className="text-xs text-gray-400 font-medium">Discard</button>}
        {saved && <span className="text-xs text-green-600">Saved ✓</span>}
        <div className="flex-1" />
        {!isCore && (
          <button onClick={remove} disabled={deleting} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════ Page ══════════════ */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoadError("");
    getProducts()
      .then((d) => setProducts(d.products || []))
      .catch((err) => setLoadError(errMsg(err, "Couldn't load products.")))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <DistributorAdminLayout title="Products & Rates" subtitle="Add and manage the products distributors can order">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <p className="text-sm text-gray-500">{products.length} product{products.length === 1 ? "" : "s"} · {products.filter((p) => p.isActive).length} visible to distributors</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>

        {loading && <p className="text-gray-400 text-sm">Loading…</p>}
        {loadError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{loadError}</div>}

        <div className="space-y-4">
          {products.map((p) => <ProductCard key={p.key} product={p} onChanged={load} />)}
        </div>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </DistributorAdminLayout>
  );
}