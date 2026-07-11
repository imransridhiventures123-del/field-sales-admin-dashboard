// FILE: src/api/driverLeadApi.js
// NEW FILE — Feature 1: "Drivers List" (backup driver leads)
import axiosInstance from "./axiosInstance";

const BASE = "/api/admin/driver-leads";

export const getDriverLeads    = (status)     => axiosInstance.get(BASE, { params: status ? { status } : {} }).then(r => r.data);
export const getDriverLead     = (id)         => axiosInstance.get(`${BASE}/${id}`).then(r => r.data);
export const createDriverLead  = (data)       => axiosInstance.post(BASE, data).then(r => r.data);
export const updateDriverLead  = (id, data)   => axiosInstance.put(`${BASE}/${id}`, data).then(r => r.data);
export const deleteDriverLead  = (id)         => axiosInstance.delete(`${BASE}/${id}`).then(r => r.data);