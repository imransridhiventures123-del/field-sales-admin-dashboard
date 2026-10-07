// FILE: src/api/deliveryApi.js
import axiosInstance from "./axiosInstance";

const BASE = "/api/driver/admin";

export const getDrivers          = ()             => axiosInstance.get(`${BASE}/drivers`).then(r=>r.data);
export const createDriver        = (data)         => axiosInstance.post(`${BASE}/drivers`,data).then(r=>r.data);
export const updateDriverRoute   = (id,route)      => axiosInstance.put(`${BASE}/drivers/${id}/route`,{route}).then(r=>r.data);
export const deleteDriver        = (id)           => axiosInstance.delete(`${BASE}/drivers/${id}`).then(r=>r.data);
// section param: "delivery" | "porter"
export const getDriverDeliveries = (id,date,sec)  => axiosInstance.get(`${BASE}/drivers/${id}/deliveries`,{params:{date,section:sec}}).then(r=>r.data);
export const getAllDeliveries     = (date,sec)     => axiosInstance.get(`${BASE}/deliveries`,{params:{date,section:sec}}).then(r=>r.data);
export const createDelivery      = (data)         => axiosInstance.post(`${BASE}/deliveries`,data).then(r=>r.data);
export const updateDelivery      = (id,data)      => axiosInstance.put(`${BASE}/deliveries/${id}`,data).then(r=>r.data);
export const deleteDelivery      = (id)           => axiosInstance.delete(`${BASE}/deliveries/${id}`).then(r=>r.data);
export const searchShops         = (q)            => axiosInstance.get(`${BASE}/shops`,{params:{q}}).then(r=>r.data);


export const getAdminDeliveries = (params = {}) =>
  axiosInstance.get("/api/deliveries/admin", { params }).then((r) => r.data);

export const getAdminDeliverySummary = (distributorId) =>
  axiosInstance.get("/api/deliveries/admin/summary", { params: { distributorId } }).then((r) => r.data);
 
// NEW — Feature: today's shops ordered vs delivered, and the ledger.
// With a distributorId the response also lists that distributor's shops.
export const getAdminTodayStatus = (distributorId) =>
  axiosInstance.get("/api/deliveries/admin/today-status", { params: distributorId ? { distributorId } : {} }).then((r) => r.data);

export const getAdminLedger = (distributorId) =>
  axiosInstance.get("/api/deliveries/admin/ledger", { params: { distributorId } }).then((r) => r.data);