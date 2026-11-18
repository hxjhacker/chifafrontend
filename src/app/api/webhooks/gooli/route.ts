import { NextRequest, NextResponse } from "next/server";
import { handleGooliWebhook } from "@/lib/server/gooli";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

function header(req: NextRequest, names: string[]) {
  for (const name of names) {
    const value = req.headers.get(name);
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  try {
    const result = await handleGooliWebhook({
      rawBody,
      signature: header(req, ["x-webhook-signature", "x-gooli-signature"]),
      timestamp: header(req, ["x-webhook-timestamp", "x-gooli-timestamp", "x-timestamp"]),
      eventIdHeader: header(req, ["x-webhook-id", "x-request-id", "x-gooli-event-id"]),
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error("gooli_webhook_failed", err);
    return NextResponse.json({ ok: false, error: "webhook_failed" }, { status: 500 });
  }
}
