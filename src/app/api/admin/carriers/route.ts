import { NextRequest } from "next/server";
import { proxyAdminGet, proxyAdminJson } from "@/lib/server/admin-backend";
import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return proxyAdminGet(request, "/api/admin/carriers", "application/json", 8000);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return proxyAdminJson(request, "/api/admin/carriers/quick-livraison/sync-cities");
}
