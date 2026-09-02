import { createHash } from "node:crypto";
import { resolveCity } from "@/lib/cities";
import { purchaseEventId, type PurchaseKind } from "@/lib/purchase-event";
import { FB_PIXEL_ID } from "@/lib/pixels";

type CapiOrder = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  product_slug: string;
  tier_qty: number;
  tier_price_cents: number;
  cross_sell_slug: string | null;
  cross_sell_price_cents: number;
  upsell_slug: string | null;
  upsell_price_cents: number;
  subtotal_cents: number;
  total_cents: number;
  fbp?: string | null;
  fbc?: string | null;
  ttclid?: string | null;
  sccid?: string | null;
  client_ip?: string | null;
  user_agent?: string | null;
  landing_url?: string | null;
};

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function collapse(value: string) {
  return (value || "")
    .normalize("NFKC")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function centsToMad(cents: number) {
  return Math.round(cents) / 100;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://chifaglow.com").replace(
    /\/$/,
    "",
  );
}

function hashedUser(order: CapiOrder) {
  const phoneDigits = (order.phone || "").replace(/\D/g, "");
  const name = collapse(order.full_name || "");
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ") || first;
  const cityFr = collapse(resolveCity(order.city || "").fr || order.city || "");
  const userData: Record<string, unknown> = {
    country: [sha256Hex("ma")],
  };
  if (phoneDigits) userData.ph = [sha256Hex(phoneDigits)];
  if (first) userData.fn = [sha256Hex(first)];
  if (last) userData.ln = [sha256Hex(last)];
  if (cityFr) userData.ct = [sha256Hex(cityFr)];
  if (order.client_ip) userData.client_ip_address = order.client_ip;
  if (order.user_agent) userData.client_user_agent = order.user_agent;
  if (order.fbp) userData.fbp = order.fbp;
  if (order.fbc) userData.fbc = order.fbc;
  return userData;
}

function customData(order: CapiOrder, kind: PurchaseKind) {
  if (kind === "upsell" && order.upsell_slug) {
    const price = centsToMad(order.upsell_price_cents || 9900);
    return {
      currency: "MAD",
      value: price,
      content_type: "product",
      content_ids: [order.upsell_slug],
      contents: [{ id: order.upsell_slug, quantity: 1, item_price: price }],
      order_id: order.id,
    };
  }

  const ids = [order.product_slug];
  const contents = [
    {
      id: order.product_slug,
      quantity: order.tier_qty,
      item_price: centsToMad(Math.floor(order.tier_price_cents / Math.max(order.tier_qty, 1))),
    },
  ];
  if (order.cross_sell_slug) {
    ids.push(order.cross_sell_slug);
    contents.push({
      id: order.cross_sell_slug,
      quantity: 1,
      item_price: centsToMad(order.cross_sell_price_cents || 19900),
    });
  }
  return {
    currency: "MAD",
    value: centsToMad(order.subtotal_cents || order.total_cents),
    content_type: "product",
    content_ids: ids,
    contents,
    order_id: order.id,
  };
}

async function postMeta(eventId: string, order: CapiOrder, kind: PurchaseKind) {
  const pixelId = (process.env.META_PIXEL_ID || FB_PIXEL_ID || "").trim();
  const token = (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
  if (!pixelId || !token) return;

  const eventSourceUrl =
    (order.landing_url || "").trim() || `${siteUrl()}/thank-you?order=${encodeURIComponent(order.id)}`;
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: "website",
        user_data: hashedUser(order),
        custom_data: customData(order, kind),
      },
    ],
    access_token: token,
  };
  const testCode = (process.env.META_TEST_EVENT_CODE || "").trim();
  if (testCode) payload.test_event_code = testCode;

  const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("meta_capi_purchase_failed", res.status, body.slice(0, 400));
  }
}

export function sendPurchaseCapi(order: CapiOrder, kind: PurchaseKind = "order") {
  const eventId = purchaseEventId(order.id, kind);
  if (!eventId) return;
  void postMeta(eventId, order, kind).catch((err) => {
    console.error("meta_capi_purchase_failed", err);
  });
}
