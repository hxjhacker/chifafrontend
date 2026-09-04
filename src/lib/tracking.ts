"use client";

import { sendTracking } from "./api";
import { purchaseEventId, type PurchaseKind } from "./purchase-event";

export type PixelWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (...args: unknown[]) => void; page: () => void };
  snaptr?: (...args: unknown[]) => void;
  __chifaglowPixelsReady?: boolean;
};

const queue: Array<() => void> = [];
const trackedPurchaseIds = new Set<string>();
const PURCHASE_STORAGE_PREFIX = "cg_purchase_event_";
const COMMERCE_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "CompletePayment"]);
const SERVER_OWNED_EVENTS = new Set(["Purchase", "CompletePayment", "PURCHASE"]);

export function pixelMoney(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw * 100) / 100;
  }
  const parsed = parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

export function pixelContentIds(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const ids = list.map((item) => String(item ?? "").trim()).filter(Boolean);
  return ids.length ? ids : ["default"];
}

function commerceParams(extra: Record<string, unknown>) {
  const value = pixelMoney(extra.value);
  const content_ids = pixelContentIds(extra.content_ids);
  return {
    value,
    currency: "MAD" as const,
    content_type: "product" as const,
    content_ids,
  };
}

export { purchaseEventId };
export type { PurchaseKind };

export function newEventId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function clickIds() {
  if (typeof window === "undefined") {
    return { fbp: "", fbc: "", ttclid: "", sccid: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const fbc =
    readCookie("_fbc") ||
    (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : "");
  return {
    fbp: readCookie("_fbp"),
    fbc,
    ttclid: params.get("ttclid") || readCookie("ttclid"),
    sccid: params.get("ScCid") || params.get("sccid") || "",
  };
}

export function markPixelsReady() {
  const w = window as PixelWindow;
  w.__chifaglowPixelsReady = true;
  while (queue.length) queue.shift()?.();
}

function run(fn: () => void) {
  const w = window as PixelWindow;
  if (w.__chifaglowPixelsReady) fn();
  else queue.push(fn);
}

function readStored(eventId: string) {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(PURCHASE_STORAGE_PREFIX + eventId)) return true;
    if (window.localStorage.getItem(PURCHASE_STORAGE_PREFIX + eventId)) return true;
  } catch {
    /* private mode */
  }
  return false;
}

function writeStored(eventId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PURCHASE_STORAGE_PREFIX + eventId, "1");
    window.localStorage.setItem(PURCHASE_STORAGE_PREFIX + eventId, "1");
  } catch {
    /* private mode */
  }
}

function hasTrackedPurchase(eventId: string) {
  if (!eventId) return true;
  if (trackedPurchaseIds.has(eventId)) return true;
  if (readStored(eventId)) {
    trackedPurchaseIds.add(eventId);
    return true;
  }
  return false;
}

function markTrackedPurchase(eventId: string) {
  trackedPurchaseIds.add(eventId);
  writeStored(eventId);
}

export function trackBrowser(
  eventName: string,
  eventId: string,
  extra: Record<string, unknown> = {},
) {
  run(() => {
    const w = window as PixelWindow;
    const metaName = eventName === "CompletePayment" ? "Purchase" : eventName;
    const params =
      COMMERCE_EVENTS.has(eventName) || COMMERCE_EVENTS.has(metaName)
        ? commerceParams(extra)
        : {};
    w.fbq?.("track", metaName, params, { eventID: eventId });
    const tiktokName =
      eventName === "Purchase" ? "CompletePayment" : eventName === "PageView" ? "Pageview" : eventName;
    w.ttq?.track(tiktokName, { ...params, event_id: eventId });
    const snapName: Record<string, string> = {
      PageView: "PAGE_VIEW",
      ViewContent: "VIEW_CONTENT",
      AddToCart: "ADD_CART",
      InitiateCheckout: "START_CHECKOUT",
      Purchase: "PURCHASE",
    };
    w.snaptr?.("track", snapName[eventName] || eventName.toUpperCase(), {
      ...params,
      client_dedup_id: eventId,
    });
  });
}

export function trackPurchaseOnce(opts: {
  orderId: string;
  value?: number | string;
  contentIds?: string[];
  kind?: PurchaseKind;
}) {
  const eventId = purchaseEventId(opts.orderId, opts.kind);
  if (!eventId || hasTrackedPurchase(eventId)) return eventId;
  markTrackedPurchase(eventId);
  trackBrowser("Purchase", eventId, {
    value: pixelMoney(opts.value),
    content_ids: pixelContentIds(opts.contentIds),
  });
  return eventId;
}

export function trackFunnel(
  eventName: string,
  opts: {
    eventId?: string;
    value?: number | string;
    contentIds?: string[];
    phone?: string;
    city?: string;
    fullName?: string;
  } = {},
) {
  if (SERVER_OWNED_EVENTS.has(eventName)) {
    return opts.eventId || "";
  }
  const eventId = opts.eventId || newEventId();
  const ids = clickIds();
  const value = pixelMoney(opts.value);
  const contentIds = pixelContentIds(opts.contentIds);
  trackBrowser(eventName, eventId, {
    value,
    content_ids: contentIds,
  });
  void sendTracking({
    event_name: eventName,
    event_id: eventId,
    event_source_url: typeof window !== "undefined" ? window.location.href : "",
    value,
    currency: "MAD",
    content_ids: contentIds,
    phone: opts.phone,
    city: opts.city,
    full_name: opts.fullName,
    ...ids,
  });
  return eventId;
}
