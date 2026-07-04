// FILE: src/api/deliveryApi.js
import axiosInstance from "./axiosInstance";

const BASE = "/api/driver/admin";

export const getDrivers          = ()          => axiosInstance.get(`${BASE}/drivers`).then(r => r.data);
export const getDriverDeliveries = (id, date)  => axiosInstance.get(`${BASE}/drivers/${id}/deliveries`, { params: { date } }).then(r => r.data);
export const getAllDeliveries     = (date)      => axiosInstance.get(`${BASE}/deliveries`, { params: { date } }).then(r => r.data);
export const createDelivery      = (data)      => axiosInstance.post(`${BASE}/deliveries`, data).then(r => r.data);
export const updateDelivery      = (id, data)  => axiosInstance.put(`${BASE}/deliveries/${id}`, data).then(r => r.data);
export const deleteDelivery      = (id)        => axiosInstance.delete(`${BASE}/deliveries/${id}`).then(r => r.data);

export const createDriver = (data) => axiosInstance.post(`${BASE}/drivers`, data).then(r => r.data);
export const deleteDriver  = (id)   => axiosInstance.delete(`${BASE}/drivers/${id}`).then(r => r.data);
export const searchShops = (q) => axiosInstance.get(`${BASE}/shops`, { params: { q } }).then(r => r.data);