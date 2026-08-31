import { NextResponse } from "next/server";
import type { AdminStatus, DeliveryWindow } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteAdminOrder, updateAdminOrder } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const WINDOWS: DeliveryWindow[] = ["anytime", "morning", "afternoon", "weekend"];

type PatchBody = {
  customer_name?: string;
  status?: string;
  full_name?: string;
  phone?: string;
  city?: string;
  product_slug?: string;
  primary_product?: string;
  tier_qty?: number | string;
  primary_qty?: number | string;
  total_mad?: number | string;
  total_price?: number | string;
  quartier?: string;
  street?: string;
  building?: string;
  landmark?: string;
  delivery_window?: string;
  courier_notes?: string;
  driver_comment?: string;
  address?: string;
  full_address?: string;
  region_id?: string;
  region?: string;
  cross_sell_slug?: string | null;
  secondary_product?: string | null;
  cross_sell_price_mad?: number | string;
  bundle_enabled?: boolean | string;
  secondary_qty?: number | string;
};

function asText(value: unknown) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function asNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function asBool(value: unknown) {
  if (value == null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "true" || text === "1") return true;
  if (text === "false" || text === "0") return false;
  return undefined;
}

function normalizePatch(body: PatchBody) {
  const statusRaw = asText(body.status);
  const status = statusRaw && ALLOWED.includes(statusRaw as AdminStatus) ? (statusRaw as AdminStatus) : undefined;
  const windowRaw = asText(body.delivery_window);
  return {
    full_name: asText(body.full_name) ?? asText(body.customer_name),
    customer_name: asText(body.customer_name),
    phone: asText(body.phone),
    city: asText(body.city),
    address: asText(body.address) ?? asText(body.full_address),
    full_address: asText(body.full_address),
    region_id: asText(body.region_id) ?? asText(body.region),
    region: asText(body.region),
    product_slug: asText(body.product_slug) ?? asText(body.primary_product),
    primary_product: asText(body.primary_product),
    tier_qty: asNumber(body.tier_qty) ?? asNumber(body.primary_qty),
    primary_qty: asNumber(body.primary_qty),
    total_mad: asNumber(body.total_mad) ?? asNumber(body.total_price),
    total_price: asNumber(body.total_price),
    courier_notes: body.courier_notes ?? body.driver_comment,
    driver_comment: body.driver_comment,
    cross_sell_slug: body.cross_sell_slug !== undefined ? body.cross_sell_slug : body.secondary_product,
    secondary_product: body.secondary_product,
    cross_sell_price_mad: asNumber(body.cross_sell_price_mad),
    bundle_enabled: asBool(body.bundle_enabled),
    secondary_qty: asNumber(body.secondary_qty),
    quartier: asText(body.quartier),
    street: asText(body.street),
    building: asText(body.building),
    landmark: asText(body.landmark),
    delivery_window: windowRaw && WINDOWS.includes(windowRaw as DeliveryWindow) ? (windowRaw as DeliveryWindow) : undefined,
    status,
  };
}

async function readOrderId(ctx: { params: Promise<{ orderId?: string; id?: string }> | { orderId?: string; id?: string } }) {
  const params = await Promise.resolve(ctx.params);
  return String(params?.orderId || params?.id || "").trim();
}

export async function PATCH(request: Request, ctx: { params: Promise<{ orderId?: string; id?: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const orderId = await readOrderId(ctx);
  if (!orderId) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  try {
    const order = await updateAdminOrder(orderId, normalizePatch(body));
    if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    const status = ["invalid_name", "invalid_ma_phone", "invalid_price", "invalid_status", "invalid_delivery_window", "invalid_qty"].includes(message)
      ? 422
      : 500;
    if (status === 500) console.error("admin_order_patch_failed", err);
    return NextResponse.json({ detail: message }, { status });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ orderId?: string; id?: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const orderId = await readOrderId(ctx);
  if (!orderId) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
  try {
    const ok = await deleteAdminOrder(orderId);
    if (!ok) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin_delete_failed", err);
    return NextResponse.json({ detail: "delete_failed" }, { status: 500 });
  }
}
