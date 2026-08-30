import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/server/admin-orders";

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
      limit: Number(url.searchParams.get("limit") || 400),
    });
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_status") {
      return NextResponse.json({ detail: "invalid_status" }, { status: 422 });
    }
    console.error("admin_orders_failed", err);
    return NextResponse.json({ detail: "orders_failed" }, { status: 500 });
  }
}
