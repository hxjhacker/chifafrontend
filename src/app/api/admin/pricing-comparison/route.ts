import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet, proxyAdminJson } from "@/lib/server/admin-backend";
import { ensureSchema, getPool } from "@/lib/server/db";
import { buildPricingStats, citiesFromQuickJsonFile, serializePricingCity } from "@/lib/server/pricing-comparison";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function localCities(search: string) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const needle = search.trim();
    const result = await client.query(
      needle
        ? `SELECT id, city_key, city_name, city_name_ar, delivery_delay,
                  quick_delivery_price, quick_retour_price, quick_refus_price,
                  competitor_name, competitor_delivery_price, competitor_retour_price
           FROM delivery_cities
           WHERE city_name ILIKE $1 OR city_name_ar ILIKE $1 OR search_blob ILIKE $1
           ORDER BY city_name`
        : `SELECT id, city_key, city_name, city_name_ar, delivery_delay,
                  quick_delivery_price, quick_retour_price, quick_refus_price,
                  competitor_name, competitor_delivery_price, competitor_retour_price
           FROM delivery_cities
           ORDER BY city_name`,
      needle ? [`%${needle}%`] : [],
    );
    const cities = result.rows.map(serializePricingCity);
    const statsSource = needle
      ? (
          await client.query(
            `SELECT id, city_key, city_name, city_name_ar, delivery_delay,
                    quick_delivery_price, quick_retour_price, quick_refus_price,
                    competitor_name, competitor_delivery_price, competitor_retour_price
             FROM delivery_cities`,
          )
        ).rows.map(serializePricingCity)
      : cities;
    return { cities, count: cities.length, stats: buildPricingStats(statsSource) };
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const q = new URL(request.url).searchParams.get("q") || "";
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  try {
    const proxied = await proxyAdminGet(request, `/api/admin/pricing-comparison${qs}`, "application/json", 4000);
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    const local = await localCities(q);
    if (local.cities.length) return NextResponse.json(local);
  } catch (err) {
    console.error("pricing_comparison_local_failed", err);
  }
  try {
    const fromFile = await citiesFromQuickJsonFile();
    if (fromFile) {
      const needle = q.trim().toLocaleLowerCase("ar");
      const cities = needle
        ? fromFile.cities.filter((row) => `${row.city_name} ${row.city_name_ar}`.toLocaleLowerCase("ar").includes(needle))
        : fromFile.cities;
      return NextResponse.json({ cities, count: cities.length, stats: fromFile.stats, source: "quick_pricing.json" });
    }
  } catch (err) {
    console.error("pricing_comparison_json_failed", err);
  }
  return NextResponse.json({
    cities: [],
    count: 0,
    stats: buildPricingStats([]),
    detail: "pricing_unavailable",
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return proxyAdminJson(request, "/api/admin/pricing-comparison/seed");
}
