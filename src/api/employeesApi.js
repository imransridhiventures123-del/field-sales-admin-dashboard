// FILE: src/api/employeesApi.js — OWNER: Imran
import axiosInstance from "./axiosInstance";
export const getEmployees     = () => axiosInstance.get("/api/admin/employees").then(r => r.data);
export const getEmployeeById  = (id) => axiosInstance.get(`/api/admin/employees/${id}`).then(r => r.data);
export const updateTarget     = (id, target) => axiosInstance.put(`/api/admin/employees/${id}/target`, { dailyTarget: target }).then(r => r.data);
export const getLiveLocations = () => axiosInstance.get("/api/admin/locations/live").then(r => r.data);