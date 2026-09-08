import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminRequest } from "@/lib/server/admin-backend";
import { deleteAdminProduct, patchAdminProduct } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ productId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { productId } = await ctx.params;
  try {
    const proxied = await proxyAdminRequest(request.clone(), `/api/admin/products/${productId}`, "PATCH");
    if (proxied.status < 500 && proxied.status !== 404) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      code?: string;
      default_price?: number;
      is_active?: boolean;
    };
    const product = await patchAdminProduct(productId, body);
    return NextResponse.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    const status = message === "product_not_found" ? 404 : ["invalid_name", "invalid_price"].includes(message) ? 422 : 500;
    return NextResponse.json({ detail: message }, { status });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const { productId } = await ctx.params;
  try {
    const proxied = await proxyAdminRequest(request.clone(), `/api/admin/products/${productId}`, "DELETE");
    if (proxied.status < 500 && proxied.status !== 404) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    return NextResponse.json(await deleteAdminProduct(productId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "delete_failed";
    return NextResponse.json({ detail: message }, { status: message === "product_not_found" ? 404 : 500 });
  }
}
