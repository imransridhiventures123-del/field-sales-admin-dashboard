// FILE: src/api/productApi.js
// NEW FILE — Feature: real-time distributor workflow.
import axiosInstance from "./axiosInstance";

export const getProducts = () =>
  axiosInstance.get("/api/products").then((r) => r.data);

export const updateProduct = (key, payload) =>
  axiosInstance.put(`/api/products/admin/${key}`, payload).then((r) => r.data);