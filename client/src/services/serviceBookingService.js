import api from "./api";
const storageKey = "rj-service-attempt";
let memoryAttempt;
function loadAttempt() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    const payload = saved && JSON.parse(saved.fingerprint);
    if (
      saved &&
      /^[A-Za-z0-9_-]{16,128}$/.test(saved.key) &&
      payload?.customer?.name &&
      payload?.serviceType &&
      payload?.preferredDate &&
      typeof payload.description === "string"
    )
      memoryAttempt = saved;
  } catch {
    /* Ignore corrupt storage; retain an in-memory attempt when available. */
  }
  return memoryAttempt;
}
function clearAttempt() {
  memoryAttempt = undefined;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* Storage may be unavailable. */
  }
}
export function pendingBookingData() {
  try {
    const attempt = loadAttempt();
    return attempt ? JSON.parse(attempt.fingerprint) : null;
  } catch {
    return null;
  }
}
export function pendingBookingForm() {
  const data = pendingBookingData();
  return data ? { ...data, ...data.customer } : null;
}
export async function createServiceBooking(data) {
  const fingerprint = JSON.stringify(data);
  let attempt = loadAttempt();
  if (attempt && attempt.fingerprint !== fingerprint)
    throw new Error(
      "A previous request needs confirmation. Retry its original details before submitting another request.",
    );
  attempt ||= { key: crypto.randomUUID(), fingerprint };
  memoryAttempt = attempt;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(attempt));
  } catch {
    /* Memory still protects retries in this tab. */
  }
  try {
    const response = await api.post("/service-bookings", data, {
      headers: { "Idempotency-Key": attempt.key },
    });
    clearAttempt();
    return response.data.booking;
  } catch (error) {
    if (error.response?.status === 400) clearAttempt();
    throw error;
  }
}
