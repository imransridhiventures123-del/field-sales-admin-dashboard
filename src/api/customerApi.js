// FILE: src/api/customerApi.js
// NEW FILE — Feature 2: "Customers" directory
import axiosInstance from "./axiosInstance";

const BASE = "/api/admin/customers";

export const getCustomers       = ()          => axiosInstance.get(BASE).then(r => r.data);
export const getCustomerById    = (id)        => axiosInstance.get(`${BASE}/${id}`).then(r => r.data);
export const updateCustomerTag  = (id, tag)   => axiosInstance.put(`${BASE}/${id}/tag`, { tag }).then(r => r.data);
export const deleteCustomer     = (id)        => axiosInstance.delete(`${BASE}/${id}`).then(r => r.data);