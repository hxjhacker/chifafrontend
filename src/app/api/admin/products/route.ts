import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { proxyAdminGet, proxyAdminJson } from "@/lib/server/admin-backend";
import { createAdminProduct, listAdminProducts } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const proxied = await proxyAdminGet(request, "/api/admin/products", "application/json");
    if (proxied.status === 200) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    return NextResponse.json(await listAdminProducts());
  } catch (err) {
    console.error("admin_products_failed", err);
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const proxied = await proxyAdminJson(request.clone(), "/api/admin/products");
    if (proxied.status < 500 && proxied.status !== 404) return proxied;
  } catch {
    // FastAPI unavailable
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      code?: string;
      default_price?: number;
      quick_product_id?: number | string | null;
      category?: string | null;
      is_quick_stock?: boolean;
      stock_quantity?: number;
      is_active?: boolean;
    };
    const product = await createAdminProduct({
      name: body.name || "",
      code: body.code,
      default_price: body.default_price,
      quick_product_id: body.quick_product_id,
      category: body.category,
      is_quick_stock: body.is_quick_stock,
      stock_quantity: body.stock_quantity,
      is_active: body.is_active,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "create_failed";
    const status = ["invalid_name", "invalid_price", "invalid_quick_product_id", "invalid_stock"].includes(message) ? 422 : 500;
    return NextResponse.json({ detail: message }, { status });
  }
}
