import { randomUUID } from "node:crypto";
import type { AdminOrder, AdminStats, AdminStatus, DeliveryWindow } from "@/lib/admin";
import { assertStatusTransition, displayStatus, hasCompleteConfirmDetails, packLabel } from "@/lib/admin";
import { resolveProductSlug } from "@/lib/server/admin-products";
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
  updated_at: Date | null;
  source: string | null;
  confirmed_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  address: string | null;
  quartier: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  delivery_window: string | null;
  courier_notes: string | null;
  region_id: string | null;
  bundle_enabled: boolean;
  secondary_qty: number;
  meta_livraison_code?: string | null;
  meta_livraison_sent_at?: Date | string | null;
  meta_livraison_ticket_url?: string | null;
  shipping_city?: string | null;
  carrier?: string | null;
};

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "returned", "cancelled"];
const WINDOWS: DeliveryWindow[] = ["anytime", "morning", "afternoon", "weekend"];
const ORDER_COLS = `id, full_name, phone, phone_national, city, address, quartier, street, building, landmark,
      delivery_window, courier_notes, region_id, bundle_enabled, secondary_qty,
      product_slug, tier_qty, cross_sell_slug, upsell_slug, total_cents, currency, status, source,
      created_at, updated_at, confirmed_at, shipped_at, delivered_at, cancelled_at`;

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function stampReached(explicit: Date | string | null | undefined, fallback: Date | string | null | undefined, reached: boolean) {
  const stamped = iso(explicit);
  if (stamped) return stamped;
  if (!reached) return null;
  return iso(fallback);
}

function columnsOf(result: { fields?: Array<{ name: string }> }) {
  return new Set((result.fields || []).map((field) => String(field.name).toLowerCase()));
}

function pgCode(err: unknown) {
  if (err && typeof err === "object" && "code" in err) return String((err as { code: unknown }).code);
  return "";
}

function missingColumnName(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const hit = message.match(/column "([^"]+)"/i);
  return hit?.[1]?.toLowerCase() || "";
}

const CORE_UPDATE_COLS = new Set([
  "full_name",
  "phone",
  "phone_national",
  "city",
  "product_slug",
  "tier_qty",
  "total_cents",
  "status",
  "updated_at",
]);

function stampFragment(cols: Set<string>, param: string) {
  const status = `${param}::varchar`;
  const parts: string[] = [];
  if (cols.has("confirmed_at")) {
    parts.push(
      `confirmed_at = CASE WHEN ${status} = 'new' THEN NULL WHEN ${status} IN ('confirmed','shipped','delivered','returned') THEN COALESCE(confirmed_at, now()) ELSE confirmed_at END`,
    );
  }
  if (cols.has("shipped_at")) {
    parts.push(
      `shipped_at = CASE WHEN ${status} IN ('new','confirmed') THEN NULL WHEN ${status} IN ('shipped','delivered','returned') THEN COALESCE(shipped_at, now()) ELSE shipped_at END`,
    );
  }
  if (cols.has("delivered_at")) {
    parts.push(
      `delivered_at = CASE WHEN ${status} IN ('new','confirmed','shipped','returned') THEN NULL WHEN ${status} = 'delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END`,
    );
  }
  if (cols.has("cancelled_at")) {
    parts.push(`cancelled_at = CASE WHEN ${status} = 'cancelled' THEN COALESCE(cancelled_at, now()) ELSE NULL END`);
  }
  return parts.length ? `, ${parts.join(", ")}` : "";
}

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
  const status = displayStatus(row.status);
  const created = iso(row.created_at);
  const updated = iso(row.updated_at) || created;
  const pastConfirmed = status === "confirmed" || status === "shipped" || status === "delivered" || status === "returned";
  const pastShipped = status === "shipped" || status === "delivered" || status === "returned";
  return {
    order_id: String(row.id),
    created_at: created,
    full_name: row.full_name || "",
    city: row.city || "",
    shipping_city: row.shipping_city || null,
    phone: row.phone || "",
    phone_national: row.phone_national || "",
    product_slug: row.product_slug || "quran",
    tier_qty: Number(row.tier_qty) || 1,
    cross_sell_slug: row.cross_sell_slug,
    upsell_slug: row.upsell_slug,
    pack_label: packLabel({
      product_slug: row.product_slug || "quran",
      tier_qty: Number(row.tier_qty) || 1,
      cross_sell_slug: row.cross_sell_slug || null,
      upsell_slug: row.upsell_slug || null,
    }),
    total: Math.round(Number(row.total_cents) || 0) / 100,
    currency: row.currency || "MAD",
    status,
    raw_status: row.status,
    address: row.address || null,
    quartier: row.quartier || null,
    street: row.street || null,
    building: row.building || null,
    landmark: row.landmark || null,
    delivery_window: asWindow(row.delivery_window),
    courier_notes: row.courier_notes || null,
    region_id: row.region_id || null,
    bundle_enabled: Boolean(row.bundle_enabled || row.cross_sell_slug),
    secondary_qty: Math.max(1, Number(row.secondary_qty) || 1),
    full_address: row.address || null,
    region: row.region_id || null,
    primary_product: row.product_slug,
    primary_qty: row.tier_qty,
    secondary_product: row.cross_sell_slug,
    driver_comment: row.courier_notes || null,
    total_price: Math.round(Number(row.total_cents) || 0) / 100,
    source: row.source || "website",
    updated_at: updated,
    confirmed_at: stampReached(row.confirmed_at, updated, pastConfirmed),
    shipped_at: stampReached(row.shipped_at, updated, pastShipped),
    delivered_at: stampReached(row.delivered_at, updated, status === "delivered"),
    cancelled_at: stampReached(row.cancelled_at, updated, status === "cancelled"),
    meta_livraison_code: row.meta_livraison_code || null,
    meta_livraison_sent_at: iso(row.meta_livraison_sent_at || null),
    meta_livraison_ticket_url: row.meta_livraison_ticket_url || null,
    carrier: (row.carrier === "quick_livraison" || row.carrier === "force_log" ? row.carrier : "meta_livraison"),
    tracking_number: row.meta_livraison_code || null,
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query<OrderRow>(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [orderId]);
    return result.rows[0] ? serialize(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function markMetaLivraisonSent(orderId: string, code: string, ticketUrl = ""): Promise<AdminOrder | null> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const probe = await client.query(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [orderId]);
    const current = probe.rows[0] as OrderRow | undefined;
    if (!current) return null;
    const cols = columnsOf(probe);
    const values: unknown[] = [orderId];
    const assignments = ["status = 'shipped'"];
    if (cols.has("updated_at")) assignments.push("updated_at = now()");
    if (cols.has("shipped_at")) assignments.push("shipped_at = COALESCE(shipped_at, now())");
    if (cols.has("confirmed_at")) assignments.push("confirmed_at = COALESCE(confirmed_at, now())");
    if (cols.has("cancelled_at")) assignments.push("cancelled_at = NULL");
    if (cols.has("meta_livraison_code")) {
      values.push(code);
      assignments.push(`meta_livraison_code = $${values.length}`);
    }
    if (cols.has("meta_livraison_sent_at")) {
      assignments.push("meta_livraison_sent_at = COALESCE(meta_livraison_sent_at, now())");
    }
    if (cols.has("meta_livraison_ticket_url") && ticketUrl) {
      values.push(ticketUrl);
      assignments.push(`meta_livraison_ticket_url = $${values.length}`);
    }
    const result = await client.query<OrderRow>(
      `UPDATE orders SET ${assignments.join(", ")} WHERE id = $1 RETURNING *`,
      values,
    );
    return result.rows[0] ? serialize(result.rows[0]) : serialize(current);
  } finally {
    client.release();
  }
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
    } else if (status === "shipped") {
      where.push(`status IN ('shipped','in_shipping')`);
    } else {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
  }

  params.push(limit);
  const sql = `SELECT *
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
      if (status !== "cancelled" && status !== "returned") revenueCents += Number(row.total_cents || 0);
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

type OrderPatch = {
  status?: AdminStatus;
  full_name?: string;
  phone?: string;
  city?: string;
  shipping_city?: string | null;
  product_slug?: string;
  tier_qty?: number;
  total_mad?: number;
  quartier?: string;
  street?: string;
  building?: string;
  landmark?: string;
  delivery_window?: DeliveryWindow | string;
  courier_notes?: string;
  address?: string;
  region_id?: string;
  cross_sell_slug?: string | null;
  cross_sell_price_mad?: number;
  bundle_enabled?: boolean;
  secondary_qty?: number;
  full_address?: string;
  region?: string;
  primary_product?: string;
  primary_qty?: number;
  secondary_product?: string | null;
  driver_comment?: string;
  total_price?: number;
  customer_name?: string;
};

type SetItem = { column: string; value?: unknown; expr?: "now" | "coalesce" };

function buildUpdate(orderId: string, sets: SetItem[], cols: Set<string>) {
  const values: unknown[] = [orderId];
  const assignments: string[] = [];
  for (const item of sets) {
    if (item.expr === "now") {
      assignments.push(`${item.column} = now()`);
      continue;
    }
    values.push(item.value);
    const placeholder = item.column === "status" ? `$${values.length}::varchar` : `$${values.length}`;
    if (item.expr === "coalesce") {
      assignments.push(`${item.column} = COALESCE(${placeholder}, ${item.column})`);
    } else {
      assignments.push(`${item.column} = ${placeholder}`);
    }
  }
  const statusAssign = assignments.find((part) => part.startsWith("status = "));
  const statusMatch = statusAssign ? statusAssign.match(/\$(\d+)/) : null;
  const statusParam = statusMatch ? `$${statusMatch[1]}` : "";
  const stamp = statusParam ? stampFragment(cols, statusParam) : "";
  return {
    values,
    sql: `UPDATE orders SET ${assignments.join(", ")}${stamp} WHERE id = $1 RETURNING *`,
  };
}

function isStatusOnlyPatch(patch: OrderPatch) {
  const defined = Object.entries(patch).filter(([, value]) => value !== undefined);
  return defined.length === 1 && defined[0][0] === "status" && patch.status !== undefined;
}

async function stampStatusColumns(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: OrderRow[] }> },
  orderId: string,
  status: AdminStatus,
  cols: Set<string>,
  saved: OrderRow,
) {
  const assignments: string[] = [];
  if (cols.size === 0 || cols.has("confirmed_at")) {
    assignments.push(
      status === "new"
        ? "confirmed_at = NULL"
        : status === "confirmed" || status === "shipped" || status === "delivered" || status === "returned"
          ? "confirmed_at = COALESCE(confirmed_at, now())"
          : "confirmed_at = confirmed_at",
    );
  }
  if (cols.size === 0 || cols.has("shipped_at")) {
    assignments.push(
      status === "new" || status === "confirmed"
        ? "shipped_at = NULL"
        : status === "shipped" || status === "delivered" || status === "returned"
          ? "shipped_at = COALESCE(shipped_at, now())"
          : "shipped_at = shipped_at",
    );
  }
  if (cols.size === 0 || cols.has("delivered_at")) {
    assignments.push(
      status === "delivered"
        ? "delivered_at = COALESCE(delivered_at, now())"
        : status === "cancelled"
          ? "delivered_at = delivered_at"
          : "delivered_at = NULL",
    );
  }
  if (cols.size === 0 || cols.has("cancelled_at")) {
    assignments.push(status === "cancelled" ? "cancelled_at = COALESCE(cancelled_at, now())" : "cancelled_at = NULL");
  }
  if (!assignments.length) return saved;
  try {
    const result = await client.query(`UPDATE orders SET ${assignments.join(", ")} WHERE id = $1 RETURNING *`, [orderId]);
    return result.rows[0] || saved;
  } catch (err) {
    console.error("admin_order_stamp_skipped", status, err);
    return saved;
  }
}

async function applyStatusOnly(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: OrderRow[] }> },
  orderId: string,
  status: AdminStatus,
  cols: Set<string>,
) {
  if (!ALLOWED.includes(status)) throw new Error("invalid_status");
  const boundStatus = String(status);
  let saved: OrderRow | undefined;
  try {
    const stamp = stampFragment(cols, "$2");
    const withStamp =
      cols.size === 0 || cols.has("updated_at")
        ? `UPDATE orders SET status = $2::varchar, updated_at = now()${stamp} WHERE id = $1 RETURNING *`
        : `UPDATE orders SET status = $2::varchar${stamp} WHERE id = $1 RETURNING *`;
    const result = await client.query(withStamp, [orderId, boundStatus]);
    saved = result.rows[0];
  } catch (err) {
    console.error("admin_status_update_retry", err);
    const result = await client.query(`UPDATE orders SET status = $2::varchar WHERE id = $1 RETURNING *`, [orderId, boundStatus]);
    saved = result.rows[0];
  }
  if (!saved) return null;
  saved = await stampStatusColumns(client, orderId, status, cols, saved);
  try {
    return serialize(saved);
  } catch (err) {
    console.error("admin_status_serialize_failed", err);
    return serialize({ ...saved, status } as OrderRow);
  }
}

export async function updateAdminOrder(orderId: string, patch: OrderPatch): Promise<AdminOrder | null> {
  patch = {
    ...patch,
    full_name: patch.full_name ?? patch.customer_name,
    address: patch.address ?? patch.full_address,
    region_id: patch.region_id ?? patch.region,
    product_slug: patch.product_slug ?? patch.primary_product,
    tier_qty: patch.tier_qty ?? patch.primary_qty,
    cross_sell_slug: patch.cross_sell_slug !== undefined ? patch.cross_sell_slug : patch.secondary_product,
    courier_notes: patch.courier_notes ?? patch.driver_comment,
    total_mad: patch.total_mad ?? patch.total_price,
  };
  if (patch.bundle_enabled === false) patch.cross_sell_slug = null;

  await ensureSchema();
  const client = await getPool().connect();
  try {
    const current = await client.query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    const row = current.rows[0];
    if (!row) return null;
    const cols = columnsOf(current);

    if (isStatusOnlyPatch(patch) && patch.status) {
      assertStatusTransition(row.status, patch.status);
      if (displayStatus(patch.status) === "confirmed" && displayStatus(row.status) !== "confirmed" && !hasCompleteConfirmDetails(row)) {
        throw new Error("confirmation_details_required");
      }
      return applyStatusOnly(client, orderId, patch.status, cols);
    }

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
    let address = row.address;
    let regionId = row.region_id;
    let crossSlug = row.cross_sell_slug;
    let crossCents: number | null = null;
    let bundleEnabled = Boolean(row.bundle_enabled || row.cross_sell_slug);
    let secondaryQty = Math.max(1, Number(row.secondary_qty) || 1);

    if (patch.full_name != null) {
      fullName = String(patch.full_name).trim().slice(0, 120);
      if (fullName.length < 3) throw new Error("invalid_name");
    }
    if (patch.phone != null && String(patch.phone).trim()) {
      const { digitsOnly, isTenDigitMaPhone, normalizeMaPhone } = await import("@/lib/phone");
      const rawPhone = String(patch.phone);
      if (digitsOnly(rawPhone).length !== 10 || !isTenDigitMaPhone(rawPhone)) {
        throw new Error("invalid_ma_phone");
      }
      const e164 = normalizeMaPhone(rawPhone);
      if (!e164) throw new Error("invalid_ma_phone");
      phone = e164;
      phoneNational = e164.startsWith("+212") && e164.length === 13 ? `0${e164.slice(4)}` : e164;
    }
    if (patch.city != null && String(patch.city).trim()) {
      cityAr = String(patch.city).trim().slice(0, 120);
    }
    let shippingCity = row.shipping_city || null;
    if (patch.shipping_city !== undefined) {
      const { isOfficialMetaCity } = await import("@/lib/meta-livraison-cities");
      const next = String(patch.shipping_city || "").trim().slice(0, 160);
      shippingCity = next && isOfficialMetaCity(next) ? next : next || null;
    }
    if (patch.product_slug !== undefined) {
      slug = await resolveProductSlug(patch.product_slug);
    }
    if (patch.tier_qty !== undefined) {
      const nextQty = Math.round(Number(patch.tier_qty));
      if (!Number.isFinite(nextQty) || nextQty < 1 || nextQty > 20) throw new Error("invalid_qty");
      qty = nextQty;
    }
    if (patch.total_mad !== undefined) {
      cents = Math.round(Number(patch.total_mad) * 100);
      if (!Number.isFinite(cents) || cents < 100) throw new Error("invalid_price");
    }
    if (patch.status !== undefined) {
      if (!ALLOWED.includes(patch.status)) throw new Error("invalid_status");
      assertStatusTransition(row.status, patch.status);
      status = patch.status;
    }
    if (patch.quartier != null) quartier = String(patch.quartier).trim() || null;
    if (patch.street != null) street = String(patch.street).trim() || null;
    if (patch.building != null) building = String(patch.building).trim() || null;
    if (patch.landmark != null) landmark = String(patch.landmark).trim() || null;
    if (patch.delivery_window !== undefined) {
      const next = String(patch.delivery_window || "").trim();
      if (next && !WINDOWS.includes(next as DeliveryWindow)) throw new Error("invalid_delivery_window");
      deliveryWindow = next || null;
    }
    if (patch.courier_notes !== undefined) courierNotes = String(patch.courier_notes ?? "").trim() || null;
    if (patch.address !== undefined) address = String(patch.address ?? "").trim() || null;
    else if (patch.quartier !== undefined || patch.street !== undefined || patch.building !== undefined || patch.landmark !== undefined) {
      address = composeAddress({ quartier, street, building, landmark, city: cityAr });
    }
    if (shippingCity) {
      const { regionIdForCity } = await import("@/lib/admin-geo");
      regionId = regionIdForCity(shippingCity);
    } else if (patch.region_id !== undefined) {
      const raw = String(patch.region_id ?? "").trim();
      const byId = raw.toUpperCase();
      if (/^MA(0[1-9]|1[0-2])$/.test(byId)) {
        regionId = byId;
      } else {
        const { MOROCCO_REGIONS } = await import("@/lib/admin-geo");
        const hit = MOROCCO_REGIONS.find((r) => r.id === byId || r.name === raw);
        if (hit) regionId = hit.id;
      }
    }
    if (patch.cross_sell_slug !== undefined) {
      const allowedCross = ["quran", "kids", "music", "educative", "taalim", "extra"];
      if (!patch.cross_sell_slug) {
        crossSlug = null;
        crossCents = 0;
        bundleEnabled = false;
      } else if (allowedCross.includes(patch.cross_sell_slug)) {
        crossSlug = patch.cross_sell_slug;
        bundleEnabled = true;
        if (patch.cross_sell_price_mad !== undefined) {
          crossCents = Math.round(Number(patch.cross_sell_price_mad) * 100);
          if (!Number.isFinite(crossCents) || crossCents < 0) throw new Error("invalid_price");
        }
      }
    }
    if (patch.bundle_enabled !== undefined) bundleEnabled = Boolean(patch.bundle_enabled);
    if (patch.secondary_qty !== undefined) {
      const next = Math.round(Number(patch.secondary_qty));
      if (!Number.isFinite(next) || next < 1 || next > 20) throw new Error("invalid_qty");
      secondaryQty = next;
    }
    if (!bundleEnabled) {
      crossSlug = null;
      crossCents = 0;
    }

    if (displayStatus(status) === "confirmed" && displayStatus(row.status) !== "confirmed") {
      if (
        !hasCompleteConfirmDetails({
          full_name: fullName,
          city: cityAr,
          phone,
          phone_national: phoneNational,
          address,
          quartier,
          street,
          building,
          landmark,
        })
      ) {
        throw new Error("confirmation_details_required");
      }
    }

    const extras: Array<[string, unknown]> = [
      ["address", address],
      ["courier_notes", courierNotes],
      ["region_id", regionId],
      ["quartier", quartier],
      ["street", street],
      ["building", building],
      ["landmark", landmark],
      ["delivery_window", deliveryWindow],
      ["cross_sell_slug", crossSlug],
      ["cross_sell_price_cents", crossCents ?? 0],
      ["bundle_enabled", bundleEnabled],
      ["secondary_qty", secondaryQty],
      ["shipping_city", shippingCity],
      ["tier_price_cents", cents],
      ["subtotal_cents", cents],
    ];

    const run = async (sql: string, values: unknown[]) => client.query<OrderRow>(sql, values);

    let saved: OrderRow | undefined;
    try {
      const core = await run(
        `UPDATE orders SET
           full_name = $2,
           phone = $3,
           city = $4,
           product_slug = $5,
           tier_qty = $6,
           total_cents = $7,
           status = $8::varchar,
           updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [orderId, fullName, phone, cityAr, slug, qty, cents, String(status)],
      );
      saved = core.rows[0];
    } catch (err) {
      console.error("admin_order_core_update_retry", err);
      const fallback = await run(
        `UPDATE orders SET status = $2::varchar, updated_at = now() WHERE id = $1 RETURNING *`,
        [orderId, String(status)],
      );
      saved = fallback.rows[0];
      if (!saved) throw err;
      for (const [column, value] of [
        ["full_name", fullName],
        ["phone", phone],
        ["city", cityAr],
        ["product_slug", slug],
        ["tier_qty", qty],
        ["total_cents", cents],
      ] as Array<[string, unknown]>) {
        try {
          const again = await run(`UPDATE orders SET ${column} = $2 WHERE id = $1 RETURNING *`, [orderId, value]);
          if (again.rows[0]) saved = again.rows[0];
        } catch (extraErr) {
          console.error("admin_order_core_field_skipped", column, extraErr);
        }
      }
    }

    for (const [column, value] of extras) {
      if (cols.size > 0 && !cols.has(column)) continue;
      try {
        const again = await run(`UPDATE orders SET ${column} = $2 WHERE id = $1 RETURNING *`, [
          orderId,
          typeof value === "string" ? value.slice(0, 2000) : value,
        ]);
        if (again.rows[0]) saved = again.rows[0];
      } catch (err) {
        console.error("admin_order_extra_skipped", column, err);
      }
    }

    if ((status === "confirmed" || status === "shipped" || status === "delivered" || status === "returned" || status === "cancelled") && saved) {
      saved = await stampStatusColumns(client, orderId, status, cols, saved);
    }

    if (!saved) return null;
    try {
      await client.query(
        `UPDATE order_items SET product_slug = $2, quantity = $3, unit_price_cents = $4, line_total_cents = $5
         WHERE order_id = $1 AND role = 'primary'`,
        [orderId, slug, qty, Math.floor(cents / Math.max(qty, 1)), cents],
      );
    } catch (err) {
      console.error("admin_order_items_update_skipped", err);
    }
    try {
      return serialize(saved);
    } catch (err) {
      console.error("admin_order_serialize_failed", err);
      return serialize({ ...row, ...(saved || {}), id: saved?.id || row.id } as OrderRow);
    }
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
  shipping_city?: string | null;
  product_slug: string;
  tier_qty: number;
  total_mad: number;
  status: AdminStatus;
  address?: string | null;
  region_id?: string | null;
  quartier?: string | null;
  street?: string | null;
  building?: string | null;
  landmark?: string | null;
  courier_notes?: string | null;
  cross_sell_slug?: string | null;
  bundle_enabled?: boolean;
  secondary_qty?: number;
}): Promise<AdminOrder> {
  if (!ALLOWED.includes(input.status)) throw new Error("invalid_status");
  const fullName = input.full_name.trim().slice(0, 120);
  if (fullName.length < 3) throw new Error("invalid_name");
  const { digitsOnly, isTenDigitMaPhone, normalizeMaPhone } = await import("@/lib/phone");
  if (digitsOnly(input.phone).length !== 10 || !isTenDigitMaPhone(input.phone)) {
    throw new Error("invalid_ma_phone");
  }
  let e164 = "";
  try {
    e164 = normalizeMaPhone(input.phone) || "";
  } catch (err) {
    console.error("admin_create_phone_parse_failed", err);
  }
  if (!e164) throw new Error("invalid_ma_phone");
  let cityAr = String(input.city || "").trim().slice(0, 120);
  if (cityAr.length < 2) throw new Error("invalid_city");
  const { isOfficialMetaCity } = await import("@/lib/meta-livraison-cities");
  const shippingCity = String(input.shipping_city || "").trim().slice(0, 160);
  const officialShipping = isOfficialMetaCity(shippingCity) ? shippingCity : null;
  const qty = Math.min(20, Math.max(1, Math.round(Number(input.tier_qty) || 1)));
  const cents = Math.round(Number(input.total_mad) * 100);
  if (!Number.isFinite(cents) || cents < 100) throw new Error("invalid_price");
  const slug = await resolveProductSlug(input.product_slug);
  const national = e164.startsWith("+212") && e164.length === 13 ? `0${e164.slice(4)}` : e164;
  const orderId = randomUUID();
  const eventId = `admin-${orderId}`;
  const address = String(input.address || "").trim() || null;
  const courierNotes = String(input.courier_notes || "").trim() || null;
  const allowedCross = ["quran", "kids", "music", "educative", "taalim", "extra"];
  const crossSlug = input.cross_sell_slug && allowedCross.includes(input.cross_sell_slug) ? input.cross_sell_slug : null;
  const bundleEnabled = Boolean(input.bundle_enabled && crossSlug);
  const secondaryQty = Math.min(20, Math.max(1, Math.round(Number(input.secondary_qty) || 1)));
  let regionId: string | null = null;
  if (officialShipping) {
    const { regionIdForCity } = await import("@/lib/admin-geo");
    regionId = regionIdForCity(officialShipping);
  } else if (input.region_id) {
    const raw = String(input.region_id).trim();
    const byId = raw.toUpperCase();
    if (/^MA(0[1-9]|1[0-2])$/.test(byId)) regionId = byId;
  }

  await ensureSchema();
  const client = await getPool().connect();
  try {
    const probe = await client.query(`SELECT * FROM orders LIMIT 0`);
    const cols = columnsOf(probe);
    const record: Record<string, unknown> = {
      id: orderId,
      full_name: fullName,
      phone: e164,
      phone_national: national,
      city: cityAr,
      shipping_city: officialShipping,
      product_slug: slug,
      tier_qty: qty,
      tier_price_cents: cents,
      cross_sell_slug: bundleEnabled ? crossSlug : null,
      cross_sell_price_cents: 0,
      upsell_slug: null,
      upsell_price_cents: 0,
      subtotal_cents: cents,
      total_cents: cents,
      currency: "MAD",
      status: input.status,
      payment_method: "COD",
      event_id: eventId,
      source: "admin",
      address,
      quartier: String(input.quartier || "").trim() || null,
      street: String(input.street || "").trim() || null,
      building: String(input.building || "").trim() || null,
      landmark: String(input.landmark || "").trim() || null,
      courier_notes: courierNotes,
      region_id: regionId,
      bundle_enabled: bundleEnabled,
      secondary_qty: bundleEnabled ? secondaryQty : 1,
    };
    const insertCols = Object.keys(record).filter((column) => cols.size === 0 || cols.has(column));
    const insertVals = insertCols.map((column) => record[column]);
    const placeholders = insertCols.map((_, index) => `$${index + 1}`);
    let inserted: { rows: OrderRow[] };
    try {
      inserted = await client.query<OrderRow>(
        `INSERT INTO orders (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
        insertVals,
      );
    } catch (err) {
      console.error("admin_create_insert_retry", err);
      inserted = await client.query<OrderRow>(
        `INSERT INTO orders (id, full_name, phone, phone_national, city, product_slug, tier_qty, tier_price_cents, subtotal_cents, total_cents, status, event_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$8,$9,$10) RETURNING *`,
        [orderId, fullName, e164, national, cityAr, slug, qty, cents, input.status, eventId],
      );
    }
    const saved = inserted.rows[0];
    if (!saved) throw new Error("create_failed");
    const stamped = await stampStatusColumns(client, orderId, input.status, cols.size ? cols : columnsOf(inserted), saved);
    try {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_slug, role, quantity, unit_price_cents, line_total_cents)
         VALUES ($1,$2,$3,'primary',$4,$5,$6)`,
        [randomUUID(), orderId, slug, qty, Math.floor(cents / qty), cents],
      );
    } catch (err) {
      console.error("admin_create_items_skipped", err);
    }
    try {
      return serialize(stamped);
    } catch (err) {
      console.error("admin_create_serialize_failed", err);
      return serialize(saved);
    }
  } finally {
    client.release();
  }
}
