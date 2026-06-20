// FILE: src/pages/ProfitLossPage.jsx
// OWNER: Imran
// PURPOSE: For every field sales employee, decide whether they are running in
//          PROFIT or LOSS for the month, measured against their salary.
//
//   Sales Revenue       = kgSold x marginPerKg (marginPerKg is editable on
//                         screen since per-product margin isn't tracked
//                         elsewhere in the app — kgSold itself IS real,
//                         logged by the employee via PerformanceLedger.jsx
//                         in the PWA app, Entry model type:"sale")
//   Collection Revenue  = REAL ₹ amount collected this month, logged by the
//                         employee via the same ledger (Entry type:"collection")
//                         — no assumption needed for this part.
//   Total Revenue       = Sales Revenue + Collection Revenue
//   Net P/L             = Total Revenue - Salary
//   Status              = "Profit" if Net P/L >= 0, else "Loss"
//
//   - If LOSS: shows how many more kg need to be sold to break even
//     (assuming collection revenue stays the same).
//   - If PROFIT: shows how many kg above break-even they already sold.
//
// CHANGE: Profit & Loss is now driven by BOTH real ledger sources — Sales
// (kg sold x margin/kg) AND Collections (real ₹) — instead of the old
// Visit-based "orders placed" count. Loads real salary + real kgSold +
// real collectionAmount from GET /api/admin/profit-loss (current month).

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import StatCard from "../components/StatCard";
import { getInitials } from "../utils/helpers";
import { getProfitLoss } from "../api/profitLossApi";

const INR = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const KG  = (n) => `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg`;

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const [marginPerKg, setMarginPerKg] = useState(50);
  const [filter, setFilter] = useState("All"); // All | Profit | Loss
  const [employees, setEmployees] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const data = await getProfitLoss();
        if (!active) return;
        setEmployees(data.employees || []);
        if (data.monthStart) {
          setMonthLabel(new Date(data.monthStart).toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
        }
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("Profit & Loss fetch error:", err.message);
        setError("Could not load profit & loss data. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    return employees.map((emp) => {
      const salesRevenue       = (emp.kgSold || 0) * marginPerKg;
      const collectionRevenue  = emp.collectionAmount || 0;
      const revenue              = salesRevenue + collectionRevenue;
      const net                   = revenue - emp.salary;
      const status                 = net >= 0 ? "Profit" : "Loss";
      // Kg needed to break even, after already-collected money is counted
      const remainingAfterCollections = emp.salary - collectionRevenue;
      const breakEvenKg = marginPerKg > 0
        ? Math.max(remainingAfterCollections / marginPerKg, 0)
        : 0;
      const kgGap      = breakEvenKg - (emp.kgSold || 0); // +ve => kg short, -ve => surplus
      const marginPct  = emp.salary > 0 ? (net / emp.salary) * 100 : 0;
      return { ...emp, salesRevenue, collectionRevenue, revenue, net, status, breakEvenKg, kgGap, marginPct };
    });
  }, [employees, marginPerKg]);

  const filtered = rows.filter((r) => filter === "All" || r.status === filter);

  const totals = useMemo(() => {
    const totalSalary           = rows.reduce((s, r) => s + r.salary, 0);
    const totalSalesRevenue      = rows.reduce((s, r) => s + r.salesRevenue, 0);
    const totalCollectionRevenue = rows.reduce((s, r) => s + r.collectionRevenue, 0);
    const totalRevenue           = totalSalesRevenue + totalCollectionRevenue;
    const netCompany             = totalRevenue - totalSalary;
    const lossCount              = rows.filter((r) => r.status === "Loss").length;
    const profitCount            = rows.length - lossCount;
    return { totalSalary, totalSalesRevenue, totalCollectionRevenue, totalRevenue, netCompany, lossCount, profitCount };
  }, [rows]);

  if (loading) {
    return (
      <AdminLayout title="Profit & Loss">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Profit & Loss">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
      )}

      {monthLabel && (
        <p className="text-xs text-gray-400 mb-3">Showing real data for <span className="font-medium text-gray-600">{monthLabel}</span></p>
      )}

      {/* ── Margin assumption control ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-semibold text-gray-700">Margin per KG (₹)</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Per-product margin isn't tracked yet — adjust this to model sales revenue. Kg sold and collections below are both real, ledger-logged data.
          </p>
        </div>
        <input
          type="number"
          min={0}
          value={marginPerKg}
          onChange={(e) => setMarginPerKg(Math.max(0, Number(e.target.value) || 0))}
          className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400"
        />
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Salary Payout" value={INR(totals.totalSalary)} color="blue" />
        <StatCard
          label="Total Revenue Generated"
          value={INR(totals.totalRevenue)}
          sub={`${INR(totals.totalSalesRevenue)} sales + ${INR(totals.totalCollectionRevenue)} collections`}
          color="purple"
        />
        <StatCard
          label="Net Company P&L"
          value={`${totals.netCompany >= 0 ? "+" : "-"}${INR(Math.abs(totals.netCompany))}`}
          sub={totals.netCompany >= 0 ? "Overall profit" : "Overall loss"}
          color={totals.netCompany >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Employees in Loss"
          value={`${totals.lossCount} / ${rows.length}`}
          sub={`${totals.profitCount} in profit`}
          color={totals.lossCount > 0 ? "amber" : "green"}
        />
      </div>

      {/* ── Filter ── */}
      <div className="flex items-center gap-3 mb-5">
        {["All", "Profit", "Loss"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium border transition ${
              filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Employee cards ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{rows.length === 0 ? "No field employees registered yet." : "No one matches this filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const isProfit = emp.status === "Profit";
            return (
              <div
                key={emp._id}
                onClick={() => navigate(`/sales-team/${emp._id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold">
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeId}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${isProfit ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {emp.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Salary</span>
                    <span className="font-medium text-gray-800">{INR(emp.salary)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Sales (month)</span>
                    <span className="font-medium text-gray-800">{KG(emp.kgSold)} → {INR(emp.salesRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Collections (month)</span>
                    <span className="font-medium text-gray-800">{INR(emp.collectionRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 pt-1.5 border-t border-gray-50">
                    <span className="font-medium">Total revenue</span>
                    <span className="font-semibold text-gray-900">{INR(emp.revenue)}</span>
                  </div>
                </div>

                <div className={`rounded-xl px-4 py-3 ${isProfit ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold ${isProfit ? "text-green-700" : "text-red-600"}`}>
                      Net {emp.status}
                    </span>
                    <span className={`text-base font-bold ${isProfit ? "text-green-700" : "text-red-600"}`}>
                      {isProfit ? "+" : "-"}{INR(Math.abs(emp.net))}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isProfit ? "text-green-600" : "text-red-500"}`}>
                    {isProfit
                      ? `${KG(Math.abs(emp.kgGap))} above break-even (${emp.marginPct.toFixed(1)}% margin)`
                      : `Needs ${KG(emp.kgGap)} more sold to break even (${emp.marginPct.toFixed(1)}% margin)`}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 mt-3 border-t border-gray-50">
                  <span>Break-even: {KG(emp.breakEvenKg)}</span>
                  <span>@ {INR(marginPerKg)}/kg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </AdminLayout>
  );
}