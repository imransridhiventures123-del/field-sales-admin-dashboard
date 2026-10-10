// FILE: src/pages/distributor-admin/DistributorLedgerPage.jsx
// UPDATED — Distributor Ledger (sidebar tab). Same page and route as
// before, now with: a proper bordered table, a date-range picker (look at
// any previous day / period), a PDF download for all distributors, and the
// full statement of each distributor one click away ("View Ledger").
// Uses only the existing ledger API functions — no backend change.
import { Fragment, useEffect, useMemo, useState } from "react";
import DistributorAdminLayout from "../../components/DistributorAdminLayout";
import { DateRangeBar, LedgerPanel, rupees } from "../../components/DistributorLedgerPanel";
import { getDistributorBillSummary, getDistributorLedger } from "../../api/distributorBillApi";
import { buildStatement, rangeLabel, downloadSummaryPdf } from "../../utils/ledgerStatement";

export default function DistributorLedgerPage() {
  const [summary, setSummary] = useState({ rows: [], totals: {} });
  const [ledgers, setLedgers] = useState({});      // distributorId -> { bills, payments, totals }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [openId, setOpenId] = useState(null);

  // Summary first (fast), then every distributor's ledger so the period
  // columns (opening / billed / received / closing) can be worked out.
  const load = () => {
    setLoading(true);
    setError("");
    getDistributorBillSummary()
      .then(async (s) => {
        setSummary(s);
        const results = await Promise.allSettled(s.rows.map((r) => getDistributorLedger(r.distributor._id)));
        const map = {};
        results.forEach((res, i) => { if (res.status === "fulfilled") map[s.rows[i].distributor._id] = res.value; });
        setLedgers(map);
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load the ledger."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const reloadOne = async (id) => {
    const [s, l] = await Promise.all([getDistributorBillSummary(), getDistributorLedger(id)]);
    setSummary(s);
    setLedgers((m) => ({ ...m, [id]: l }));
  };

  // one line per distributor for the chosen period
  const lines = useMemo(() => summary.rows.map((r) => {
    const l = ledgers[r.distributor._id];
    const st = l ? buildStatement(l.bills, l.payments, range) : null;
    return {
      id: r.distributor._id, distributor: r.distributor,
      ready: !!st,
      opening: st ? st.opening : 0,
      billed: st ? st.billed : r.totalBilled,
      received: st ? st.received : r.totalPaid,
      closing: st ? st.closing : r.pending,
      billCount: r.billCount,
    };
  }), [summary, ledgers, range]);

  const shown = lines.filter((l) =>
    (l.distributor.name + l.distributor.employeeId + (l.distributor.zone?.name || "")).toLowerCase().includes(search.toLowerCase())
  );
  const sum = (k) => Math.round(shown.reduce((s, l) => s + l[k], 0) * 100) / 100;
  const totals = { opening: sum("opening"), billed: sum("billed"), received: sum("received"), closing: sum("closing") };

  const tiles = [
    { label: "Opening Balance", value: totals.opening, cls: "text-gray-800" },
    { label: "Billed in Period", value: totals.billed, cls: "text-gray-800" },
    { label: "Received in Period", value: totals.received, cls: "text-green-600" },
    { label: "Pending (Closing)", value: totals.closing, cls: "text-red-500" },
  ];

  const downloadAll = () =>
    downloadSummaryPdf({
      range, totals,
      rows: shown.map((l) => ({ name: l.distributor.name, employeeId: l.distributor.employeeId, zone: l.distributor.zone?.name, opening: l.opening, billed: l.billed, received: l.received, closing: l.closing })),
    });

  return (
    <DistributorAdminLayout
      icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      title="Distributor Ledger"
      subtitle="Bills for approved batter / product requests and payments received"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-end justify-between gap-3">
        <DateRangeBar range={range} onChange={setRange} />
        <button onClick={downloadAll} disabled={loading || shown.length === 0} className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download PDF (all)
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400">{t.label}</p>
            <p className={`text-2xl font-bold mt-1 ${t.cls}`}>{rupees(t.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <div>
            <p className="font-semibold text-gray-800 text-sm">All Distributors</p>
            <p className="text-[11px] text-gray-400">Period: {rangeLabel(range)}</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or zone…" className="px-3 py-2 rounded-xl border border-gray-200 text-sm w-72" />
        </div>

        {loading && <div className="text-center text-gray-400 py-14">Loading…</div>}
        {error && <div className="text-center text-red-500 py-10 text-sm">{error} <button onClick={load} className="underline font-medium">Retry</button></div>}
        {!loading && !error && shown.length === 0 && <div className="text-center text-gray-400 py-14 text-sm">No distributors found.</div>}

        {!loading && !error && shown.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[860px]" data-testid="overview">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold border-b border-r border-gray-200 w-12">#</th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-r border-gray-200">Distributor</th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-r border-gray-200">Zone</th>
                  <th className="text-right px-4 py-3 font-semibold border-b border-r border-gray-200">Opening</th>
                  <th className="text-right px-4 py-3 font-semibold border-b border-r border-gray-200">Billed</th>
                  <th className="text-right px-4 py-3 font-semibold border-b border-r border-gray-200">Received</th>
                  <th className="text-right px-4 py-3 font-semibold border-b border-r border-gray-200">Pending</th>
                  <th className="text-center px-4 py-3 font-semibold border-b border-gray-200 w-36">Ledger</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l, i) => (
                  <Fragment key={l.id}>
                    <tr className={i % 2 ? "bg-gray-50/60" : "bg-white"}>
                      <td className="px-4 py-3 border-b border-r border-gray-200 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        <p className="font-medium text-gray-800">{l.distributor.name}</p>
                        <p className="text-xs text-gray-400">{l.distributor.employeeId} · {l.billCount} bill{l.billCount === 1 ? "" : "s"}</p>
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200 text-gray-500">{l.distributor.zone?.name || "—"}</td>
                      <td className="px-4 py-3 border-b border-r border-gray-200 text-right text-gray-600">{l.ready ? rupees(l.opening) : "…"}</td>
                      <td className="px-4 py-3 border-b border-r border-gray-200 text-right text-gray-800">{rupees(l.billed)}</td>
                      <td className="px-4 py-3 border-b border-r border-gray-200 text-right text-green-600">{rupees(l.received)}</td>
                      <td className={`px-4 py-3 border-b border-r border-gray-200 text-right font-bold ${l.closing > 0 ? "text-red-500" : "text-gray-400"}`}>{rupees(l.closing)}</td>
                      <td className="px-4 py-3 border-b border-gray-200 text-center">
                        <button onClick={() => setOpenId(openId === l.id ? null : l.id)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50">
                          {openId === l.id ? "Hide" : "View"} Ledger
                        </button>
                      </td>
                    </tr>
                    {openId === l.id && (
                      <tr>
                        <td colSpan={8} className="px-5 py-5 bg-gray-50 border-b border-gray-200">
                          {ledgers[l.id] ? (
                            <LedgerPanel
                              distributor={l.distributor} data={ledgers[l.id]}
                              range={range} onRangeChange={setRange} onReload={() => reloadOne(l.id)}
                            />
                          ) : <p className="text-sm text-gray-400">Loading…</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                <tr className="bg-gray-100 font-bold text-gray-800">
                  <td colSpan={3} className="px-4 py-3 border-r border-gray-200">Total</td>
                  <td className="px-4 py-3 text-right border-r border-gray-200">{rupees(totals.opening)}</td>
                  <td className="px-4 py-3 text-right border-r border-gray-200">{rupees(totals.billed)}</td>
                  <td className="px-4 py-3 text-right border-r border-gray-200 text-green-600">{rupees(totals.received)}</td>
                  <td className="px-4 py-3 text-right border-r border-gray-200 text-red-500">{rupees(totals.closing)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DistributorAdminLayout>
  );
}