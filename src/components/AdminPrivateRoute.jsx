// FILE: src/components/AdminPrivateRoute.jsx
// OWNER: Imran
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
export default function AdminPrivateRoute({ children }) {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}