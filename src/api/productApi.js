// FILE: src/api/productApi.js
// UPDATED — Feature: admin-managed product catalog (Level 2).
// getProducts / updateProduct are unchanged; createProduct, deleteProduct
// and uploadProductImage are new.
import axiosInstance from "./axiosInstance";

export const getProducts = () =>
  axiosInstance.get("/api/products").then((r) => r.data);

export const updateProduct = (key, payload) =>
  axiosInstance.put(`/api/products/admin/${key}`, payload).then((r) => r.data);

export const createProduct = (payload) =>
  axiosInstance.post("/api/products/admin", payload).then((r) => r.data);

export const deleteProduct = (key) =>
  axiosInstance.delete(`/api/products/admin/${key}`).then((r) => r.data);

// Uploads one picture and returns { imageUrl } (the hosted link). The
// Content-Type header MUST be overridden here: this app's axios instance
// sends "application/json" by default, and axios would then turn the
// FormData into JSON and lose the file. With "multipart/form-data" axios
// leaves the FormData alone and the browser adds the correct boundary.
export const uploadProductImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return axiosInstance
    .post("/api/products/admin/upload-image", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};