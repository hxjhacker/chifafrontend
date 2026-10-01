import { NextResponse } from "next/server";
import {
  loginRetryAfter,
  recordLoginFailure,
  recordLoginSuccess,
  requestIp,
} from "@/lib/admin-auth";
import { adminCredentialsConfigured, verifyStoredAdminCredentials } from "@/lib/server/admin-credentials";
import { adminAuthConfigured, ADMIN_COOKIE, authCookieOptions, signAdminToken } from "@/lib/admin-jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const retryAfter = loginRetryAfter(ip);
  if (retryAfter > 0) {
    return NextResponse.json(
      { detail: "too_many_attempts" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (!adminAuthConfigured() && !(await adminCredentialsConfigured())) {
    return NextResponse.json({ detail: "admin_not_configured" }, { status: 503 });
  }

  let body: { username?: string; password?: string; remember?: boolean; rememberMe?: boolean };
  try {
    body = (await request.json()) as { username?: string; password?: string; remember?: boolean; rememberMe?: boolean };
  } catch {
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  const remember = Boolean(body.remember ?? body.rememberMe);
  if (!username || !password) {
    return NextResponse.json({ detail: "invalid_credentials" }, { status: 401 });
  }

  const ok = await verifyStoredAdminCredentials(username, password);
  if (!ok) {
    const locked = recordLoginFailure(ip);
    return NextResponse.json(
      { detail: "invalid_credentials" },
      { status: 401, headers: locked ? { "Retry-After": String(locked) } : undefined },
    );
  }

  recordLoginSuccess(ip);
  const token = await signAdminToken(username, remember);
  const res = NextResponse.json({ ok: true, username });
  res.cookies.set(ADMIN_COOKIE, token, authCookieOptions(remember));
  return res;
}
