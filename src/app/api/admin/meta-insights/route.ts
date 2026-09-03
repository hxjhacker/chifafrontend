import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchMetaInsights } from "@/lib/server/meta-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const { body, status } = await fetchMetaInsights();
    return NextResponse.json(body, { status });
  } catch (err) {
    console.error("meta_insights_failed", err);
    return NextResponse.json(
      { spend: 0, clicks: 0, impressions: 0, cpc: 0, cpm: 0, ctr: 0, detail: "meta_insights_failed" },
      { status: 502 },
    );
  }
}
