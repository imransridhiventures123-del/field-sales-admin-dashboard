// FILE: src/api/adminAuthApi.js — OWNER: Imran
import axiosInstance from "./axiosInstance";
export const adminLogin  = (email, password) => axiosInstance.post("/api/admin/auth/login", { email, password }).then(r => r.data);
export const getAdminMe  = () => axiosInstance.get("/api/admin/auth/me").then(r => r.data);