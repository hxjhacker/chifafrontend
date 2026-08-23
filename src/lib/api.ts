import { API_URL } from "./cn";

export type OrderPayload = {
  full_name: string;
  phone: string;
  city: string;
  product_slug: string;
  tier_qty: 1 | 2 | 3;
  cross_sell_slug?: string | null;
  event_id: string;
  fbp?: string | null;
  fbc?: string | null;
  ttclid?: string | null;
  sccid?: string | null;
  landing_url?: string | null;
};

export type OrderResponse = {
  order_id: string;
  status: string;
  full_name: string;
  phone_national: string;
  city: string;
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
  subtotal: number;
  total: number;
  currency: string;
  items: { product_slug: string; role: string; quantity: number; line_total: number }[];
  upsell_offer: { price: number; candidates: string[] };
};

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `http_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function submitOrder(payload: OrderPayload) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse<OrderResponse>(res);
}

export async function submitUpsell(orderId: string, productSlug: string, eventId: string) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/upsell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_slug: productSlug, event_id: eventId }),
  });
  return parse<OrderResponse>(res);
}

export async function fetchOrder(orderId: string) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, { cache: "no-store" });
  return parse<OrderResponse>(res);
}

export async function sendTracking(body: Record<string, unknown>) {
  try {
    await fetch(`${API_URL}/api/tracking/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* client pixels still fire */
  }
}
