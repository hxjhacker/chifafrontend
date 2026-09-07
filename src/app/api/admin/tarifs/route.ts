import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet } from "@/lib/server/admin-backend";
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

async function localTarifs(search: string, limit: number) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const needle = search.trim();
    const cap = Math.max(1, Math.min(limit, 200));
    const result = await client.query<{
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
           ORDER BY city_name
           LIMIT $2`
        : `SELECT id, meta_city_id, city_name, delivery_fee, refusal_fee, return_fee, hub_name
           FROM city_tarifs
           ORDER BY city_name
           LIMIT $1`,
      needle ? [`%${needle}%`, cap] : [cap],
    );
    return result.rows.map((row) => ({
      id: lookupId(row.meta_city_id, row.id),
      city_name: row.city_name,
      hub_name: hubLabel(row.hub_name) || row.hub_name || "",
      delivery_fee: Number(row.delivery_fee) || 35,
      refusal_fee: Number(row.refusal_fee) || 10,
      return_fee: Number(row.return_fee) || 0,
    }));
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const limitRaw = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;
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
