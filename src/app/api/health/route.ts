import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, service: "chifaglow-web" });
  } catch (err) {
    console.error("db_health_failed", err);
    return NextResponse.json({ ok: false, detail: "database_unreachable" }, { status: 500 });
  }
}
