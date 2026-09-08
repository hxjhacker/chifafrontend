import { ensureSchema, getPool } from "@/lib/server/db";

export type UndispatchedItem = {
  id: string;
  order_id: string;
  code: string;
  full_name: string;
  client_name: string;
  phone: string;
  phone_national: string | null;
  city: string;
  address: string | null;
  status: string;
  created_at: string | null;
  confirmed_at: string | null;
  hours_delayed: number;
  hours_ago: number;
  meta_livraison_code: string | null;
};

export type UndispatchedSummary = {
  new_orders_count: number;
  overdue_orders_count: number;
  total_count: number;
  new_items: UndispatchedItem[];
  overdue_items: UndispatchedItem[];
  items: UndispatchedItem[];
};

type Row = {
  id: string;
  full_name: string;
  phone: string;
  phone_national: string | null;
  city: string;
  address: string | null;
  status: string;
  created_at: Date | string | null;
  confirmed_at: Date | string | null;
  meta_livraison_code: string | null;
};

function iso(value: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function hoursSince(value: Date | string | null, now: Date) {
  if (!value) return 0;
  const stamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(stamp.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - stamp.getTime()) / 3600000));
}

function codeFor(id: string) {
  return `#CFG-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function displayStatus(raw: string) {
  if (["pending", "upsell_accepted", "new"].includes(raw)) return "new";
  if (raw === "in_shipping") return "shipped";
  return raw || "new";
}

function dump(row: Row, now: Date, delayedFrom: Date | string | null): UndispatchedItem {
  return {
    id: String(row.id),
    order_id: String(row.id),
    code: codeFor(String(row.id)),
    full_name: row.full_name || "",
    client_name: row.full_name || "",
    phone: row.phone_national || row.phone || "",
    phone_national: row.phone_national,
    city: row.city || "",
    address: row.address,
    status: displayStatus(row.status),
    created_at: iso(row.created_at),
    confirmed_at: iso(row.confirmed_at),
    hours_delayed: hoursSince(delayedFrom || row.confirmed_at || row.created_at, now),
    hours_ago: hoursSince(row.created_at, now),
    meta_livraison_code: row.meta_livraison_code,
  };
}

const SELECT = `id, full_name, phone, phone_national, city, address, status, created_at, confirmed_at, meta_livraison_code`;
const NO_TRACKING = `(meta_livraison_code IS NULL OR BTRIM(meta_livraison_code) = '')`;
const NEW_STATUSES = `status IN ('pending', 'new', 'upsell_accepted', 'confirmed')`;
const OVERDUE = `
  ${NO_TRACKING}
  AND status = 'confirmed'
  AND COALESCE(confirmed_at, created_at) <= NOW() - INTERVAL '24 hours'
`;
const NEW_ORDERS = `
  ${NO_TRACKING}
  AND ${NEW_STATUSES}
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND NOT (
    status = 'confirmed'
    AND COALESCE(confirmed_at, created_at) <= NOW() - INTERVAL '24 hours'
  )
`;

export async function listUndispatchedSummary(): Promise<UndispatchedSummary> {
  await ensureSchema();
  const now = new Date();
  const client = await getPool().connect();
  try {
    const [newCount, overdueCount, newRows, overdueRows] = await Promise.all([
      client.query<{ n: string }>(`SELECT COUNT(*)::int AS n FROM orders WHERE ${NEW_ORDERS}`),
      client.query<{ n: string }>(`SELECT COUNT(*)::int AS n FROM orders WHERE ${OVERDUE}`),
      client.query<Row>(
        `SELECT ${SELECT} FROM orders WHERE ${NEW_ORDERS} ORDER BY created_at DESC LIMIT 50`,
      ),
      client.query<Row>(
        `SELECT ${SELECT} FROM orders WHERE ${OVERDUE} ORDER BY COALESCE(confirmed_at, created_at) ASC LIMIT 50`,
      ),
    ]);
    const newItems = newRows.rows.map((row) => dump(row, now, row.created_at));
    const overdueItems = overdueRows.rows.map((row) => dump(row, now, row.confirmed_at || row.created_at));
    const newOrdersCount = Number(newCount.rows[0]?.n || 0);
    const overdueOrdersCount = Number(overdueCount.rows[0]?.n || 0);
    return {
      new_orders_count: newOrdersCount,
      overdue_orders_count: overdueOrdersCount,
      total_count: newOrdersCount + overdueOrdersCount,
      new_items: newItems,
      overdue_items: overdueItems,
      items: overdueItems,
    };
  } finally {
    client.release();
  }
}
