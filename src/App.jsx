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
import ShopsPage         from "./pages/ShopsPage";

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
          <Route path="/reports"    element={<AdminPrivateRoute><ReportsPage /></AdminPrivateRoute>} />
          <Route path="/shops"      element={<AdminPrivateRoute><ShopsPage /></AdminPrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}