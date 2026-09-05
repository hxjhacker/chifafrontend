import { NextResponse } from "next/server";
import { hasCompleteConfirmDetails } from "@/lib/admin";
import { readAdminFromRequest } from "@/lib/admin-auth";
import { getAdminOrder, markMetaLivraisonSent } from "@/lib/server/admin-orders";
import { createMetaLivraisonColis, metaLivraisonConfigured } from "@/lib/server/meta-livraison";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

function fail(message: string, httpStatus: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...extra }, { status: httpStatus });
}

export async function POST(request: Request, context: Ctx) {
  const admin = await readAdminFromRequest(request);
  if (!admin) {
    console.error("401 details:", { origin: "admin_session", path: new URL(request.url).pathname });
    return fail("جلسة الأدمن غير صالحة. أعد تسجيل الدخول.", 401, { origin: "admin_session" });
  }

  const { orderId } = await context.params;
  if (!orderId) return fail("الطلبية غير موجودة.", 404, { detail: "order_not_found" });

  if (!metaLivraisonConfigured()) {
    return fail("أضف META_LIVRAISON_API_KEY و META_LIVRAISON_API_SECRET في الخادم.", 503, {
      detail: "meta_livraison_not_configured",
      origin: "config",
    });
  }

  const order = await getAdminOrder(orderId);
  if (!order) return fail("الطلبية غير موجودة.", 404, { detail: "order_not_found" });
  if (order.status === "cancelled") {
    return fail("لا يمكن شحن طلبية ملغاة.", 422, { detail: "cannot_ship_cancelled" });
  }
  if (order.meta_livraison_code) {
    return NextResponse.json({ success: true, ...order });
  }
  if (!hasCompleteConfirmDetails(order)) {
    return fail("كمّل معلومات التوصيل قبل الشحن.", 422, { detail: "confirmation_details_required" });
  }

  try {
    const result = await createMetaLivraisonColis(order);
    if (!result.ok) {
      const fromMeta = result.status === 401;
      if (fromMeta) {
        console.error("401 details:", {
          origin: "meta_livraison",
          status: 401,
          error: result.raw || result.detail,
        });
      }
      const message = fromMeta
        ? "مفاتيح Meta Livraison مرفوضة (401 من شركة التوصيل). تحقق من META_LIVRAISON_API_KEY و META_LIVRAISON_API_SECRET."
        : result.detail || "تعذر إرسال الطرد إلى Meta Livraison.";
      return fail(message, fromMeta ? 502 : result.status >= 400 && result.status !== 401 ? result.status : 502, {
        detail: result.detail || "meta_livraison_failed",
        origin: "meta_livraison",
      });
    }
    const saved = await markMetaLivraisonSent(orderId, result.code || order.order_id.slice(0, 12).toUpperCase());
    return NextResponse.json({ success: true, ...(saved || order) });
  } catch (err) {
    console.error("401 details:", err);
    console.error("meta_livraison_failed", err);
    return fail("تعذر الاتصال بـ Meta Livraison.", 502, { origin: "meta_livraison" });
  }
}
