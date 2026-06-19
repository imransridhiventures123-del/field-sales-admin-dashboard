// FILE: src/api/visitsApi.js — OWNER: Naveen
import axiosInstance from "./axiosInstance";
export const getAllVisits  = (params) => axiosInstance.get("/api/admin/visits", { params }).then(r => r.data);
export const getVisitById = (id) => axiosInstance.get(`/api/admin/visits/${id}`).then(r => r.data);
export const getFollowUps = () => axiosInstance.get("/api/admin/visits/followups").then(r => r.data);
export const getAnalytics = () => axiosInstance.get("/api/admin/analytics").then(r => r.data);