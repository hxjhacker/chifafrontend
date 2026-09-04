/** Stable Meta / CAPI Purchase id. Pixel `eventID` and CAPI `event_id` must be identical. */
export function purchaseEventId(orderId: string) {
  const id = String(orderId || "").trim();
  return id ? `order_${id}` : "";
}
