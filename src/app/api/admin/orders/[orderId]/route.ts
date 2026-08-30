import { NextResponse } from "next/server";
import type { AdminStatus } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteAdminOrder, updateAdminOrder } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

type PatchBody = {
  status?: AdminStatus;
  full_name?: string;
  phone?: string;
  city?: string;
  product_slug?: string;
  tier_qty?: number;
  total_mad?: number;
};

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

  try {
    const order = await updateAdminOrder(orderId, body);
    if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    const status = ["invalid_name", "invalid_ma_phone", "invalid_price", "invalid_status"].includes(message) ? 422 : 500;
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
