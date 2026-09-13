import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-jwt";

const LOGIN = "/mydashboard/login";
const HOME = "/mydashboard";

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
  const isLogin = pathname === LOGIN;
  const valid = await tokenIsValid(request.cookies.get(ADMIN_COOKIE)?.value);

  if (isLogin) {
    if (valid) {
      const url = request.nextUrl.clone();
      url.pathname = HOME;
      return applyPrivacy(NextResponse.redirect(url));
    }
    return applyPrivacy(NextResponse.next());
  }

  if (!valid) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    return applyPrivacy(NextResponse.redirect(url));
  }

  return applyPrivacy(NextResponse.next());
}

export const config = {
  matcher: ["/mydashboard", "/mydashboard/:path*", "/admin", "/admin/:path*"],
};
