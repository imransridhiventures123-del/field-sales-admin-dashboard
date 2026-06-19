// FILE: src/components/TopBar.jsx
// OWNER: Imran
export default function TopBar({ title }) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Live</span>
      </div>
    </div>
  );
}