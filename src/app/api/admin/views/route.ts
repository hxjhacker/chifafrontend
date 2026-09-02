import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { observatoryStats } from "@/lib/server/page-views";
import type { ViewRange } from "@/lib/views-observatory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGES = new Set<ViewRange>(["today", "week", "month", "custom"]);

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const url = new URL(request.url);
  const raw = url.searchParams.get("range") || "today";
  const range: ViewRange = RANGES.has(raw as ViewRange) ? (raw as ViewRange) : "today";
  const date = url.searchParams.get("date");
  try {
    return NextResponse.json(await observatoryStats(range, date));
  } catch (err) {
    console.error("admin_views_failed", err);
    return NextResponse.json({ detail: "views_failed" }, { status: 500 });
  }
}
