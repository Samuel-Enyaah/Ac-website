export const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out-for-delivery",
  "delivered",
  "cancelled",
];
export const bookingStatuses = [
  "pending",
  "confirmed",
  "technician-assigned",
  "in-progress",
  "completed",
  "cancelled",
];
export const staffRoles = [
  "Administrator",
  "Operations",
  "Technician",
  "Customer Support",
];
export const titleCase = (text = "") =>
  String(text)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";
export const money = (value) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(
    Number(value || 0),
  );
export function customerKey(phone = "") {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0"))
    digits = `233${digits.slice(1)}`;
  if (digits.length === 13 && digits.startsWith("2330"))
    digits = `233${digits.slice(4)}`;
  return digits;
}
export const entityPath = (type, id) =>
  type === "settings"
    ? "/admin/settings"
    : `/admin/${{ order: "orders", booking: "bookings", staff: "staff" }[type]}/${id}`;
