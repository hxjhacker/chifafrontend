import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePushSubscription, pushPublicKey, savePushSubscription } from "@/lib/server/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  return NextResponse.json({ publicKey: pushPublicKey() });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    await savePushSubscription(
      { endpoint: body.endpoint || "", keys: body.keys },
      request.headers.get("user-agent") || "",
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "subscribe_failed";
    return NextResponse.json({ detail: message }, { status: message === "invalid_subscription" ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const body = (await request.json()) as { endpoint?: string };
    await deletePushSubscription(body.endpoint || "");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
