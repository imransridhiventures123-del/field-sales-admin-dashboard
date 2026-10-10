// FILE: src/utils/ledgerStatement.js
// NEW FILE — Feature: Distributor ledger (statement + PDF).
// Pure helpers, no API calls. Turns the bills + payments that the existing
// ledger API already returns into a proper statement:
//   Date | Particulars | Billed (Dr) | Received (Cr) | Running balance
// with an Opening balance (everything before the chosen "from" date) and a
// Closing balance (everything up to the "to" date). Dates are compared as
// local calendar days, so the date pickers behave exactly like the screen.
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/* ───────────────────────── dates ───────────────────────── */
const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // local day
export const todayISO = () => toISO(new Date());
const dayOf = (value) => toISO(new Date(value));

export const fmtDay = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
];

export function presetRange(key, now = new Date()) {
  const d = (y, m, day) => new Date(y, m, day);
  const y = now.getFullYear(), m = now.getMonth(), day = now.getDate();
  switch (key) {
    case "today": return { from: toISO(now), to: toISO(now) };
    case "yesterday": { const t = d(y, m, day - 1); return { from: toISO(t), to: toISO(t) }; }
    case "last7": return { from: toISO(d(y, m, day - 6)), to: toISO(now) };
    case "month": return { from: toISO(d(y, m, 1)), to: toISO(now) };
    case "lastMonth": return { from: toISO(d(y, m - 1, 1)), to: toISO(d(y, m, 0)) };
    default: return { from: "", to: "" }; // all time
  }
}

export function rangeLabel({ from, to }) {
  if (!from && !to) return "All time";
  if (from && to) return from === to ? fmtDay(from) : `${fmtDay(from)} to ${fmtDay(to)}`;
  return from ? `From ${fmtDay(from)}` : `Up to ${fmtDay(to)}`;
}

/* ───────────────────────── statement ───────────────────────── */
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function billParticulars(b) {
  const what = (b.items || []).map((it) => `${it.productName || it.productKey} ${it.qty} ${it.unit || "kg"} x Rs.${it.rate}`).join(", ");
  return {
    title: `Bill ${b.billNumber}`,
    sub: `${b.sourceType === "batter_request" ? "Batter request" : "Product request"}${what ? " - " + what : ""}`,
  };
}

// bills/payments: exactly what GET /api/distributor-bills/admin/distributor/:id returns.
export function buildStatement(bills = [], payments = [], range = { from: "", to: "" }) {
  const events = [
    ...bills.map((b) => ({
      kind: "bill", id: b._id, ts: new Date(b.billDate).getTime(), day: dayOf(b.billDate),
      debit: r2(b.totalAmount), credit: 0, bill: b, ...billParticulars(b),
    })),
    ...payments.map((p) => ({
      kind: "payment", id: p._id, ts: new Date(p.receivedAt).getTime(), day: dayOf(p.receivedAt),
      debit: 0, credit: r2(p.amount), payment: p,
      title: `Payment received (${p.mode === "online" ? "Online / GPay" : "Cash"})`, sub: p.note || "",
    })),
  ].sort((a, b) => a.ts - b.ts || (a.kind === "bill" ? -1 : 1));

  let running = 0, opening = 0, closing = 0;
  const rows = [];
  let billed = 0, received = 0;
  for (const e of events) {
    running = r2(running + e.debit - e.credit);
    e.balance = running;
    if (range.from && e.day < range.from) { opening = running; continue; }      // before the window
    if (range.to && e.day > range.to) continue;                                  // after the window
    rows.push(e);
    billed = r2(billed + e.debit);
    received = r2(received + e.credit);
  }
  closing = rows.length ? rows[rows.length - 1].balance : opening;
  // closing must also be right when later events exist but the window is empty
  if (!rows.length && range.to) {
    closing = 0;
    for (const e of events) if (e.day <= range.to) closing = e.balance;
  }
  return { opening: r2(opening), billed, received, closing: r2(closing), rows };
}

/* ───────────────────────── PDF ───────────────────────── */
const money = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const NAVY = [26, 42, 84];
const TEAL = [13, 148, 136];

function header(doc, title, subtitleLines) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(15).text("Sridhi Distributors", 14, 11);
  doc.setFont("helvetica", "normal").setFontSize(10).text(title, 14, 18);
  doc.setTextColor(60, 60, 60).setFontSize(10);
  let y = 33;
  subtitleLines.forEach((line) => { doc.text(line, 14, y); y += 5.5; });
  return y;
}

function footer(doc) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(130, 130, 130);
    doc.text(`Generated on ${fmtDay(todayISO())}`, 14, h - 8);
    doc.text(`Page ${i} of ${pages}`, w - 14, h - 8, { align: "right" });
  }
}

// One distributor: bordered statement table. Returns the jsPDF doc.
export function buildStatementPdf({ distributor, statement, range }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const startY = header(doc, "Distributor Ledger Statement", [
    `Distributor: ${distributor?.name || ""}${distributor?.employeeId ? `  (${distributor.employeeId})` : ""}`,
    `Period: ${rangeLabel(range)}`,
  ]);

  const body = [];
  body.push([{ content: "Opening balance", colSpan: 4, styles: { fontStyle: "italic" } }, { content: money(statement.opening), styles: { halign: "right", fontStyle: "italic" } }]);
  statement.rows.forEach((r) => {
    body.push([
      fmtDay(r.day),
      r.sub ? `${r.title}\n${r.sub}` : r.title,
      r.debit ? money(r.debit) : "",
      r.credit ? money(r.credit) : "",
      money(r.balance),
    ]);
  });
  body.push([
    { content: "Total for period", colSpan: 2, styles: { fontStyle: "bold" } },
    { content: money(statement.billed), styles: { fontStyle: "bold" } },
    { content: money(statement.received), styles: { fontStyle: "bold" } },
    "",
  ]);
  body.push([{ content: "Closing balance (pending)", colSpan: 4, styles: { fontStyle: "bold", fillColor: [254, 242, 242], textColor: [185, 28, 28] } }, { content: money(statement.closing), styles: { halign: "right", fontStyle: "bold", fillColor: [254, 242, 242], textColor: [185, 28, 28] } }]);

  autoTable(doc, {
    startY: startY + 2,
    head: [["Date", "Particulars", "Billed (Dr)", "Received (Cr)", "Balance"]],
    body,
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: [210, 214, 220], lineWidth: 0.2, valign: "middle" },
    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: "auto" }, 2: { halign: "right", cellWidth: 27 }, 3: { halign: "right", cellWidth: 27 }, 4: { halign: "right", cellWidth: 27 } },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    margin: { left: 14, right: 14 },
  });
  footer(doc);
  return doc;
}

// All distributors: one summary line each. rows = [{ name, employeeId, zone, opening, billed, received, closing }]
export function buildSummaryPdf({ rows, totals, range }) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const startY = header(doc, "Distributor Ledger - All Distributors", [`Period: ${rangeLabel(range)}`]);
  const body = rows.map((r, i) => [i + 1, `${r.name}\n${r.employeeId || ""}`, r.zone || "-", money(r.opening), money(r.billed), money(r.received), money(r.closing)]);
  body.push([
    { content: "Total", colSpan: 3, styles: { fontStyle: "bold" } },
    { content: money(totals.opening), styles: { fontStyle: "bold" } },
    { content: money(totals.billed), styles: { fontStyle: "bold" } },
    { content: money(totals.received), styles: { fontStyle: "bold" } },
    { content: money(totals.closing), styles: { fontStyle: "bold", textColor: [185, 28, 28] } },
  ]);
  autoTable(doc, {
    startY: startY + 2,
    head: [["#", "Distributor", "Zone", "Opening", "Billed", "Received", "Pending (closing)"]],
    body,
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.4, lineColor: [210, 214, 220], lineWidth: 0.2, valign: "middle" },
    columnStyles: { 0: { cellWidth: 10 }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    margin: { left: 14, right: 14 },
  });
  footer(doc);
  return doc;
}

const safe = (s) => String(s || "ledger").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
export const downloadStatementPdf = (args) =>
  buildStatementPdf(args).save(`Ledger_${safe(args.distributor?.name)}_${args.range.from || "start"}_to_${args.range.to || todayISO()}.pdf`);
export const downloadSummaryPdf = (args) =>
  buildSummaryPdf(args).save(`Distributor_Ledger_${args.range.from || "start"}_to_${args.range.to || todayISO()}.pdf`);