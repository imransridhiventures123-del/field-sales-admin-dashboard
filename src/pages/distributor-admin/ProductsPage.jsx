// FILE: src/pages/distributor-admin/ProductsPage.jsx
// NEW FILE — Feature: real-time distributor workflow. Lets the admin
// set/edit the two rates that drive every margin calculation across the
// whole system: what the company charges the distributor per kg, and
// what the distributor charges the customer per kg. The PWA reads these
// same rates (GET /api/products) to show the distributor their margin
// and to price each delivery.
import { useEffect, useState } from "react";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import { getProducts, updateProduct } from "../../api/productApi";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  const load = () => {
    setLoading(true);
    getProducts().then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setField = (key, field, value) => setEdits((e) => ({ ...e, [key]: { ...e[key], [field]: value } }));
  const valueFor = (p, field) => (edits[p.key]?.[field] !== undefined ? edits[p.key][field] : p[field]);

  const save = async (p) => {
    setSavingKey(p.key);
    try {
      const payload = {
        companyRatePerKg: Number(valueFor(p, "companyRatePerKg")),
        customerRatePerKg: Number(valueFor(p, "customerRatePerKg")),
        imageUrl: valueFor(p, "imageUrl"), // NEW (additive)
      };
      await updateProduct(p.key, payload);
      setSavedKey(p.key);
      setTimeout(() => setSavedKey(null), 1500);
      load();
    } finally { setSavingKey(null); }
  };

  return (
    <DistributorAdminLayout title="Products & Rates" subtitle="Set company cost, customer price and product image">
      <div className="max-w-2xl space-y-4">
        {loading && <p className="text-gray-400 text-sm">Loading…</p>}

        {products.map((p) => {
          const company = valueFor(p, "companyRatePerKg");
          const customer = valueFor(p, "customerRatePerKg");
          const image = valueFor(p, "imageUrl");
          const margin = Number(customer) - Number(company);
          return (
            <div key={p.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                {/* NEW (additive) — image preview, shown exactly as it will
                    appear on the distributor's product card in the PWA */}
                <img
                  src={image || "/assets/products/placeholder.jpg"}
                  alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <span className="text-xs text-gray-400">per kg</span>
                </div>
              </div>

              {/* NEW (additive) — image URL field. This is a link/path
                  string only, no image is generated or uploaded here. */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500">Product Image URL</label>
                <input
                  type="text" value={image}
                  placeholder="/assets/products/idly.jpg or https://…"
                  onChange={(e) => setField(p.key, "imageUrl", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company rate (₹)</label>
                  <input
                    type="number" value={company}
                    onChange={(e) => setField(p.key, "companyRatePerKg", e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Customer rate (₹)</label>
                  <input
                    type="number" value={customer}
                    onChange={(e) => setField(p.key, "customerRatePerKg", e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Margin (₹)</label>
                  <div className="mt-1 w-full px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-semibold text-center">
                    +₹{isNaN(margin) ? 0 : margin}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => save(p)}
                  disabled={savingKey === p.key}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  {savingKey === p.key ? "Saving…" : "Save Rate"}
                </button>
                {savedKey === p.key && <span className="text-xs text-green-600">Saved ✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </DistributorAdminLayout>
  );
}