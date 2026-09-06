import { NextRequest } from "next/server";
import { proxyAdminGet } from "@/lib/server/admin-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return proxyAdminGet(req, `/api/admin/orders/${orderId}/label-pdf`, "application/pdf");
}
