// FILE: src/pages/AdminLoginPage.jsx
// OWNER: Imran
// DUMMY CREDENTIALS: admin@maavu.com / admin123

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const DUMMY_ADMIN = { _id: "adm001", name: "Super Admin", email: "admin@maavu.com", role: "superadmin" };

export default function AdminLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(false);
  const { login }  = useAdminAuth();
  const navigate   = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email.trim())    { setError("Email is required.");    return; }
    if (!password.trim()) { setError("Password is required."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // DUMMY LOGIN — replace with adminLogin() API call when backend ready
    if (email === "admin@maavu.com" && password === "admin123") {
      login("dummy-admin-token-001", DUMMY_ADMIN);
      navigate("/dashboard");
    } else {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">M</span>
          </div>
          <div>
            <p className="text-white text-base font-semibold">Field-Sales-ProAdmin</p>
            <p className="text-gray-400 text-xs">Admin Dashboard</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Admin Login</h1>
        <p className="text-gray-400 text-sm mb-8">Sign in to manage your field team</p>

        {/* Dev hint */}
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-2xl px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-amber-400 mb-1">🧪 Dev Mode</p>
          <p className="text-xs text-amber-500 font-mono">admin@maavu.com / admin123</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/40 text-red-400 text-sm rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@maavu.com"
              className="w-full px-4 py-3.5 bg-gray-800 border border-gray-700 rounded-2xl text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="flex items-stretch bg-gray-800 border border-gray-700 rounded-2xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition overflow-hidden">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="flex-1 px-4 py-3.5 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="px-4 text-gray-500 hover:text-gray-300 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPw
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}
          className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2">
          {loading ? (
            <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...</>
          ) : "Sign In"}
        </button>
      </div>
    </div>
  );
}