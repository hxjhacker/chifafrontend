"use client";

import { sendTracking } from "./api";

export type PixelWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (...args: unknown[]) => void; page: () => void };
  snaptr?: (...args: unknown[]) => void;
  __chifaglowPixelsReady?: boolean;
};

const queue: Array<() => void> = [];

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

export function trackBrowser(
  eventName: string,
  eventId: string,
  extra: Record<string, unknown> = {},
) {
  run(() => {
    const w = window as PixelWindow;
    const params = {
      value: extra.value,
      currency: "MAD",
      content_ids: extra.content_ids,
      content_type: "product",
      ...extra,
    };
    w.fbq?.("track", eventName === "CompletePayment" ? "Purchase" : eventName, params, {
      eventID: eventId,
    });
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

export function trackFunnel(
  eventName: string,
  opts: {
    eventId?: string;
    value?: number;
    contentIds?: string[];
    phone?: string;
    city?: string;
    fullName?: string;
  } = {},
) {
  const eventId = opts.eventId || newEventId();
  const ids = clickIds();
  trackBrowser(eventName, eventId, {
    value: opts.value,
    content_ids: opts.contentIds,
  });
  void sendTracking({
    event_name: eventName,
    event_id: eventId,
    event_source_url: typeof window !== "undefined" ? window.location.href : "",
    value: opts.value,
    currency: "MAD",
    content_ids: opts.contentIds || [],
    phone: opts.phone,
    city: opts.city,
    full_name: opts.fullName,
    ...ids,
  });
  return eventId;
}
