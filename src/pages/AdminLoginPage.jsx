// FILE: src/pages/AdminLoginPage.jsx
// OWNER: Imran
// STATUS: REAL API — dummy login removed, real backend connected
// NOTE: UI/STYLING/ANIMATION ONLY UPDATE — no API endpoints, auth logic, or routes were touched.
//
// ASSET NEEDED:
//   Put the bubble background video at: public/videos/login-bg-bubbles.mp4
//   (create the "videos" folder inside your project's top-level "public" folder if it
//   doesn't exist yet, and drop login-bg-bubbles.mp4 in there — NOT inside src/)

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminLogin } from "../api/adminAuthApi";

// Served directly from the /public folder — put the file at:
//   public/videos/login-bg-bubbles.mp4
// Using a plain path (not an import) so Vite never needs to resolve/bundle it;
// if the file is missing you'll just see a blank video area, not a build error.
const bgVideo = "/videos/login-bg-bubbles.mp4";

export default function AdminLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(false);
  const { login }  = useAdminAuth();
  const navigate   = useNavigate();

  // ---------- UI-only animation state (no effect on auth logic) ----------
  const [cardLanded, setCardLanded] = useState(false); // triggers card drop -> settle
  const [bubbles, setBubbles]       = useState([]);    // click-burst bubbles on the button
  const burstId = useRef(0);

  useEffect(() => {
    // let the card "drop" in on mount, then settle so inner fields can stagger in
    const t = setTimeout(() => setCardLanded(true), 60);
    return () => clearTimeout(t);
  }, []);

  const popBubbles = () => {
    const count = 10;
    const newBubbles = Array.from({ length: count }).map(() => {
      burstId.current += 1;
      const spread    = (Math.random() - 0.5) * 220; // horizontal spread px
      const rise      = 60 + Math.random() * 70;      // upward travel px
      const size      = 8 + Math.random() * 16;
      const delay     = Math.random() * 0.12;
      const duration  = 0.6 + Math.random() * 0.5;
      return { id: burstId.current, spread, rise, size, delay, duration };
    });
    setBubbles(prev => [...prev, ...newBubbles]);
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => !newBubbles.some(nb => nb.id === b.id)));
    }, 1200);
  };

  const handleLogin = async () => {
    popBubbles(); // water-drop bubble burst, purely visual
    setError("");
    if (!email.trim())    { setError("Email is required.");    return; }
    if (!password.trim()) { setError("Password is required."); return; }
    setLoading(true);
    try {
      // REAL API CALL — hits POST /api/admin/auth/login on your backend
      const response = await adminLogin(email, password);
      // response = { token: "eyJ...", admin: { _id, name, email, role } }
      login(response.token, response.admin);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4">
      {/* ---------- Video background ---------- */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={bgVideo}
        autoPlay
        loop
        muted
        playsInline
      />
      {/* subtle dark wash so the glass card + text stay readable over the busy footage */}
      <div className="absolute inset-0 bg-black/25" />

      {/* ---------- Glass card — drops in like a water-glass slab, then settles ---------- */}
      <div className="relative w-full max-w-sm">
        <div
          className={`relative rounded-[28px] px-8 py-10 backdrop-blur-2xl border border-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.35)] ${cardLanded ? "card-drop-in" : "card-pre-drop"}`}
          style={{
            background: "linear-gradient(155deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
          }}
        >
          {/* glass top sheen */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden">
            <div className="absolute -top-1/2 -left-1/3 w-2/3 h-[220%] rotate-[18deg] bg-white/15 blur-sm" />
          </div>

          {/* ripple ring that "splashes" once the card lands */}
          {cardLanded && <span className="landing-ripple" />}

          {/* Logo */}
          <div
            className="relative flex flex-col items-center gap-3 mb-6 field-in"
            style={{ animationDelay: "0.45s" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg,#f6a24b,#ec6ea7 55%,#8b5cf6)" }}>
              <span className="text-white text-2xl font-bold drop-shadow">M</span>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-semibold tracking-wide drop-shadow">Field-Sales-Pro Admin</p>
            </div>
          </div>

          <h1
            className="relative text-center text-3xl font-extrabold text-white drop-shadow-sm mb-1 field-in"
            style={{ animationDelay: "0.55s" }}
          >
            Welcome Back
          </h1>
          <p
            className="relative text-center text-white/80 text-sm mb-8 field-in"
            style={{ animationDelay: "0.65s" }}
          >
            Sign in to manage your field team
          </p>

          {error && (
            <div className="relative bg-red-500/20 border border-red-300/40 text-red-50 text-sm rounded-2xl px-4 py-3 mb-5 backdrop-blur-sm text-center">
              {error}
            </div>
          )}

          <div className="relative space-y-4">
            {/* Email */}
            <div
              className="flex items-center gap-3 bg-white/15 border border-white/40 rounded-full px-5 py-3.5 backdrop-blur-md focus-within:border-white/80 focus-within:bg-white/20 transition field-in"
              style={{ animationDelay: "0.8s" }}
            >
              <svg className="w-5 h-5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="admin@maavu.com"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/60"
              />
            </div>

            {/* Password */}
            <div
              className="flex items-center gap-3 bg-white/15 border border-white/40 rounded-full px-5 py-3.5 backdrop-blur-md focus-within:border-white/80 focus-within:bg-white/20 transition field-in"
              style={{ animationDelay: "0.95s" }}
            >
              <svg className="w-5 h-5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/60"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/70 hover:text-white transition shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPw
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {/* Sign in button — bubbles pop from it on click */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="relative w-full mt-7 py-4 text-white font-bold rounded-full transition flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(236,110,167,0.45)] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:hover:brightness-100 field-in overflow-visible"
            style={{ background: "linear-gradient(90deg,#f6a24b,#ec6ea7 55%,#8b5cf6)", animationDelay: "1.1s" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in...
              </>
            ) : "Sign In"}

            {/* bubble burst layer */}
            <span className="pointer-events-none absolute inset-0 overflow-visible">
              {bubbles.map(b => (
                <span
                  key={b.id}
                  className="bubble-pop"
                  style={{
                    left: `calc(50% + ${b.spread}px)`,
                    width: b.size,
                    height: b.size,
                    animationDuration: `${b.duration}s`,
                    animationDelay: `${b.delay}s`,
                    "--rise": `${b.rise}px`,
                  }}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {/* ---------- Animation keyframes ---------- */}
      <style>{`
        .card-pre-drop {
          opacity: 0;
          transform: translateY(-160px) scaleY(0.85);
        }
        .card-drop-in {
          animation: cardDrop 0.85s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        @keyframes cardDrop {
          0%   { opacity: 0; transform: translateY(-160px) scaleY(0.8); }
          55%  { opacity: 1; transform: translateY(12px) scaleY(1.04); }
          75%  { transform: translateY(-6px) scaleY(0.98); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }

        .field-in {
          opacity: 0;
          transform: translateY(-14px);
          animation: fieldDrop 0.55s ease-out forwards;
        }
        @keyframes fieldDrop {
          0%   { opacity: 0; transform: translateY(-14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .landing-ripple {
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 70%;
          height: 14px;
          border-radius: 999px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%);
          transform: translateX(-50%) scaleX(0.3);
          opacity: 0;
          animation: ripple 0.7s ease-out 0.5s forwards;
          pointer-events: none;
        }
        @keyframes ripple {
          0%   { opacity: 0.9; transform: translateX(-50%) scaleX(0.2); }
          100% { opacity: 0; transform: translateX(-50%) scaleX(1.6); }
        }

        .bubble-pop {
          position: absolute;
          bottom: 6px;
          border-radius: 999px;
          background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 60%, rgba(255,255,255,0) 100%);
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
          opacity: 0;
          animation-name: bubbleRise;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes bubbleRise {
          0%   { opacity: 0.95; transform: translateY(0) scale(0.4); }
          70%  { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(calc(-1 * var(--rise))) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .card-pre-drop, .card-drop-in, .field-in, .landing-ripple, .bubble-pop {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}