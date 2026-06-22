// FILE: src/context/AdminAuthContext.jsx
// OWNER: Imran
// CHANGE: Added verifyToken() on mount — when the admin dashboard reopens
// with a stored token, it silently calls /api/admin/auth/me to confirm the
// token is still valid. If valid → stay logged in. If expired → go to login.
// ADMIN_JWT_EXPIRE on Render was extended to 30d so admins stay logged in.

import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {

  const [admin, setAdmin] = useState(() => {
    const s = localStorage.getItem("maavu_admin");
    return s ? JSON.parse(s) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("maavu_admin_token") || null;
  });

  // true while we verify the stored token on first load
  const [checking, setChecking] = useState(!!localStorage.getItem("maavu_admin_token"));

  // On app open — verify stored token with the backend
  useEffect(() => {
    const storedToken = localStorage.getItem("maavu_admin_token");
    if (!storedToken) { setChecking(false); return; }

    axiosInstance.get("/api/admin/auth/me")
      .then((res) => {
        const freshAdmin = res.data.admin || res.data;
        localStorage.setItem("maavu_admin", JSON.stringify(freshAdmin));
        setAdmin(freshAdmin);
      })
      .catch(() => {
        localStorage.removeItem("maavu_admin_token");
        localStorage.removeItem("maavu_admin");
        setToken(null);
        setAdmin(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = (t, a) => {
    localStorage.setItem("maavu_admin_token", t);
    localStorage.setItem("maavu_admin", JSON.stringify(a));
    setToken(t);
    setAdmin(a);
  };

  const logout = () => {
    localStorage.removeItem("maavu_admin_token");
    localStorage.removeItem("maavu_admin");
    setToken(null);
    setAdmin(null);
  };

  // Prevent login-page flash while token check runs
  if (checking) return null;

  return (
    <AdminAuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}