// FILE: src/api/axiosInstance.js
// OWNER: Imran
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const axiosInstance = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("maavu_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axiosInstance.interceptors.response.use((res) => res, (err) => {
  if (err.response?.status === 401) { localStorage.removeItem("maavu_admin_token"); localStorage.removeItem("maavu_admin"); window.location.href = "/login"; }
  return Promise.reject(err);
});
export default axiosInstance;