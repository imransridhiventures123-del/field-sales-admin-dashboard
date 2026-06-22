// FILE: src/context/AdminAuthContext.jsx
// OWNER: Imran
// CHANGE: Same fix as PWA AuthContext — only clear token on 401,
// not on network errors (Render sleeping). Admin stays logged in.

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

  const [checking, setChecking] = useState(
    !!localStorage.getItem("maavu_admin_token")
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("maavu_admin_token");
    if (!storedToken) { setChecking(false); return; }

    axiosInstance.get("/api/admin/auth/me")
      .then((res) => {
        const freshAdmin = res.data.admin || res.data;
        localStorage.setItem("maavu_admin", JSON.stringify(freshAdmin));
        setAdmin(freshAdmin);
      })
      .catch((err) => {
        // Only logout on 401 — keep admin logged in on network errors
        if (err.response?.status === 401) {
          localStorage.removeItem("maavu_admin_token");
          localStorage.removeItem("maavu_admin");
          setToken(null);
          setAdmin(null);
        }
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