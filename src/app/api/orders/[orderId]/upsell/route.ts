import { NextResponse } from "next/server";
import { addUpsell, OrderError } from "@/lib/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as { product_slug?: string; event_id?: string };
    const order = await addUpsell(orderId, body.product_slug || "", body.event_id || "");
    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    console.error("add_upsell_failed", err);
    return NextResponse.json({ detail: "order_failed" }, { status: 500 });
  }
}
