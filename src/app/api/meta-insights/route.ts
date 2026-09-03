import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY = {
  spend: 0,
  clicks: 0,
  impressions: 0,
  cpc: 0,
  cpm: 0,
  ctr: 0,
};

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;

  const accountId = (process.env.META_AD_ACCOUNT_ID || "").trim();
  const token = (process.env.META_ACCESS_TOKEN || "").trim();
  if (!accountId || !token) {
    return NextResponse.json({ ...EMPTY, detail: "meta_not_configured" }, { status: 503 });
  }

  const url = new URL(`https://graph.facebook.com/v26.0/${accountId}/insights`);
  url.searchParams.set("fields", "spend,impressions,clicks,cpc,cpm,ctr");
  url.searchParams.set("date_preset", "today");
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const payload = (await res.json()) as {
      data?: Array<Record<string, unknown>>;
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error("meta_insights_failed", payload.error?.message || res.status);
      return NextResponse.json({ ...EMPTY, detail: "meta_insights_failed" }, { status: 502 });
    }

    const row = payload.data?.[0];
    if (!row) {
      return NextResponse.json(EMPTY);
    }

    return NextResponse.json({
      spend: num(row.spend),
      clicks: Math.round(num(row.clicks)),
      impressions: Math.round(num(row.impressions)),
      cpc: num(row.cpc),
      cpm: num(row.cpm),
      ctr: num(row.ctr),
    });
  } catch (err) {
    console.error("meta_insights_failed", err);
    return NextResponse.json({ ...EMPTY, detail: "meta_insights_failed" }, { status: 502 });
  }
}
