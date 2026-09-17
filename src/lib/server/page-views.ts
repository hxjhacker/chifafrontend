import { randomUUID } from "node:crypto";
import { ensureSchema, getPool } from "./db";
import {
  VIEW_PRODUCTS,
  type ViewProductSlug,
  type ViewRange,
  type ViewsObservatoryPayload,
} from "../views-observatory";

export type { ViewProductSlug, ViewRange, ViewsObservatoryPayload };

const TZ = "Africa/Casablanca";
const PRODUCT_SET = new Set<string>(VIEW_PRODUCTS);

export function normalizeViewSlug(slug?: string | null) {
  const raw = String(slug || "").trim().toLowerCase();
  if (raw === "educative" || raw === "taalim") return "kids";
  if (PRODUCT_SET.has(raw)) return raw as ViewProductSlug;
  return null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymdInCasablanca(date = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = formatted.split("-").map(Number);
  return { y, m, d, iso: formatted };
}

function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function arabicDayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-MA", { day: "numeric", month: "short" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function rangeWindow(range: ViewRange, customDate?: string | null) {
  const today = ymdInCasablanca();
  if (range === "custom" && customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
    return { start: customDate, end: addDaysIso(customDate, 1), bucket: "hour" as const };
  }
  if (range === "week") {
    const start = addDaysIso(today.iso, -6);
    return { start, end: addDaysIso(today.iso, 1), bucket: "day" as const };
  }
  if (range === "month") {
    const start = `${today.y}-${pad(today.m)}-01`;
    const nextMonth = today.m === 12 ? `${today.y + 1}-01-01` : `${today.y}-${pad(today.m + 1)}-01`;
    return { start, end: nextMonth, bucket: "day" as const };
  }
  return { start: today.iso, end: addDaysIso(today.iso, 1), bucket: "hour" as const };
}

function previousWindow(start: string, end: string) {
  const span = Math.max(1, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));
  return { start: addDaysIso(start, -span), end: start };
}

function hourLabels() {
  return Array.from({ length: 24 }, (_, h) => `${pad(h)}:00`);
}

function dayLabels(start: string, endExclusive: string) {
  const labels: string[] = [];
  let cursor = start;
  while (cursor < endExclusive) {
    labels.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return labels;
}

function emptyPayload(range: ViewRange, start: string, end: string, bucket: "hour" | "day"): ViewsObservatoryPayload {
  const labels = bucket === "hour" ? hourLabels() : dayLabels(start, end).map(arabicDayLabel);
  const zeros = labels.map(() => 0);
  return {
    range,
    from: start,
    to: end,
    totals: { all: 0, store: 0, quran: 0, kids: 0, music: 0 },
    trend_pct: null,
    series: { labels, quran: [...zeros], kids: [...zeros], music: [...zeros] },
  };
}

export async function recordPageView(input: {
  kind: "store" | "product";
  productSlug?: string | null;
  path?: string | null;
}) {
  await ensureSchema();
  const slug = input.kind === "product" ? normalizeViewSlug(input.productSlug) : null;
  if (input.kind === "product" && !slug) return false;
  await getPool().query(
    `INSERT INTO page_views (id, kind, product_slug, path, created_at)
     VALUES ($1, $2, $3, $4, now())`,
    [randomUUID(), input.kind, slug, input.path?.slice(0, 400) || null],
  );
  return true;
}

async function countInRange(start: string, end: string) {
  const result = await getPool().query<{ kind: string; product_slug: string | null; n: string }>(
    `SELECT kind, product_slug, COUNT(*)::int AS n
     FROM page_views
     WHERE created_at >= ($1::date AT TIME ZONE 'Africa/Casablanca')
       AND created_at < ($2::date AT TIME ZONE 'Africa/Casablanca')
     GROUP BY kind, product_slug`,
    [start, end],
  );
  const totals = { all: 0, store: 0, quran: 0, kids: 0, music: 0 };
  for (const row of result.rows) {
    const n = Number(row.n) || 0;
    totals.all += n;
    if (row.kind === "store") totals.store += n;
    const slug = normalizeViewSlug(row.product_slug);
    if (slug) totals[slug] += n;
  }
  return totals;
}

export async function observatoryStats(range: ViewRange, customDate?: string | null): Promise<ViewsObservatoryPayload> {
  await ensureSchema();
  const window = rangeWindow(range, customDate);
  const resolvedRange: ViewRange = range === "custom" && window.start ? "custom" : range === "custom" ? "today" : range;
  const payload = emptyPayload(resolvedRange, window.start, window.end, window.bucket);

  try {
    payload.totals = await countInRange(window.start, window.end);
    const prev = previousWindow(window.start, window.end);
    const previous = await countInRange(prev.start, prev.end);
    if (previous.all > 0) {
      payload.trend_pct = Math.round(((payload.totals.all - previous.all) / previous.all) * 100);
    } else if (payload.totals.all > 0) {
      payload.trend_pct = 100;
    } else {
      payload.trend_pct = 0;
    }

    const trunc = window.bucket === "hour" ? "hour" : "day";
    const fmt = window.bucket === "hour" ? "HH24" : "YYYY-MM-DD";
    const seriesResult = await getPool().query<{ bucket: string; product_slug: string | null; n: string }>(
      `SELECT to_char(date_trunc('${trunc}', created_at AT TIME ZONE 'Africa/Casablanca'), '${fmt}') AS bucket,
              product_slug,
              COUNT(*)::int AS n
       FROM page_views
       WHERE kind = 'product'
         AND created_at >= ($1::date AT TIME ZONE 'Africa/Casablanca')
         AND created_at < ($2::date AT TIME ZONE 'Africa/Casablanca')
       GROUP BY 1, 2`,
      [window.start, window.end],
    );

    const keys = window.bucket === "hour" ? hourLabels().map((label) => label.slice(0, 2)) : dayLabels(window.start, window.end);
    const index = new Map(keys.map((key, i) => [key, i]));
    for (const row of seriesResult.rows) {
      const slug = normalizeViewSlug(row.product_slug);
      if (!slug) continue;
      const key = window.bucket === "hour" ? String(row.bucket).padStart(2, "0") : row.bucket;
      const i = index.get(key);
      if (i == null) continue;
      payload.series[slug][i] += Number(row.n) || 0;
    }
  } catch (err) {
    console.error("observatory_stats_failed", err);
  }

  return payload;
}
