import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminJson } from "@/lib/server/admin-backend";
import { dispatchOrdersToGooli, isGooliCarrier } from "@/lib/server/gooli";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let carrier = "";
  let orderIds: string[] = [];
  try {
    const parsed = JSON.parse(raw || "{}") as { carrier?: unknown; order_ids?: unknown };
    carrier = String(parsed.carrier || "");
    orderIds = Array.isArray(parsed.order_ids) ? parsed.order_ids.map((id) => String(id || "")) : [];
  } catch {
    carrier = "";
  }
  if (isGooliCarrier(carrier)) {
    const denied = await requireAdmin(req);
    if (denied instanceof NextResponse) return denied;
    const result = await dispatchOrdersToGooli(orderIds);
    return NextResponse.json(
      {
        success_count: result.success_count,
        failed_count: result.failed_count,
        message: result.message,
        errors: result.errors,
        results: result.results,
      },
      { status: result.httpStatus },
    );
  }
  return proxyAdminJson(req, "/api/admin/orders/bulk-livraison", raw);
}
