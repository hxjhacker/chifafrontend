import { NextResponse } from "next/server";
import type { AdminStatus } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { updateAdminOrderStatus } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { orderId } = await ctx.params;

  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  const status = body.status as AdminStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ detail: "invalid_status" }, { status: 422 });
  }

  try {
    const order = await updateAdminOrderStatus(orderId, status);
    if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    console.error("admin_status_failed", err);
    return NextResponse.json({ detail: "update_failed" }, { status: 500 });
  }
}
