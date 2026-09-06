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
    if (!orderId) {
      return NextResponse.json({ success: false, detail: "order_not_found" }, { status: 404 });
    }

    const backendBase =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://api.chifaglow.com";

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

    const data = await backendRes.json().catch(() => null);

    return NextResponse.json(data || { success: false, detail: "Empty backend response" }, {
      status: backendRes.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach backend";
    console.error("[Livraison Proxy Error]:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
