import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "@/lib/server/admin-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  try {
    return await proxyAdminRequest(req, `/api/admin/orders/${orderId}/dispatch-quick-stock`, "POST");
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر الاتصال بخادم Quick Livraison.";
    return NextResponse.json(
      {
        success: false,
        ok: false,
        detail: message,
        message,
      },
      { status: 400 },
    );
  }
}
