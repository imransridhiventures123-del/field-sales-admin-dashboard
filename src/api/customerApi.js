// FILE: src/api/customerApi.js
// NEW FILE — Feature 2: "Customers" directory
import axiosInstance from "./axiosInstance";

const BASE = "/api/admin/customers";

export const getCustomers       = ()          => axiosInstance.get(BASE).then(r => r.data);
// NEW — server-side search, used by the Assign Delivery autocomplete so
// the whole customer table is never downloaded to the browser (Feature 18).
export const searchCustomers    = (q, limit=8) => axiosInstance.get(BASE, { params: { q, limit } }).then(r => r.data);
export const getCustomerById    = (id)        => axiosInstance.get(`${BASE}/${id}`).then(r => r.data);
export const updateCustomerTag  = (id, tag)   => axiosInstance.put(`${BASE}/${id}/tag`, { tag }).then(r => r.data);
// NEW — Daily Invoice feature: admin saves the exact WhatsApp group name for this customer.
export const updateWhatsappGroup = (id, whatsappGroupName) => axiosInstance.put(`${BASE}/${id}/whatsapp`, { whatsappGroupName }).then(r => r.data);
export const deleteCustomer     = (id)        => axiosInstance.delete(`${BASE}/${id}`).then(r => r.data);