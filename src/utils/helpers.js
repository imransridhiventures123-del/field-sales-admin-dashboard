// FILE: src/utils/helpers.js — OWNER: Both add to this
export const formatDate     = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const formatTime     = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
export const formatDateTime = (d) => `${formatDate(d)}, ${formatTime(d)}`;
export const getInitials    = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
export const STATUS_COLOR   = { Completed: "bg-green-50 text-green-700", Pending: "bg-amber-50 text-amber-700", Rejected: "bg-red-50 text-red-600", Online: "bg-green-50 text-green-700", Offline: "bg-gray-100 text-gray-500" };
export const FOLLOWUP_LABEL = { interested: "Interested", callback: "Call Back", not_interested: "Not Interested", busy: "Busy", order_placed: "Order Placed", payment_due: "Payment Due" };
export const FOLLOWUP_COLOR = { interested: "bg-green-50 text-green-700", callback: "bg-blue-50 text-blue-700", not_interested: "bg-red-50 text-red-600", busy: "bg-amber-50 text-amber-700", order_placed: "bg-purple-50 text-purple-700", payment_due: "bg-orange-50 text-orange-700" };