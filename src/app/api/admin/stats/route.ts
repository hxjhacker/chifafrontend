import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminStats } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    return NextResponse.json(await adminStats());
  } catch (err) {
    console.error("admin_stats_failed", err);
    return NextResponse.json({ detail: "stats_failed" }, { status: 500 });
  }
}
