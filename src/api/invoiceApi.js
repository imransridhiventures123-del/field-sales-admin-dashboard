// FILE: src/api/invoiceApi.js
import axiosInstance from "./axiosInstance";

// Downloads the invoice PDF for a completed delivery and triggers a
// browser file-save. type is "with-gst" | "without-gst".
export const downloadInvoice = async (deliveryId, type) => {
  try {
    const res = await axiosInstance.get(`/api/invoice/${deliveryId}`, {
      params: { type },
      responseType: "blob",
    });

    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `invoice-${deliveryId}.pdf`;

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    // Error responses also come back as a Blob because responseType is
    // "blob" — parse it to surface the real backend message instead of
    // a generic "Network Error".
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || "Failed to download invoice.");
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "Failed to download invoice.") {
          throw new Error("Failed to download invoice.");
        }
        throw parseErr;
      }
    }
    if (!err.response) throw new Error("Network error. Please check your connection.");
    throw new Error(err.response?.data?.message || "Failed to download invoice.");
  }
};