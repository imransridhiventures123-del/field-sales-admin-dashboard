// FILE: src/api/distributorBillApi.js
// NEW FILE — Feature: Distributor bills + ledger (what each distributor owes the company)
import axiosInstance from "./axiosInstance";

export const getDistributorBillSummary = () =>
  axiosInstance.get("/api/distributor-bills/admin/summary").then((r) => r.data);

export const getDistributorLedger = (distributorId) =>
  axiosInstance.get(`/api/distributor-bills/admin/distributor/${distributorId}`).then((r) => r.data);

// payload = { amount, mode: "cash" | "online" | "credit", appliesTo?: "bills" | "credit", note }
//   cash/online = money received (appliesTo "credit" repays the credit balance)
//   credit      = no money: the amount moves onto the distributor's credit (needs a credit limit)
export const addDistributorPayment = (distributorId, payload) =>
  axiosInstance.post(`/api/distributor-bills/admin/distributor/${distributorId}/payments`, payload).then((r) => r.data);

// NEW — max credit this distributor may keep with the company
export const setDistributorCreditLimit = (distributorId, limit) =>
  axiosInstance.put(`/api/distributor-bills/admin/distributor/${distributorId}/credit-limit`, { limit }).then((r) => r.data);

export const deleteDistributorPayment = (paymentId) =>
  axiosInstance.delete(`/api/distributor-bills/admin/payments/${paymentId}`).then((r) => r.data);