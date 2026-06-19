// FILE: src/pages/ProfitLossPage.jsx
// OWNER: Imran
// PURPOSE: For every field sales employee, decide whether they are running in
//          PROFIT or LOSS for the month, measured against their salary.
//
//   Revenue Generated = ordersPlaced x revenuePerOrder (revenuePerOrder is
//   editable on screen since order value isn't tracked elsewhere in the app)
//   Net P/L           = Revenue Generated - Salary
//   Status            = "Profit" if Net P/L >= 0, else "Loss"
//
//   - If LOSS: shows how many more orders are needed to break even.
//   - If PROFIT: shows how many orders above break-even they already have.
//
// ADD ROUTE in App.jsx:
//   import ProfitLossPage from "./pages/ProfitLossPage";
//   <Route path="/profit-loss" element={<AdminPrivateRoute><ProfitLossPage /></AdminPrivateRoute>} />

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import StatCard from "../components/StatCard";
import { getInitials } from "../utils/helpers";

// ── DUMMY DATA — replace with real API (salary from getEmployeeById,
//    ordersPlaced from visits/follow-up "order_placed" counts for the month) ──
const DUMMY = [
  { _id: "e1", name: "Rakesh Kumar", employeeId: "EMP001", salary: 28000, ordersPlaced: 58 },
  { _id: "e2", name: "Naveen S",     employeeId: "EMP002", salary: 24000, ordersPlaced: 36 },
  { _id: "e3", name: "Divya R",      employeeId: "EMP003", salary: 22000, ordersPlaced: 50 },
  { _id: "e4", name: "Murugan K",    employeeId: "EMP004", salary: 20000, ordersPlaced: 18 },
  { _id: "e5", name: "Priya S",      employeeId: "EMP005", salary: 26000, ordersPlaced: 70 },
  { _id: "e6", name: "Rajan M",      employeeId: "EMP006", salary: 21000, ordersPlaced: 22 },
];

const INR = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const [revenuePerOrder, setRevenuePerOrder] = useState(450);
  const [filter, setFilter] = useState("All"); // All | Profit | Loss

  const rows = useMemo(() => {
    return DUMMY.map((emp) => {
      const revenue   = emp.ordersPlaced * revenuePerOrder;
      const net        = revenue - emp.salary;
      const status      = net >= 0 ? "Profit" : "Loss";
      const breakEvenOrders = Math.ceil(emp.salary / revenuePerOrder);
      const orderGap    = breakEvenOrders - emp.ordersPlaced; // +ve => orders short, -ve => surplus
      const marginPct   = emp.salary > 0 ? (net / emp.salary) * 100 : 0;
      return { ...emp, revenue, net, status, breakEvenOrders, orderGap, marginPct };
    });
  }, [revenuePerOrder]);

  const filtered = rows.filter((r) => filter === "All" || r.status === filter);

  const totals = useMemo(() => {
    const totalSalary  = rows.reduce((s, r) => s + r.salary, 0);
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const netCompany   = totalRevenue - totalSalary;
    const lossCount    = rows.filter((r) => r.status === "Loss").length;
    const profitCount  = rows.length - lossCount;
    return { totalSalary, totalRevenue, netCompany, lossCount, profitCount };
  }, [rows]);

  return (
    <AdminLayout title="Profit & Loss">

      {/* ── Revenue assumption control ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-semibold text-gray-700">Revenue per Order (₹)</p>
          <p className="text-xs text-gray-400 mt-0.5">Order value isn't tracked elsewhere yet — adjust this to model P&amp;L correctly.</p>
        </div>
        <input
          type="number"
          min={0}
          value={revenuePerOrder}
          onChange={(e) => setRevenuePerOrder(Math.max(0, Number(e.target.value) || 0))}
          className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400"
        />
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Salary Payout" value={INR(totals.totalSalary)} color="blue" />
        <StatCard label="Total Revenue Generated" value={INR(totals.totalRevenue)} color="purple" />
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
                  <span>Orders placed (month)</span>
                  <span className="font-medium text-gray-800">{emp.ordersPlaced}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Revenue generated</span>
                  <span className="font-medium text-gray-800">{INR(emp.revenue)}</span>
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
                    ? `${Math.abs(emp.orderGap)} orders above break-even (${emp.marginPct.toFixed(1)}% margin)`
                    : `Needs ${emp.orderGap} more order${emp.orderGap === 1 ? "" : "s"} to break even (${emp.marginPct.toFixed(1)}% margin)`}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 mt-3 border-t border-gray-50">
                <span>Break-even: {emp.breakEvenOrders} orders</span>
                <span>@ {INR(revenuePerOrder)}/order</span>
              </div>
            </div>
          );
        })}
      </div>

    </AdminLayout>
  );
}
