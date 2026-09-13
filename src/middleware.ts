import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-jwt";
import { DASHBOARD_HOME, DASHBOARD_LOGIN, adminPath } from "@/lib/admin-paths";

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

function firstHeader(request: NextRequest, name: string) {
  return (request.headers.get(name) || "").split(",")[0].trim();
}

function looksLikePublicHost(host: string) {
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname || hostname === "mydashboard") return false;
  return hostname === "localhost" || hostname.startsWith("127.") || hostname.includes(".");
}

/** Same-origin absolute redirect. Never emit //mydashboard or https://mydashboard/. */
function redirectToPath(request: NextRequest, pathname: string) {
  const path = adminPath(pathname);
  const forwardedHost = firstHeader(request, "x-forwarded-host");
  const rawHost = forwardedHost || firstHeader(request, "host") || request.nextUrl.host;
  const host = looksLikePublicHost(rawHost) ? rawHost : "chifaglow.com";
  const proto = (firstHeader(request, "x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https").replace(/:$/, "");
  const dest = new URL(`${proto}://${host}${path}`);
  dest.search = "";
  dest.hash = "";
  return applyPrivacy(NextResponse.redirect(dest));
}

async function tokenIsValid(token: string | undefined) {
  if (!token) return false;
  const payload = await verifyAdminToken(token);
  if (payload) return true;
  // Edge build may lack the secret; require a JWT-shaped cookie and let API routes enforce.
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
