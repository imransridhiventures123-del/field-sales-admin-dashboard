// FILE: src/App.jsx
// OWNER: Imran — only Imran edits this file
// Naveen: tell Imran your page name + path, he adds the route

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminPrivateRoute     from "./components/AdminPrivateRoute";

// ── IMRAN'S PAGES ──
import AdminLoginPage    from "./pages/AdminLoginPage";
import DashboardPage     from "./pages/DashboardPage";
import LiveMapPage       from "./pages/LiveMapPage";
import SalesTeamPage     from "./pages/SalesTeamPage";
import TargetsPage       from "./pages/TargetsPage";
import TelecallersPage   from "./pages/TelecallersPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import VisitDetailPage   from "./pages/VisitDetailPage";
import ProfitLossPage    from "./pages/ProfitLossPage";

// ── NAVEEN'S PAGES ──
import AllVisitsPage     from "./pages/AllVisitsPage";
import FollowUpsPage     from "./pages/FollowUpsPage";
import AnalyticsPage     from "./pages/AnalyticsPage";
import ReportsPage       from "./pages/ReportsPage";
import DeliveriesPage    from "./pages/DeliveriesPage";
import ShopsPage         from "./pages/ShopsPage";

// ── NEW PAGES (additive) — Feature 1, 2, 3 ──
import DriverLeadsPage     from "./pages/DriverLeadsPage";
import CustomersPage       from "./pages/CustomersPage";
import CustomerDetailPage  from "./pages/CustomerDetailPage";
import SalesReportsPage    from "./pages/SalesReportsPage";
import DailyInvoicesPage   from "./pages/DailyInvoicesPage";

// ── NEW PAGES (additive) — Feature: two Admin Dashboard login types.
// The old "./pages/distributors/*" pages + their sidebar entry are gone —
// distributor management now lives in its own dashboard at
// /distributor-admin/*, entered only via the "Distributors" login tab. ──
import DistributorAdminRoute        from "./components/DistributorAdminRoute";
import DistributorAdminDashboardPage from "./pages/distributor-admin/DistributorAdminDashboardPage";
import AllDistributorsPage    from "./pages/distributor-admin/AllDistributorsPage";
import AddDistributorPage     from "./pages/distributor-admin/AddDistributorPage";
import DistributorsMapPage    from "./pages/distributor-admin/DistributorsMapPage";
import DailyRequirementPage   from "./pages/distributor-admin/DailyRequirementPage";
import ProductsPage           from "./pages/distributor-admin/ProductsPage";
import DistributorDetailPage  from "./pages/distributor-admin/DistributorDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Imran's private pages */}
          <Route path="/dashboard"  element={<AdminPrivateRoute><DashboardPage /></AdminPrivateRoute>} />
          <Route path="/live-map"   element={<AdminPrivateRoute><LiveMapPage /></AdminPrivateRoute>} />
          <Route path="/sales-team" element={<AdminPrivateRoute><SalesTeamPage /></AdminPrivateRoute>} />
          <Route path="/targets"    element={<AdminPrivateRoute><TargetsPage /></AdminPrivateRoute>} />
          <Route path="/telecallers"element={<AdminPrivateRoute><TelecallersPage /></AdminPrivateRoute>} />
          <Route path="/sales-team/:id" element={<AdminPrivateRoute><EmployeeDetailPage /></AdminPrivateRoute>} />
          <Route path="/profit-loss" element={<AdminPrivateRoute><ProfitLossPage /></AdminPrivateRoute>} />
          <Route path="/visits/:id" element={<AdminPrivateRoute><VisitDetailPage /></AdminPrivateRoute>} />

          {/* Naveen's private pages */}
          <Route path="/all-visits" element={<AdminPrivateRoute><AllVisitsPage /></AdminPrivateRoute>} />
          <Route path="/follow-ups" element={<AdminPrivateRoute><FollowUpsPage /></AdminPrivateRoute>} />
          <Route path="/analytics"  element={<AdminPrivateRoute><AnalyticsPage /></AdminPrivateRoute>} />
          <Route path="/reports"     element={<AdminPrivateRoute><ReportsPage /></AdminPrivateRoute>} />
          <Route path="/deliveries"  element={<AdminPrivateRoute><DeliveriesPage /></AdminPrivateRoute>} />
          <Route path="/shops"      element={<AdminPrivateRoute><ShopsPage /></AdminPrivateRoute>} />

          {/* NEW routes (additive) — Feature 1, 2, 3 */}
          <Route path="/driver-leads"  element={<AdminPrivateRoute><DriverLeadsPage /></AdminPrivateRoute>} />
          <Route path="/customers"     element={<AdminPrivateRoute><CustomersPage /></AdminPrivateRoute>} />
          <Route path="/customers/:id" element={<AdminPrivateRoute><CustomerDetailPage /></AdminPrivateRoute>} />
          <Route path="/sales-reports" element={<AdminPrivateRoute><SalesReportsPage /></AdminPrivateRoute>} />
          <Route path="/daily-invoices" element={<AdminPrivateRoute><DailyInvoicesPage /></AdminPrivateRoute>} />

          {/* NEW routes (additive) — Feature: two Admin Dashboard login
              types. Only reachable by an admin whose role is
              "distributor_admin" (DistributorAdminRoute enforces this);
              a field-sales admin is bounced back to /dashboard. */}
          <Route path="/distributor-admin/dashboard"        element={<DistributorAdminRoute><DistributorAdminDashboardPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/all"              element={<DistributorAdminRoute><AllDistributorsPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/add"               element={<DistributorAdminRoute><AddDistributorPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/map"               element={<DistributorAdminRoute><DistributorsMapPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/daily-requirement" element={<DistributorAdminRoute><DailyRequirementPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/products" element={<DistributorAdminRoute><ProductsPage /></DistributorAdminRoute>} />
          <Route path="/distributor-admin/:id"               element={<DistributorAdminRoute><DistributorDetailPage /></DistributorAdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}