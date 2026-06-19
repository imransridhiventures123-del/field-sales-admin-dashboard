// FILE: src/components/DataTable.jsx
// OWNER: Imran — reusable sortable table for any data
// Props: columns=[{key, label, render}], data=[], onRowClick
export default function DataTable({ columns, data, onRowClick, emptyText = "No data" }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-50 last:border-0 transition ${onRowClick ? "cursor-pointer hover:bg-blue-50/50" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}