import { NextResponse } from "next/server";
import { hasCompleteConfirmDetails } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOrder, markMetaLivraisonSent } from "@/lib/server/admin-orders";
import { createMetaLivraisonColis, metaLivraisonConfigured } from "@/lib/server/meta-livraison";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: Ctx) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;

  const { orderId } = await context.params;
  if (!orderId) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });

  if (!metaLivraisonConfigured()) {
    return NextResponse.json({ detail: "meta_livraison_not_configured" }, { status: 503 });
  }

  const order = await getAdminOrder(orderId);
  if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
  if (order.status === "cancelled") {
    return NextResponse.json({ detail: "cannot_ship_cancelled" }, { status: 422 });
  }
  if (order.meta_livraison_code) {
    return NextResponse.json(order);
  }
  if (!hasCompleteConfirmDetails(order)) {
    return NextResponse.json({ detail: "confirmation_details_required" }, { status: 422 });
  }

  try {
    const result = await createMetaLivraisonColis(order);
    if (!result.ok) {
      console.error("meta_livraison_failed", result.status, result.detail);
      return NextResponse.json({ detail: result.detail || "meta_livraison_failed" }, { status: result.status >= 400 ? result.status : 502 });
    }
    const saved = await markMetaLivraisonSent(orderId, result.code || order.order_id.slice(0, 12).toUpperCase());
    return NextResponse.json(saved || order);
  } catch (err) {
    console.error("meta_livraison_failed", err);
    return NextResponse.json({ detail: "meta_livraison_failed" }, { status: 502 });
  }
}
