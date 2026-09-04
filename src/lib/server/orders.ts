import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { resolveCity } from "@/lib/cities";
import { normalizeMaPhone } from "@/lib/phone";
import type { OrderPayload, OrderResponse } from "@/lib/api";
import { purchaseEventId } from "@/lib/purchase-event";
import { sendPurchaseCapi } from "./capi";
import { ensureSchema, getPool } from "./db";
import { notifyNewOrder } from "./push";

const PRODUCT_SLUGS = new Set(["quran", "kids", "music", "educative"]);
const TIER_CENTS: Record<number, number> = { 1: 19900, 2: 27900, 3: 34900 };
const EDUCATIVE_TIER_CENTS: Record<number, number> = { 1: 14900, 2: 24900, 3: 32900 };
const CROSS_SELL_CENTS = 19900;
const UPSELL_CENTS = 9900;

type OrderRow = {
  id: string;
  status: string;
  full_name: string;
  phone_national: string;
  city: string;
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
  subtotal_cents: number;
  total_cents: number;
  currency: string;
  payment_method: string;
  address: string | null;
  event_id: string;
  landing_url: string | null;
  source: string;
  created_at: Date;
  phone: string;
  tier_price_cents: number;
  cross_sell_price_cents: number;
  upsell_price_cents: number;
  fbp?: string | null;
  fbc?: string | null;
  ttclid?: string | null;
  sccid?: string | null;
  client_ip?: string | null;
  user_agent?: string | null;
};

type ItemRow = {
  product_slug: string;
  role: string;
  quantity: number;
  line_total_cents: number;
};

export class OrderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function centsToMad(cents: number) {
  return Math.round(cents) / 100;
}

function tierTable(slug: string) {
  return slug === "educative" ? EDUCATIVE_TIER_CENTS : TIER_CENTS;
}

function serialize(order: OrderRow, items: ItemRow[]): OrderResponse {
  const bought = new Set([order.product_slug, order.cross_sell_slug].filter(Boolean));
  const candidates = ["quran", "kids", "music"].filter((slug) => !bought.has(slug));
  return {
    order_id: order.id,
    status: order.status,
    full_name: order.full_name,
    phone_national: order.phone_national,
    city: order.city,
    product_slug: order.product_slug,
    tier_qty: order.tier_qty,
    cross_sell_slug: order.cross_sell_slug,
    upsell_slug: order.upsell_slug,
    subtotal: centsToMad(order.subtotal_cents),
    total: centsToMad(order.total_cents),
    currency: order.currency,
    items: items.map((item) => ({
      product_slug: item.product_slug,
      role: item.role,
      quantity: item.quantity,
      line_total: centsToMad(item.line_total_cents),
    })),
    upsell_offer: { price: 99, candidates },
    purchase_event_id: purchaseEventId(order.id),
  };
}

async function loadItems(client: PoolClient, orderId: string) {
  const result = await client.query<ItemRow>(
    `SELECT product_slug, role, quantity, line_total_cents FROM order_items WHERE order_id = $1`,
    [orderId],
  );
  return result.rows;
}

async function loadOrder(client: PoolClient, orderId: string) {
  const result = await client.query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  return result.rows[0] ?? null;
}

function toNational(e164: string) {
  if (e164.startsWith("+212") && e164.length === 13) return `0${e164.slice(4)}`;
  return e164;
}

async function pushSheets(order: OrderRow, items: ItemRow[]) {
  const url = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim();
  if (!url) return;
  const names: Record<string, string> = {
    quran: "USB القرآن الكريم",
    kids: "USB تعليم الأطفال",
    music: "USB الأغاني والموسيقى",
    educative: "الفلاشة التعليمية الذكية للأطفال",
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.id,
        created_at: order.created_at?.toISOString?.() || new Date().toISOString(),
        full_name: order.full_name,
        phone: order.phone,
        city: order.city,
        address: order.address || "",
        product_slug: order.product_slug,
        product_name: names[order.product_slug] || order.product_slug,
        tier_qty: order.tier_qty,
        tier_price: centsToMad(order.tier_price_cents),
        cross_sell_slug: order.cross_sell_slug || "",
        cross_sell_price: order.cross_sell_price_cents ? centsToMad(order.cross_sell_price_cents) : "",
        upsell_slug: order.upsell_slug || "",
        upsell_price: order.upsell_price_cents ? centsToMad(order.upsell_price_cents) : "",
        subtotal: centsToMad(order.subtotal_cents),
        total: centsToMad(order.total_cents),
        currency: order.currency,
        status: order.status,
        payment_method: order.payment_method,
        event_id: order.event_id,
        landing_url: order.landing_url || "",
        source: order.source,
        items_json: JSON.stringify(items),
      }),
    });
  } catch {
    /* sheets is best-effort */
  }
}

export async function createOrder(
  payload: OrderPayload,
  meta: { ip: string; userAgent: string },
): Promise<OrderResponse> {
  await ensureSchema();
  const fullName = (payload.full_name || "").trim();
  if (fullName.length < 3) throw new OrderError(422, "invalid_name");

  const e164 = normalizeMaPhone(payload.phone);
  if (!e164) throw new OrderError(422, "invalid_ma_phone");

  const cityLabel = (payload.city || "").trim();
  if (cityLabel.length < 2) throw new OrderError(422, "invalid_city");
  const city = resolveCity(cityLabel);

  const qty = Number(payload.tier_qty);
  const table = tierTable(payload.product_slug);
  if (!(qty in table)) throw new OrderError(422, "invalid_tier");
  if (!PRODUCT_SLUGS.has(payload.product_slug)) throw new OrderError(422, "invalid_product");

  if (payload.cross_sell_slug) {
    if (payload.cross_sell_slug === payload.product_slug || !PRODUCT_SLUGS.has(payload.cross_sell_slug)) {
      throw new OrderError(422, "invalid_cross_sell");
    }
  }

  const eventId = (payload.event_id || "").trim();
  if (eventId.length < 8) throw new OrderError(422, "invalid_event_id");

  const tierCents = table[qty];
  const crossCents = payload.cross_sell_slug ? CROSS_SELL_CENTS : 0;
  const subtotal = tierCents + crossCents;
  const address = (payload.address || "").trim() || null;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<OrderRow>(`SELECT * FROM orders WHERE event_id = $1`, [eventId]);
    if (existing.rows[0]) {
      const items = await loadItems(client, existing.rows[0].id);
      await client.query("COMMIT");
      return serialize(existing.rows[0], items);
    }

    const orderId = randomUUID();
    const inserted = await client.query<OrderRow>(
      `INSERT INTO orders (
         id, full_name, phone, phone_national, city, address, product_slug, tier_qty, tier_price_cents,
         cross_sell_slug, cross_sell_price_cents, upsell_slug, upsell_price_cents, subtotal_cents, total_cents,
         currency, status, payment_method, event_id, fbp, fbc, ttclid, sccid, client_ip, user_agent,
         landing_url, source, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL,0,$12,$12,'MAD','pending','COD',$13,$14,$15,$16,$17,$18,$19,$20,
         'website', now(), now()
       ) RETURNING *`,
      [
        orderId,
        fullName,
        e164,
        toNational(e164),
        city.ar,
        address,
        payload.product_slug,
        qty,
        tierCents,
        payload.cross_sell_slug || null,
        crossCents,
        subtotal,
        eventId,
        payload.fbp || null,
        payload.fbc || null,
        payload.ttclid || null,
        payload.sccid || null,
        meta.ip || null,
        meta.userAgent || null,
        payload.landing_url || null,
      ],
    );

    await client.query(
      `INSERT INTO order_items (id, order_id, product_slug, role, quantity, unit_price_cents, line_total_cents)
       VALUES ($1,$2,$3,'primary',$4,$5,$6)`,
      [randomUUID(), orderId, payload.product_slug, qty, Math.floor(tierCents / qty), tierCents],
    );
    if (payload.cross_sell_slug) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_slug, role, quantity, unit_price_cents, line_total_cents)
         VALUES ($1,$2,$3,'cross_sell',1,$4,$4)`,
        [randomUUID(), orderId, payload.cross_sell_slug, CROSS_SELL_CENTS],
      );
    }

    await client.query("COMMIT");
    const order = inserted.rows[0];
    const items = await loadItems(client, orderId);
    void pushSheets(order, items);
    if (!payload.defer_purchase) sendPurchaseCapi(order);
    void notifyNewOrder({
      fullName: order.full_name,
      city: order.city,
      productSlug: order.product_slug,
      qty,
      totalMad: Number(order.total_cents) / 100,
    }).catch((err) => console.error("push_notify_failed", err));
    return serialize(order, items);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: string): Promise<OrderResponse> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const order = await loadOrder(client, orderId);
    if (!order) throw new OrderError(404, "order_not_found");
    return serialize(order, await loadItems(client, orderId));
  } finally {
    client.release();
  }
}

export async function finalizeOrderPurchase(orderId: string): Promise<OrderResponse> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const row = await loadOrder(client, orderId);
    if (!row) throw new OrderError(404, "order_not_found");
    sendPurchaseCapi(row);
    return serialize(row, await loadItems(client, orderId));
  } finally {
    client.release();
  }
}

export async function addUpsell(orderId: string, productSlug: string, eventId: string): Promise<OrderResponse> {
  await ensureSchema();
  if (!PRODUCT_SLUGS.has(productSlug)) throw new OrderError(422, "invalid_product");
  if (!eventId || eventId.length < 8) throw new OrderError(422, "invalid_event_id");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const order = await loadOrder(client, orderId);
    if (!order) throw new OrderError(404, "order_not_found");
    if (order.upsell_slug) {
      const items = await loadItems(client, orderId);
      await client.query("COMMIT");
      sendPurchaseCapi(order);
      return serialize(order, items);
    }
    if (productSlug === order.product_slug || productSlug === order.cross_sell_slug) {
      throw new OrderError(422, "upsell_must_be_different");
    }

    await client.query(
      `UPDATE orders
       SET upsell_slug = $2, upsell_price_cents = $3, total_cents = subtotal_cents + $3,
           status = 'upsell_accepted', updated_at = now()
       WHERE id = $1`,
      [orderId, productSlug, UPSELL_CENTS],
    );
    await client.query(
      `INSERT INTO order_items (id, order_id, product_slug, role, quantity, unit_price_cents, line_total_cents)
       VALUES ($1,$2,$3,'upsell',1,$4,$4)`,
      [randomUUID(), orderId, productSlug, UPSELL_CENTS],
    );
    await client.query("COMMIT");
    const updated = await loadOrder(client, orderId);
    if (!updated) throw new OrderError(404, "order_not_found");
    const items = await loadItems(client, orderId);
    void pushSheets(updated, items);
    sendPurchaseCapi(updated);
    return serialize(updated, items);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
