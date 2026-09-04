import { NextResponse } from "next/server";
import { finalizeOrderPurchase, OrderError } from "@/lib/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    const order = await finalizeOrderPurchase(orderId);
    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    console.error("finalize_purchase_failed", err);
    return NextResponse.json({ detail: "order_failed" }, { status: 500 });
  }
}
