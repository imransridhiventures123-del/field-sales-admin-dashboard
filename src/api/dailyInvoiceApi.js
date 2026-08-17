// FILE: src/api/dailyInvoiceApi.js
import axiosInstance from "./axiosInstance";

const BASE = "/api/admin/invoices/daily";

// GET status for a given date (defaults to today on the backend if omitted)
export const getDailyInvoiceStatus = (date) =>
  axiosInstance.get(BASE, { params: { date } }).then(r => r.data);

// POST — triggers generation for that date. Safe to call repeatedly
// (idempotent — see backend dailyInvoiceService.js).
export const generateDailyInvoices = (date) =>
  axiosInstance.post(`${BASE}/generate`, {}, { params: { date } }).then(r => r.data);

// Downloads ONE already-generated invoice PDF (blob download, same pattern
// as the existing per-delivery invoiceApi.js).
export const downloadDailyInvoice = async (dailyInvoiceId, fileName) => {
  const res = await axiosInstance.get(`${BASE}/${dailyInvoiceId}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "invoice.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};