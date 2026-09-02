import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authCookieOptions } from "@/lib/admin-jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...authCookieOptions(true), maxAge: 0, expires: new Date(0) });
  return res;
}
