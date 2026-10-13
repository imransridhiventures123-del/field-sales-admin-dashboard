// FILE: src/api/adminEditApi.js
// NEW FILE — admin edits: fridge stock + delivery payment split.
import axiosInstance from "./axiosInstance";

// payload: { idly, dosa, billAmount?, cashCollected?, mode?, note? }
export const updateDistributorStock = (distributorId, payload) =>
  axiosInstance.put(`/api/distributors/admin/${distributorId}/stock`, payload).then((r) => r.data);

// payload: { cashAmount, onlineAmount, creditAmount }
export const updateDeliveryPayment = (recordId, payload) =>
  axiosInstance.put(`/api/deliveries/admin/${recordId}/payment`, payload).then((r) => r.data);