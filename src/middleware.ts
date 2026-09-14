import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-jwt";
import { DASHBOARD_HOME, DASHBOARD_LOGIN, adminPath } from "@/lib/admin-paths";

const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com").replace(/\/$/, "");

function privacyHeaders() {
  return {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store, max-age=0",
  };
}

function applyPrivacy(res: NextResponse) {
  const headers = privacyHeaders();
  for (const [key, value] of Object.entries(headers)) res.headers.set(key, value);
  return res;
}

function redirectToPath(request: NextRequest, pathname: string) {
  const path = adminPath(pathname);
  const dest = request.nextUrl.clone();
  dest.pathname = path;
  dest.search = "";
  dest.hash = "";
  if (dest.hostname === "mydashboard" || dest.host.startsWith("//") || !dest.host) {
    return applyPrivacy(NextResponse.redirect(`${PUBLIC_ORIGIN}${path}`));
  }
  return applyPrivacy(NextResponse.redirect(dest));
}

async function tokenIsValid(token: string | undefined) {
  if (!token) return false;
  const payload = await verifyAdminToken(token);
  if (payload) return true;
  if (!(process.env.ADMIN_JWT_SECRET || "").trim()) {
    return token.split(".").length === 3;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === DASHBOARD_LOGIN || pathname === `${DASHBOARD_LOGIN}/`;
  const valid = await tokenIsValid(request.cookies.get(ADMIN_COOKIE)?.value);

  if (isLogin) {
    if (valid) return redirectToPath(request, DASHBOARD_HOME);
    return applyPrivacy(NextResponse.next());
  }

  if (!valid) return redirectToPath(request, DASHBOARD_LOGIN);

  return applyPrivacy(NextResponse.next());
}

export const config = {
  matcher: ["/mydashboard", "/mydashboard/:path*", "/admin", "/admin/:path*"],
};
