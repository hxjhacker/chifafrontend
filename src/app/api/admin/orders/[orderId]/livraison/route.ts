import { NextResponse } from "next/server";
import { hasCompleteConfirmDetails } from "@/lib/admin";
import { readAdminFromRequest } from "@/lib/admin-auth";
import { getAdminOrder, markMetaLivraisonSent } from "@/lib/server/admin-orders";
import { createMetaLivraisonColis, metaLivraisonConfigured } from "@/lib/server/meta-livraison";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const admin = await readAdminFromRequest(request);
    if (!admin) {
      console.error("401 details:", { origin: "admin_session", path: new URL(request.url).pathname });
      return NextResponse.json(
        { success: false, message: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.", origin: "admin_session" },
        { status: 401 },
      );
    }

    const { orderId } = await context.params;
    if (!orderId) return NextResponse.json({ success: false, detail: "order_not_found" }, { status: 404 });

    if (!metaLivraisonConfigured()) {
      return NextResponse.json(
        { success: false, detail: "META_LIVRAISON_API_KEY or META_LIVRAISON_API_SECRET is missing" },
        { status: 400 },
      );
    }

    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, detail: "order_not_found" }, { status: 404 });
    if (order.status === "cancelled") {
      return NextResponse.json({ success: false, detail: "cannot_ship_cancelled" }, { status: 400 });
    }
    if (order.meta_livraison_code) {
      return NextResponse.json({ success: true, ...order });
    }
    if (!hasCompleteConfirmDetails(order)) {
      return NextResponse.json({ success: false, detail: "confirmation_details_required" }, { status: 400 });
    }

    const result = await createMetaLivraisonColis(order);
    if (!result.ok) {
      if (result.status === 401) {
        console.error("401 details:", { origin: "meta_livraison", error: result.raw || result.detail });
      }
      return NextResponse.json(
        { success: false, detail: result.detail || "meta_livraison_failed", origin: "meta_livraison" },
        { status: 400 },
      );
    }
    const saved = await markMetaLivraisonSent(orderId, result.code || order.order_id.slice(0, 12).toUpperCase());
    return NextResponse.json({ success: true, ...(saved || order) });
  } catch (e) {
    console.error("401 details:", e);
    console.error(e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
