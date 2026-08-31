import { NextResponse } from "next/server";
import type { AdminStatus, DeliveryWindow } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteAdminOrder, updateAdminOrder } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const WINDOWS: DeliveryWindow[] = ["anytime", "morning", "afternoon", "weekend"];

type PatchBody = {
  status?: AdminStatus;
  full_name?: string;
  phone?: string;
  city?: string;
  product_slug?: string;
  primary_product?: string;
  tier_qty?: number;
  primary_qty?: number;
  total_mad?: number;
  total_price?: number;
  quartier?: string;
  street?: string;
  building?: string;
  landmark?: string;
  delivery_window?: DeliveryWindow;
  courier_notes?: string;
  driver_comment?: string;
  address?: string;
  full_address?: string;
  region_id?: string;
  region?: string;
  cross_sell_slug?: string | null;
  secondary_product?: string | null;
  cross_sell_price_mad?: number;
  bundle_enabled?: boolean;
  secondary_qty?: number;
};

function normalizePatch(body: PatchBody) {
  return {
    ...body,
    address: body.address ?? body.full_address,
    region_id: body.region_id ?? body.region,
    product_slug: body.product_slug ?? body.primary_product,
    tier_qty: body.tier_qty ?? body.primary_qty,
    total_mad: body.total_mad ?? body.total_price,
    courier_notes: body.courier_notes ?? body.driver_comment,
    cross_sell_slug: body.cross_sell_slug !== undefined ? body.cross_sell_slug : body.secondary_product,
  };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { orderId } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  if (body.status && !ALLOWED.includes(body.status)) {
    return NextResponse.json({ detail: "invalid_status" }, { status: 422 });
  }
  if (body.delivery_window && !WINDOWS.includes(body.delivery_window)) {
    return NextResponse.json({ detail: "invalid_delivery_window" }, { status: 422 });
  }

  try {
    const order = await updateAdminOrder(orderId, normalizePatch(body));
    if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    const status = ["invalid_name", "invalid_ma_phone", "invalid_price", "invalid_status", "invalid_delivery_window", "invalid_qty"].includes(message)
      ? 422
      : 500;
    if (status === 500) console.error("admin_status_failed", err);
    return NextResponse.json({ detail: message }, { status });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { orderId } = await ctx.params;
  try {
    const ok = await deleteAdminOrder(orderId);
    if (!ok) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin_delete_failed", err);
    return NextResponse.json({ detail: "delete_failed" }, { status: 500 });
  }
}
