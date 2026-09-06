import { NextResponse } from "next/server";
import type { AdminStatus, DeliveryWindow } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteAdminOrder, updateAdminOrder } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: AdminStatus[] = ["new", "confirmed", "shipped", "delivered", "returned", "cancelled"];
const WINDOWS: DeliveryWindow[] = ["anytime", "morning", "afternoon", "weekend"];

type PatchBody = Record<string, unknown>;

function pick(body: PatchBody, ...keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      return body[key];
    }
  }
  return undefined;
}

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

function asNullableText(value: unknown) {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizePatch(body: PatchBody) {
  const statusRaw = asText(pick(body, "status"));
  const status = statusRaw && ALLOWED.includes(statusRaw as AdminStatus) ? (statusRaw as AdminStatus) : undefined;
  const windowRaw = asText(pick(body, "delivery_window", "deliveryWindow"));
  const cross = pick(body, "cross_sell_slug", "crossSellSlug", "secondary_product", "secondaryProduct");
  return {
    full_name: asText(pick(body, "full_name", "fullName", "customer_name", "customerName")),
    customer_name: asText(pick(body, "customer_name", "customerName")),
    phone: asText(pick(body, "phone")),
    city: asText(pick(body, "city")),
    shipping_city: asNullableText(pick(body, "shipping_city", "shippingCity", "meta_city", "metaCity")),
    address: asText(pick(body, "address", "full_address", "fullAddress")),
    full_address: asText(pick(body, "full_address", "fullAddress")),
    region_id: asText(pick(body, "region_id", "regionId", "region")),
    region: asText(pick(body, "region", "region_id", "regionId")),
    product_slug: asText(pick(body, "product_slug", "productSlug", "primary_product", "primaryProduct")),
    primary_product: asText(pick(body, "primary_product", "primaryProduct")),
    tier_qty: asNumber(pick(body, "tier_qty", "tierQty", "primary_qty", "primaryQty")),
    primary_qty: asNumber(pick(body, "primary_qty", "primaryQty")),
    total_mad: asNumber(pick(body, "total_mad", "totalMad", "total_price", "totalPrice")),
    total_price: asNumber(pick(body, "total_price", "totalPrice")),
    courier_notes: pick(body, "courier_notes", "courierNotes", "driver_comment", "driverComment") as string | undefined,
    driver_comment: pick(body, "driver_comment", "driverComment") as string | undefined,
    cross_sell_slug: asNullableText(cross),
    secondary_product: asNullableText(pick(body, "secondary_product", "secondaryProduct")),
    cross_sell_price_mad: asNumber(pick(body, "cross_sell_price_mad", "crossSellPriceMad")),
    bundle_enabled: asBool(pick(body, "bundle_enabled", "bundleEnabled")),
    secondary_qty: asNumber(pick(body, "secondary_qty", "secondaryQty")),
    quartier: asText(pick(body, "quartier")),
    street: asText(pick(body, "street")),
    building: asText(pick(body, "building")),
    landmark: asText(pick(body, "landmark")),
    delivery_window: windowRaw && WINDOWS.includes(windowRaw as DeliveryWindow) ? (windowRaw as DeliveryWindow) : undefined,
    status,
  };
}

async function readOrderId(
  request: Request,
  ctx: { params: Promise<{ orderId?: string; id?: string }> | { orderId?: string; id?: string } },
) {
  const params = await Promise.resolve(ctx.params);
  const fromParams = String(params?.orderId || params?.id || "").trim();
  if (fromParams) {
    try {
      return decodeURIComponent(fromParams);
    } catch {
      return fromParams;
    }
  }
  try {
    const parts = new URL(request.url).pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("orders");
    const raw = String((idx >= 0 ? parts[idx + 1] : parts.at(-1)) || "").trim();
    return raw ? decodeURIComponent(raw) : "";
  } catch {
    return "";
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ orderId?: string; id?: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const orderId = await readOrderId(request, ctx);
  if (!orderId) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });

  let body: PatchBody = {};
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as PatchBody) : {};
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  try {
    const bodyKeys = Object.keys(body).filter((key) => body[key] !== undefined);
    const patch =
      bodyKeys.length === 1 && bodyKeys[0] === "status"
        ? { status: asText(body.status) && ALLOWED.includes(asText(body.status) as AdminStatus) ? (asText(body.status) as AdminStatus) : undefined }
        : normalizePatch(body);
    if (bodyKeys.length === 1 && bodyKeys[0] === "status" && !patch.status) {
      return NextResponse.json({ detail: "invalid_status" }, { status: 422 });
    }
    const order = await updateAdminOrder(orderId, patch);
    if (!order) return NextResponse.json({ detail: "order_not_found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    const known = [
      "invalid_name",
      "invalid_ma_phone",
      "invalid_price",
      "invalid_status",
      "invalid_status_transition",
      "confirmation_details_required",
      "invalid_delivery_window",
      "invalid_qty",
    ];
    const status = known.includes(message) ? 422 : 500;
    if (status === 500) console.error("admin_order_patch_failed", err);
    return NextResponse.json({ detail: known.includes(message) ? message : "update_failed" }, { status });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ orderId?: string; id?: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  const orderId = await readOrderId(request, ctx);
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
