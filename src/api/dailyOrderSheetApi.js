// FILE: src/api/dailyOrderSheetApi.js
// PURPOSE: Downloads the printable Daily Order Sheet PDF. Same
// blob-download pattern as invoiceApi.js so it behaves identically in
// the browser (auto-downloads, surfaces real backend error messages).
import axiosInstance from "./axiosInstance";

// date is optional — "YYYY-MM-DD". Omit to default to today (backend-side).
export const downloadDailyOrderSheet = async (date) => {
  try {
    const res = await axiosInstance.get("/api/admin/daily-order-sheet", {
      params: date ? { date } : {},
      responseType: "blob",
    });

    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : "Daily_Order_Sheet.pdf";

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || "Failed to generate the daily order sheet.");
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "Failed to generate the daily order sheet.") {
          throw new Error("Failed to generate the daily order sheet.");
        }
        throw parseErr;
      }
    }
    if (!err.response) throw new Error("Network error. Please check your connection.");
    throw new Error(err.response?.data?.message || "Failed to generate the daily order sheet.");
  }
};