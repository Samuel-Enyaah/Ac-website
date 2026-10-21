import api from "./api";
const storageKey = "rj-checkout-attempt";
let memoryAttempt;
export async function createOrder(orderData) {
  const fingerprint = JSON.stringify(orderData);
  let attempt = loadAttempt();
  if (!attempt || attempt.fingerprint !== fingerprint) {
    // Do not silently issue a different order after an ambiguous timeout.
    if (attempt)
      throw new Error(
        "A previous checkout needs confirmation. Retry its original details before placing a different order.",
      );
    attempt = { key: crypto.randomUUID(), fingerprint };
  }
  memoryAttempt = attempt;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(attempt));
  } catch {
    /* In-memory retries remain protected. */
  }
  try {
    const response = await api.post("/orders", orderData, {
      headers: { "Idempotency-Key": attempt.key },
    });
    memoryAttempt = undefined;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* No persistent storage. */
    }
    return response.data.order;
  } catch (error) {
    if (error.response?.status === 400) {
      memoryAttempt = undefined;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* No persistent storage. */
      }
    }
    throw error;
  }
}

export function pendingCheckoutForm() {
  try {
    const attempt = loadAttempt();
    if (!attempt) return null;
    const data = JSON.parse(attempt.fingerprint);
    return {
      ...data.customer,
      fulfillmentMethod: data.fulfillmentMethod,
      address: data.deliveryAddress?.address || "",
      town: data.deliveryAddress?.town || "",
      landmark: data.deliveryAddress?.landmark || "",
      installationRequired: data.installationRequired,
      installationAddress: data.installationAddress,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    };
  } catch {
    return null;
  }
}

function loadAttempt() {
  let attempt = memoryAttempt;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (
      saved &&
      /^[A-Za-z0-9_-]{16,128}$/.test(saved.key) &&
      typeof saved.fingerprint === "string" &&
      Array.isArray(JSON.parse(saved.fingerprint)?.items)
    )
      attempt = saved;
  } catch {
    /* Ignore malformed storage, keep the in-memory attempt. */
  }
  return attempt;
}
export function pendingOrderData() {
  try {
    const attempt = loadAttempt();
    return attempt ? JSON.parse(attempt.fingerprint) : null;
  } catch {
    return null;
  }
}
