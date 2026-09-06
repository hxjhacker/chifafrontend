import { NextRequest } from "next/server";
import { proxyAdminBody } from "@/lib/server/admin-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  return proxyAdminBody(req, "/api/admin/orders/bulk-labels", "application/pdf");
}
