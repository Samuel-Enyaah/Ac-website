import { operationalError } from "./operationEvents.js";

export const orderTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["out-for-delivery", "delivered", "cancelled"],
  "out-for-delivery": ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
export const bookingTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["technician-assigned", "cancelled"],
  "technician-assigned": ["in-progress", "cancelled"],
  "in-progress": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export function allowedTransitions(type, record) {
  let allowed = [
    ...((type === "order" ? orderTransitions : bookingTransitions)[
      record.status
    ] || []),
  ];
  if (type === "order" && record.status === "ready")
    allowed = allowed.filter(
      (s) =>
        s !==
        (record.fulfillmentMethod === "pickup"
          ? "out-for-delivery"
          : "delivered"),
    );
  if (type === "booking" && !record.assignedStaff)
    allowed = allowed.filter(
      (s) => s !== "technician-assigned" && s !== "in-progress",
    );
  return allowed;
}
export function assertTransition(type, record, status) {
  if (!status || status === record.status) return;
  if (!allowedTransitions(type, record).includes(status))
    throw operationalError(
      `Cannot change ${type} from ${record.status} to ${status}. Refresh and follow the available next steps.`,
      400,
    );
}
