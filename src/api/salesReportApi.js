// FILE: src/api/salesReportApi.js
// NEW FILE — Feature 3: "Sales Reports" (kg trend + pie chart data)
import axiosInstance from "./axiosInstance";

const BASE = "/api/admin/sales-reports";

export const getDailySalesReport   = (date)  => axiosInstance.get(`${BASE}/daily`,   { params: { date } }).then(r => r.data);
export const getMonthlySalesReport = (month) => axiosInstance.get(`${BASE}/monthly`, { params: { month } }).then(r => r.data);