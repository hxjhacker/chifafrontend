import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId?: string; id?: string }> },
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.orderId || resolvedParams.id;

    const backendBase =
      process.env.INTERNAL_API_URL ||
      process.env.API_URL ||
      "http://chifaglow_backend:8000";

    const targetUrl = `${backendBase.replace(/\/$/, "")}/api/admin/orders/${orderId}/livraison`;

    const cookie = req.headers.get("cookie") || "";
    const authHeader = req.headers.get("authorization") || "";

    const backendRes = await fetch(targetUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(authHeader ? { authorization: authHeader } : {}),
      },
    });

    const rawText = await backendRes.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    return NextResponse.json(
      {
        proxied_status: backendRes.status,
        target_url: targetUrl,
        backend_response: data,
      },
      { status: backendRes.status === 200 ? 200 : backendRes.status },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Livraison Proxy Error]:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
