import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet } from "@/lib/server/admin-backend";
import { listUndispatchedSummary } from "@/lib/server/undispatched";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const proxied = await proxyAdminGet(request, "/api/admin/orders/undispatched-summary", "application/json", 8000);
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    return NextResponse.json(await listUndispatchedSummary());
  } catch (err) {
    console.error("undispatched_summary_failed", err);
    return NextResponse.json({
      new_orders_count: 0,
      overdue_orders_count: 0,
      total_count: 0,
      new_items: [],
      overdue_items: [],
      items: [],
    });
  }
}
