import { randomUUID } from "node:crypto";
import type { AdminOrder, AdminStats, AdminStatus, DeliveryWindow } from "@/lib/admin";
import { displayStatus, packLabel } from "@/lib/admin";
import { ensureSchema, getPool } from "./db";

type OrderRow = {
  id: string;
  full_name: string;
  phone: string;
  phone_national: string;
  city: string;
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
  total_cents: number;
  currency: string;
  status: string;
  created_at: Date;
  address: string | null;
  quartier: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  delivery_window: string | null;
  courier_notes: string | null;
};

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const WINDOWS: DeliveryWindow[] = ["anytime", "morning", "afternoon", "weekend"];
const ORDER_COLS = `id, full_name, phone, phone_national, city, address, quartier, street, building, landmark,
      delivery_window, courier_notes, product_slug, tier_qty, cross_sell_slug, upsell_slug, total_cents, currency, status, created_at`;

function asWindow(value: string | null | undefined): DeliveryWindow | null {
  if (!value) return null;
  return WINDOWS.includes(value as DeliveryWindow) ? (value as DeliveryWindow) : null;
}

function composeAddress(parts: {
  quartier: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  city: string;
}) {
  const bits = [parts.quartier, parts.street, parts.building, parts.landmark, parts.city]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return bits.join("، ") || null;
}

function serialize(row: OrderRow): AdminOrder {
  const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || "");
  return {
    order_id: row.id,
    created_at: created || null,
    full_name: row.full_name,
    city: row.city,
    phone: row.phone,
    phone_national: row.phone_national,
    product_slug: row.product_slug,
    tier_qty: row.tier_qty,
    cross_sell_slug: row.cross_sell_slug,
    upsell_slug: row.upsell_slug,
    pack_label: packLabel(row),
    total: Math.round(row.total_cents) / 100,
    currency: row.currency || "MAD",
    status: displayStatus(row.status),
    raw_status: row.status,
    address: row.address || null,
    quartier: row.quartier || null,
    street: row.street || null,
    building: row.building || null,
    landmark: row.landmark || null,
    delivery_window: asWindow(row.delivery_window),
    courier_notes: row.courier_notes || null,
  };
}

export async function listAdminOrders(filters: { q?: string; city?: string; status?: string; limit?: number }) {
  await ensureSchema();
  const limit = Math.min(Math.max(filters.limit || 400, 1), 2000);
  const params: unknown[] = [];
  const where: string[] = [];

  const q = (filters.q || "").trim();
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(full_name ILIKE $${i} OR phone ILIKE $${i} OR phone_national ILIKE $${i} OR city ILIKE $${i})`);
  }
  const city = (filters.city || "").trim();
  if (city) {
    params.push(city);
    where.push(`city = $${params.length}`);
  }
  const status = (filters.status || "").trim();
  if (status) {
    if (!ALLOWED.includes(status as AdminStatus)) throw new Error("invalid_status");
    if (status === "new") {
      where.push(`status IN ('pending','upsell_accepted','new')`);
    } else {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
  }

  params.push(limit);
  const sql = `SELECT ${ORDER_COLS}
    FROM orders
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC
    LIMIT $${params.length}`;

  const client = await getPool().connect();
  try {
    const orders = await client.query<OrderRow>(sql, params);
    const cities = await client.query<{ city: string }>(
      `SELECT DISTINCT city FROM orders WHERE city IS NOT NULL AND city <> '' ORDER BY city`,
    );
    return {
      orders: orders.rows.map(serialize),
      cities: cities.rows.map((r) => r.city),
    };
  } finally {
    client.release();
  }
}

export async function adminStats(): Promise<AdminStats> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ status: string; total_cents: number }>(
      `SELECT status, total_cents FROM orders`,
    );
    let newOrders = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;
    let revenueCents = 0;
    for (const row of result.rows) {
      const status = displayStatus(row.status || "pending");
      if (status === "new") newOrders += 1;
      else if (status === "confirmed") confirmed += 1;
      else if (status === "shipped") shipped += 1;
      else if (status === "delivered") delivered += 1;
      else if (status === "cancelled") cancelled += 1;
      if (status !== "cancelled") revenueCents += Number(row.total_cents || 0);
    }
    const cities = await client.query<{ city: string; count: string }>(
      `SELECT city, COUNT(*)::text AS count FROM orders
       WHERE city IS NOT NULL AND city <> ''
       GROUP BY city ORDER BY COUNT(*) DESC, city ASC`,
    );
    const won = confirmed + shipped + delivered;
    const processed = won + cancelled;
    return {
      revenue: Math.round(revenueCents) / 100,
      currency: "MAD",
      new_orders: newOrders,
      confirmed_orders: confirmed,
      shipped_orders: shipped,
      delivered_orders: delivered,
      cancelled_orders: cancelled,
      confirmation_rate: processed ? Math.round((won / processed) * 1000) / 10 : 0,
      total_orders: result.rows.length,
      city_breakdown: cities.rows.map((r) => ({ city: r.city, count: Number(r.count) })),
    };
  } finally {
    client.release();
  }
}

export async function updateAdminOrderStatus(orderId: string, status: AdminStatus): Promise<AdminOrder | null> {
  return updateAdminOrder(orderId, { status });
}

export async function updateAdminOrder(
  orderId: string,
  patch: {
    status?: AdminStatus;
    full_name?: string;
    phone?: string;
    city?: string;
    product_slug?: string;
    tier_qty?: number;
    total_mad?: number;
    quartier?: string;
    street?: string;
    building?: string;
    landmark?: string;
    delivery_window?: DeliveryWindow | string;
    courier_notes?: string;
  },
): Promise<AdminOrder | null> {
  const fields = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (fields.length === 1 && patch.status !== undefined) {
    if (!ALLOWED.includes(patch.status)) throw new Error("invalid_status");
    await ensureSchema();
    const client = await getPool().connect();
    try {
      const result = await client.query<OrderRow>(
        `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1
         RETURNING ${ORDER_COLS}`,
        [orderId, patch.status],
      );
      const row = result.rows[0];
      return row ? serialize(row) : null;
    } finally {
      client.release();
    }
  }

  await ensureSchema();
  const client = await getPool().connect();
  try {
    const current = await client.query<OrderRow>(
      `SELECT ${ORDER_COLS} FROM orders WHERE id = $1`,
      [orderId],
    );
    const row = current.rows[0];
    if (!row) return null;

    let fullName = row.full_name;
    let phone = row.phone;
    let phoneNational = row.phone_national;
    let cityAr = row.city;
    let slug = row.product_slug;
    let qty = row.tier_qty;
    let cents = Number(row.total_cents);
    let status = displayStatus(row.status);
    let quartier = row.quartier;
    let street = row.street;
    let building = row.building;
    let landmark = row.landmark;
    let deliveryWindow = row.delivery_window;
    let courierNotes = row.courier_notes;

    if (patch.full_name !== undefined) {
      fullName = patch.full_name.trim();
      if (fullName.length < 3) throw new Error("invalid_name");
    }
    if (patch.phone !== undefined) {
      const { normalizeMaPhone } = await import("@/lib/phone");
      const e164 = normalizeMaPhone(patch.phone);
      if (!e164) throw new Error("invalid_ma_phone");
      phone = e164;
      phoneNational = e164.startsWith("+212") && e164.length === 13 ? `0${e164.slice(4)}` : e164;
    }
    if (patch.city !== undefined) {
      const { resolveCity } = await import("@/lib/cities");
      cityAr = resolveCity(patch.city).ar;
    }
    if (patch.product_slug !== undefined) {
      slug = ["quran", "kids", "music", "educative"].includes(patch.product_slug) ? patch.product_slug : slug;
    }
    if (patch.tier_qty !== undefined) qty = patch.tier_qty >= 2 ? 2 : 1;
    if (patch.total_mad !== undefined) {
      cents = Math.round(Number(patch.total_mad) * 100);
      if (!Number.isFinite(cents) || cents < 100) throw new Error("invalid_price");
    }
    if (patch.status !== undefined) {
      if (!ALLOWED.includes(patch.status)) throw new Error("invalid_status");
      status = patch.status;
    }
    if (patch.quartier !== undefined) quartier = patch.quartier.trim() || null;
    if (patch.street !== undefined) street = patch.street.trim() || null;
    if (patch.building !== undefined) building = patch.building.trim() || null;
    if (patch.landmark !== undefined) landmark = patch.landmark.trim() || null;
    if (patch.delivery_window !== undefined) {
      const next = String(patch.delivery_window || "").trim();
      if (next && !WINDOWS.includes(next as DeliveryWindow)) throw new Error("invalid_delivery_window");
      deliveryWindow = next || null;
    }
    if (patch.courier_notes !== undefined) courierNotes = patch.courier_notes.trim() || null;

    const address = composeAddress({ quartier, street, building, landmark, city: cityAr });

    await client.query("BEGIN");
    const updated = await client.query<OrderRow>(
      `UPDATE orders SET
         full_name = $2, phone = $3, phone_national = $4, city = $5,
         product_slug = $6, tier_qty = $7, tier_price_cents = $8, subtotal_cents = $8, total_cents = $8,
         status = $9, address = $10, quartier = $11, street = $12, building = $13, landmark = $14,
         delivery_window = $15, courier_notes = $16, updated_at = now()
       WHERE id = $1
       RETURNING ${ORDER_COLS}`,
      [
        orderId,
        fullName,
        phone,
        phoneNational,
        cityAr,
        slug,
        qty,
        cents,
        status,
        address,
        quartier,
        street,
        building,
        landmark,
        deliveryWindow,
        courierNotes,
      ],
    );
    await client.query(
      `UPDATE order_items SET product_slug = $2, quantity = $3, unit_price_cents = $4, line_total_cents = $5
       WHERE order_id = $1 AND role = 'primary'`,
      [orderId, slug, qty, Math.floor(cents / Math.max(qty, 1)), cents],
    );
    await client.query("COMMIT");
    return serialize(updated.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteAdminOrder(orderId: string): Promise<boolean> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
    const result = await client.query(`DELETE FROM orders WHERE id = $1`, [orderId]);
    await client.query("COMMIT");
    return (result.rowCount || 0) > 0;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function createAdminOrder(input: {
  full_name: string;
  phone: string;
  city: string;
  product_slug: string;
  tier_qty: number;
  total_mad: number;
  status: AdminStatus;
}): Promise<AdminOrder> {
  if (!ALLOWED.includes(input.status)) throw new Error("invalid_status");
  const fullName = input.full_name.trim();
  if (fullName.length < 3) throw new Error("invalid_name");
  const { normalizeMaPhone } = await import("@/lib/phone");
  const { resolveCity } = await import("@/lib/cities");
  const e164 = normalizeMaPhone(input.phone);
  if (!e164) throw new Error("invalid_ma_phone");
  const city = resolveCity(input.city);
  const qty = input.tier_qty >= 2 ? 2 : 1;
  const cents = Math.round(Number(input.total_mad) * 100);
  if (!Number.isFinite(cents) || cents < 100) throw new Error("invalid_price");
  const slug = ["quran", "kids", "music", "educative"].includes(input.product_slug) ? input.product_slug : "quran";
  const national = e164.startsWith("+212") && e164.length === 13 ? `0${e164.slice(4)}` : e164;
  const orderId = randomUUID();
  const eventId = `admin-${orderId}`;

  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<OrderRow>(
      `INSERT INTO orders (
         id, full_name, phone, phone_national, city, address, product_slug, tier_qty, tier_price_cents,
         cross_sell_slug, cross_sell_price_cents, upsell_slug, upsell_price_cents, subtotal_cents, total_cents,
         currency, status, payment_method, event_id, source, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,NULL,$6,$7,$8,NULL,0,NULL,0,$8,$8,'MAD',$9,'COD',$10,'admin', now(), now()
       ) RETURNING ${ORDER_COLS}`,
      [orderId, fullName, e164, national, city.ar, slug, qty, cents, input.status, eventId],
    );
    await client.query(
      `INSERT INTO order_items (id, order_id, product_slug, role, quantity, unit_price_cents, line_total_cents)
       VALUES ($1,$2,$3,'primary',$4,$5,$6)`,
      [randomUUID(), orderId, slug, qty, Math.floor(cents / qty), cents],
    );
    await client.query("COMMIT");
    return serialize(inserted.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
