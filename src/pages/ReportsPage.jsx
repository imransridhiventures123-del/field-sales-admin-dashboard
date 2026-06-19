// FILE: src/pages/ReportsPage.jsx — OWNER: Naveen
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";

const REPORTS = [
  { id:1, name:"Daily Visit Report",   desc:"All visits for selected date with shop details, GPS, follow-up status", icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id:2, name:"Employee Performance", desc:"Targets vs achievements per employee for the week/month",               icon:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" },
  { id:3, name:"Follow-up Report",     desc:"All pending and completed follow-ups with telecaller assignment",       icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id:4, name:"Shop Visit History",   desc:"Complete shop database with all visit history and owner contacts",      icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" },
];

export default function ReportsPage() {
  return (
    <AdminLayout title="Reports">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-xs text-amber-700">
        📎 Reports will auto-download as PDF. Connect backend to generate real data.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon}/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">{r.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3"/></svg>
                Download PDF
              </button>
              <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-300 transition"/>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}