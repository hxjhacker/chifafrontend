import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ success: false, detail: "order_not_found" }, { status: 404 });
    }

    const apiUrl = (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://api.chifaglow.com"
    ).replace(/\/+$/, "");

    const cookie = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";

    const res = await fetch(`${apiUrl}/api/admin/orders/${orderId}/livraison`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Livraison proxy error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
