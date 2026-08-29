import { NextResponse } from "next/server";
import { getOrder, OrderError } from "@/lib/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    const order = await getOrder(orderId);
    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    console.error("get_order_failed", err);
    return NextResponse.json({ detail: "order_failed" }, { status: 500 });
  }
}
