import { NextRequest } from "next/server";
import { proxyAdminJson } from "@/lib/server/admin-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  return proxyAdminJson(req, "/api/admin/orders/sync-tracking");
}
