// FILE: src/api/telecallersApi.js — OWNER: Imran
import axiosInstance from "./axiosInstance";

export const getTelecallers    = () => axiosInstance.get("/api/admin/telecallers").then(r => r.data);
export const createTelecaller  = (data) => axiosInstance.post("/api/admin/telecallers", data).then(r => r.data);
export const updateTelecaller  = (id, data) => axiosInstance.put(`/api/admin/telecallers/${id}`, data).then(r => r.data);
export const deleteTelecaller  = (id) => axiosInstance.delete(`/api/admin/telecallers/${id}`).then(r => r.data);