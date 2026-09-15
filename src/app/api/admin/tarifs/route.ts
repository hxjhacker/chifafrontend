import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRegionForCity, regionIdForCity, UNKNOWN_REGION } from "@/lib/admin-geo";
import { foldCityName } from "@/lib/city-tarifs";
import { proxyAdminGet, proxyAdminRequest } from "@/lib/server/admin-backend";
import { ensureSchema, getPool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hubLabel(raw: string | null | undefined) {
  return (raw || "").replace(/^HUB\s+/i, "").replace(/\s+/g, " ").trim().toUpperCase() || "";
}

function lookupId(metaCityId: string, uuid: string) {
  const raw = String(metaCityId || "").trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  const hex = String(uuid || "").replace(/-/g, "").slice(0, 8);
  const parsed = Number.parseInt(hex, 16);
  return Number.isFinite(parsed) ? parsed % 2147483647 : 0;
}

function cityKeys(name: string) {
  const folded = foldCityName(name);
  return folded ? [folded, folded.replace(/\s+/g, "")] : [];
}

async function localTarifs(search: string, limit: number) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const needle = search.trim();
    const cap = Math.max(1, Math.min(limit, 800));
    const meta = await client.query<{
      id: string;
      meta_city_id: string;
      city_name: string;
      delivery_fee: number;
      refusal_fee: number;
      return_fee: number;
      hub_name: string | null;
    }>(
      needle
        ? `SELECT id, meta_city_id, city_name, delivery_fee, refusal_fee, return_fee, hub_name
           FROM city_tarifs
           WHERE city_name ILIKE $1 OR COALESCE(hub_name, '') ILIKE $1
           ORDER BY city_name`
        : `SELECT id, meta_city_id, city_name, delivery_fee, refusal_fee, return_fee, hub_name
           FROM city_tarifs
           ORDER BY city_name`,
      needle ? [`%${needle}%`] : [],
    );
    let quick: Array<{
      id: string;
      city_name: string;
      city_name_ar: string | null;
      quick_delivery_price: number;
      competitor_delivery_price: number | null;
    }> = [];
    try {
      const quickResult = await client.query<{
        id: string;
        city_name: string;
        city_name_ar: string | null;
        quick_delivery_price: number;
        competitor_delivery_price: number | null;
      }>(
        needle
          ? `SELECT id, city_name, city_name_ar, quick_delivery_price, competitor_delivery_price
             FROM delivery_cities
             WHERE city_name ILIKE $1 OR city_name_ar ILIKE $1 OR search_blob ILIKE $1
             ORDER BY city_name`
          : `SELECT id, city_name, city_name_ar, quick_delivery_price, competitor_delivery_price
             FROM delivery_cities
             ORDER BY city_name`,
        needle ? [`%${needle}%`] : [],
      );
      quick = quickResult.rows;
    } catch {
      quick = [];
    }
    const quickByKey = new Map<string, (typeof quick)[number]>();
    for (const row of quick) {
      for (const key of [...cityKeys(row.city_name), ...cityKeys(row.city_name_ar || "")]) {
        if (!quickByKey.has(key)) quickByKey.set(key, row);
      }
    }
    const usedQuick = new Set<string>();
    const merged = meta.rows.map((row) => {
      let matched: (typeof quick)[number] | undefined;
      for (const key of cityKeys(row.city_name)) {
        matched = quickByKey.get(key);
        if (matched) break;
      }
      if (matched) usedQuick.add(matched.id);
      const region = getRegionForCity(row.city_name);
      const quickPrice = matched ? Number(matched.quick_delivery_price) : null;
      const metaFee = Number(row.delivery_fee) || 35;
      return {
        id: lookupId(row.meta_city_id, row.id),
        pricing_city_id: matched?.id || null,
        meta_city_id: row.meta_city_id,
        city_name: row.city_name,
        city_name_ar: matched?.city_name_ar || "",
        hub_name: hubLabel(row.hub_name) || row.hub_name || "",
        region: region === UNKNOWN_REGION ? "" : region,
        region_id: regionIdForCity(row.city_name) || null,
        delivery_fee: metaFee,
        refusal_fee: Number(row.refusal_fee) || 10,
        return_fee: Number(row.return_fee) || 0,
        quick_delivery_price: quickPrice,
        meta_delivery_fee: metaFee,
        competitor_delivery_price: matched?.competitor_delivery_price == null ? metaFee : Number(matched.competitor_delivery_price),
        quick_covered: Boolean(matched),
        meta_covered: true,
      };
    });
    for (const row of quick) {
      if (usedQuick.has(row.id)) continue;
      const region = getRegionForCity(row.city_name);
      const metaFee = row.competitor_delivery_price == null ? null : Number(row.competitor_delivery_price);
      merged.push({
        id: lookupId("", row.id),
        pricing_city_id: row.id,
        meta_city_id: "",
        city_name: row.city_name,
        city_name_ar: row.city_name_ar || "",
        hub_name: "",
        region: region === UNKNOWN_REGION ? "" : region,
        region_id: regionIdForCity(row.city_name) || null,
        delivery_fee: metaFee || 0,
        refusal_fee: 10,
        return_fee: 0,
        quick_delivery_price: Number(row.quick_delivery_price) || 0,
        meta_delivery_fee: metaFee,
        competitor_delivery_price: metaFee,
        quick_covered: true,
        meta_covered: metaFee != null,
      });
    }
    merged.sort((a, b) => a.city_name.localeCompare(b.city_name, "fr"));
    return merged.slice(0, cap);
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const limitRaw = Number(url.searchParams.get("limit") || 200);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 800)) : 200;
  const qs = new URLSearchParams();
  if (search.trim()) qs.set("search", search.trim());
  qs.set("limit", String(limit));
  try {
    const proxied = await proxyAdminGet(request, `/api/admin/tarifs?${qs.toString()}`, "application/json", 8000);
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable — read the same Postgres table as the dashboard.
  }
  try {
    return NextResponse.json(await localTarifs(search, limit));
  } catch (err) {
    console.error("admin_tarifs_failed", err);
    return NextResponse.json({ detail: "tarifs_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return proxyAdminRequest(request, "/api/admin/tarifs", "PATCH");
}
