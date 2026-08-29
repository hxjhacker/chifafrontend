import { NextResponse } from "next/server";
import { createOrder, OrderError } from "@/lib/server/orders";
import type { OrderPayload } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;
    const order = await createOrder(payload, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") || "",
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    console.error("create_order_failed", err);
    return NextResponse.json({ detail: "order_failed" }, { status: 500 });
  }
}
