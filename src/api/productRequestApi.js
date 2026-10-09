// FILE: src/api/productRequestApi.js
// NEW FILE — Feature: "Request Product" (Daily Requirement → Product Requests)
import axiosInstance from "./axiosInstance";

export const getAllProductRequests = (params = {}) =>
  axiosInstance.get("/api/product-requests/admin", { params }).then((r) => r.data);

// payload = { approvedItems: [{ productKey, qty }], deliveryDate: "YYYY-MM-DD", deliveryTime: "HH:mm", adminNote }
export const approveProductRequest = (id, payload) =>
  axiosInstance.put(`/api/product-requests/admin/${id}/approve`, payload).then((r) => r.data);

export const rejectProductRequest = (id, adminNote) =>
  axiosInstance.put(`/api/product-requests/admin/${id}/reject`, { adminNote }).then((r) => r.data);