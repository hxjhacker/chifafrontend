import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminRequest } from "@/lib/server/admin-backend";
import { ensureSchema, getPool } from "@/lib/server/db";
import { serializePricingCity } from "@/lib/server/pricing-comparison";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ cityId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { cityId } = await ctx.params;
  try {
    const proxied = await proxyAdminRequest(request.clone(), `/api/admin/pricing-comparison/${cityId}`, "PATCH");
    if (proxied.status < 500 && proxied.status !== 404) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      competitor_delivery_price?: number;
      competitor_retour_price?: number;
      competitor_name?: string;
      quick_delivery_price?: number;
      meta_delivery_fee?: number;
    };
    await ensureSchema();
    const client = await getPool().connect();
    try {
      const current = await client.query(
        `SELECT id, city_key, city_name, city_name_ar, delivery_delay,
                quick_delivery_price, quick_retour_price, quick_refus_price,
                competitor_name, competitor_delivery_price, competitor_retour_price
         FROM delivery_cities WHERE id = $1`,
        [cityId],
      );
      if (!current.rowCount) {
        return NextResponse.json({ detail: "city_not_found" }, { status: 404 });
      }
      const row = current.rows[0];
      const delivery =
        body.meta_delivery_fee == null && body.competitor_delivery_price == null
          ? row.competitor_delivery_price
          : Number(body.meta_delivery_fee ?? body.competitor_delivery_price);
      const retour =
        body.competitor_retour_price == null ? row.competitor_retour_price : Number(body.competitor_retour_price);
      const name =
        body.competitor_name == null ? row.competitor_name : String(body.competitor_name).trim() || "Meta Livraison";
      const quickPrice =
        body.quick_delivery_price == null ? row.quick_delivery_price : Number(body.quick_delivery_price);
      const updated = await client.query(
        `UPDATE delivery_cities
         SET competitor_delivery_price = $2,
             competitor_retour_price = $3,
             competitor_name = $4,
             quick_delivery_price = $5,
             quick_retour_price = 0,
             quick_refus_price = 0,
             updated_at = now()
         WHERE id = $1
         RETURNING id, city_key, city_name, city_name_ar, delivery_delay,
                   quick_delivery_price, quick_retour_price, quick_refus_price,
                   competitor_name, competitor_delivery_price, competitor_retour_price`,
        [cityId, delivery, retour, name, quickPrice],
      );
      return NextResponse.json(serializePricingCity(updated.rows[0]));
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("pricing_patch_failed", err);
    return NextResponse.json({ detail: "update_failed" }, { status: 500 });
  }
}
