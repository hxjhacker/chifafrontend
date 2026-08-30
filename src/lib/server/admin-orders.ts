import type { AdminOrder, AdminStats, AdminStatus } from "@/lib/admin";
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
};

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

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
    where.push(`(full_name ILIKE $${i} OR phone ILIKE $${i} OR phone_national ILIKE $${i})`);
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
  const sql = `SELECT id, full_name, phone, phone_national, city, product_slug, tier_qty,
      cross_sell_slug, upsell_slug, total_cents, currency, status, created_at
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
    };
  } finally {
    client.release();
  }
}

export async function updateAdminOrderStatus(orderId: string, status: AdminStatus): Promise<AdminOrder | null> {
  if (!ALLOWED.includes(status)) throw new Error("invalid_status");
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query<OrderRow>(
      `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1
       RETURNING id, full_name, phone, phone_national, city, product_slug, tier_qty,
         cross_sell_slug, upsell_slug, total_cents, currency, status, created_at`,
      [orderId, status],
    );
    const row = result.rows[0];
    return row ? serialize(row) : null;
  } finally {
    client.release();
  }
}
