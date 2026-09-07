import { NextResponse } from "next/server";
import type { AdminStatus } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminOrder, listAdminOrders } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const url = new URL(request.url);
  try {
    const payload = await listAdminOrders({
      q: url.searchParams.get("q") || "",
      city: url.searchParams.get("city") || "",
      status: url.searchParams.get("status") || "",
      limit: Number(url.searchParams.get("limit") || 2000),
    });
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_status") {
      return NextResponse.json({ detail: "invalid_status" }, { status: 422 });
    }
    console.error("admin_orders_failed", err);
    return NextResponse.json(
      {
        detail: "orders_failed",
        message: err instanceof Error ? err.message.slice(0, 280) : "orders_failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  let body: {
    full_name?: string;
    phone?: string;
    city?: string;
    shipping_city?: string | null;
    product_slug?: string;
    tier_qty?: number;
    total_mad?: number;
    status?: AdminStatus;
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
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }
  try {
    const order = await createAdminOrder({
      full_name: body.full_name || "",
      phone: body.phone || "",
      city: body.city || "",
      shipping_city: body.shipping_city,
      product_slug: body.product_slug || "quran",
      tier_qty: Number(body.tier_qty || 1),
      total_mad: Number(body.total_mad || 0),
      status: (body.status || "confirmed") as AdminStatus,
      address: body.address,
      region_id: body.region_id,
      quartier: body.quartier,
      street: body.street,
      building: body.building,
      landmark: body.landmark,
      courier_notes: body.courier_notes,
      cross_sell_slug: body.cross_sell_slug,
      bundle_enabled: body.bundle_enabled,
      secondary_qty: body.secondary_qty,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "create_failed";
    const status = ["invalid_name", "invalid_ma_phone", "invalid_price", "invalid_status", "invalid_city"].includes(message) ? 422 : 500;
    if (status === 500) console.error("admin_create_failed", err);
    return NextResponse.json({ detail: message }, { status });
  }
}
