import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet, proxyAdminJson } from "@/lib/server/admin-backend";
import { ensureSchema, getPool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function localTarifs() {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query<{
      meta_city_id: string;
      city_name: string;
      delivery_fee: number;
      refusal_fee: number;
      return_fee: number;
      hub_name: string | null;
    }>(`SELECT meta_city_id, city_name, delivery_fee, refusal_fee, return_fee, hub_name FROM city_tarifs ORDER BY city_name`);
    const tarifs = result.rows.map((row) => ({
      meta_city_id: row.meta_city_id,
      city_name: row.city_name,
      delivery_fee: Number(row.delivery_fee) || 35,
      refusal_fee: Number(row.refusal_fee) || 10,
      return_fee: Number(row.return_fee) || 0,
      hub_name: row.hub_name || "",
      hub_code: (row.hub_name || "").replace(/^HUB\s+/i, "").trim().toUpperCase(),
    }));
    return { count: tarifs.length, tarifs, source: "FES" };
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const proxied = await proxyAdminGet(request, "/api/admin/city-tarifs", "application/json");
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    return NextResponse.json(await localTarifs());
  } catch (err) {
    console.error("city_tarifs_failed", err);
    return NextResponse.json({ count: 0, tarifs: [], source: "FES" });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return proxyAdminJson(request, "/api/admin/city-tarifs/sync");
}
