import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/server/admin-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return proxyAdminRequest(req, `/api/admin/orders/${orderId}/dispatch-quick-stock`, "POST");
}
