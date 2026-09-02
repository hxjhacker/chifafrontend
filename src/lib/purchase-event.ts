/** Stable Meta / CAPI Purchase id. Pixel `eventID` and CAPI `event_id` must be identical. */
export type PurchaseKind = "order" | "upsell";

export function purchaseEventId(orderId: string, kind: PurchaseKind = "order") {
  const id = String(orderId || "").trim();
  if (!id) return "";
  return kind === "upsell" ? `purchase_${id}_upsell` : `purchase_${id}`;
}
