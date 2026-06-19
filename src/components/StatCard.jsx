// FILE: src/components/StatCard.jsx
// OWNER: Naveen — reusable KPI card used on Dashboard and Analytics
export default function StatCard({ label, value, sub, color = "blue", icon }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   icon: "bg-blue-100"   },
    green:  { bg: "bg-green-50",  text: "text-green-600",  icon: "bg-green-100"  },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  icon: "bg-amber-100"  },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100" },
    red:    { bg: "bg-red-50",    text: "text-red-600",    icon: "bg-red-100"    },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      {icon && (
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center mb-3`}>
          <svg className={`w-5 h-5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon}/>
          </svg>
        </div>
      )}
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${c.text}`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}