// FILE: src/api/profitLossApi.js — OWNER: Imran
// Real per-employee P&L data: salary + orders placed (Field Sales) +
// collection amount (real ₹ logged by employees via the PWA's ledger).
import axiosInstance from "./axiosInstance";

export const getProfitLoss = () => axiosInstance.get("/api/admin/profit-loss").then(r => r.data);