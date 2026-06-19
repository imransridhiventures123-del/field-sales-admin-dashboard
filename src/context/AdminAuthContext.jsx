// FILE: src/context/AdminAuthContext.jsx
// OWNER: Imran
import { createContext, useContext, useState } from "react";
const AdminAuthContext = createContext();
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => { const s = localStorage.getItem("maavu_admin"); return s ? JSON.parse(s) : null; });
  const [token, setToken] = useState(() => localStorage.getItem("maavu_admin_token") || null);
  const login = (t, a) => { localStorage.setItem("maavu_admin_token", t); localStorage.setItem("maavu_admin", JSON.stringify(a)); setToken(t); setAdmin(a); };
  const logout = () => { localStorage.removeItem("maavu_admin_token"); localStorage.removeItem("maavu_admin"); setToken(null); setAdmin(null); };
  return <AdminAuthContext.Provider value={{ admin, token, login, logout }}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth() { return useContext(AdminAuthContext); }