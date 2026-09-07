import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet } from "@/lib/server/admin-backend";
import { logisticsAnalytics } from "@/lib/server/logistics-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const proxied = await proxyAdminGet(request, "/api/admin/analytics/logistics", "application/json");
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable — compute from the same Postgres as the dashboard.
  }
  try {
    return NextResponse.json(await logisticsAnalytics());
  } catch (err) {
    console.error("admin_logistics_failed", err);
    return NextResponse.json({ detail: "logistics_failed" }, { status: 500 });
  }
}
