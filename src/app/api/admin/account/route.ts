import { NextResponse } from "next/server";
import { accountErrorMessage } from "@/lib/account-errors";
import { requireAdmin } from "@/lib/admin-auth";
import { ADMIN_COOKIE, authCookieOptions, signAdminToken, type AdminJwt } from "@/lib/admin-jwt";
import { getAdminProfile, updateAdminAccount } from "@/lib/server/admin-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(detail: string, status: number) {
  return NextResponse.json({ detail, message: accountErrorMessage(detail, status) }, { status });
}

function remembersSession(admin: AdminJwt) {
  if (!admin.exp || !admin.iat) return false;
  return admin.exp - admin.iat > 24 * 60 * 60;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;
  try {
    const profile = await getAdminProfile(String(admin.sub || ""));
    if (!profile) return fail("not_authenticated", 401);
    return NextResponse.json({ ok: true, username: profile.username, email: profile.email, role: admin.role });
  } catch (error) {
    console.error("admin_profile_read_failed", error);
    return fail("profile_update_failed", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let body: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("invalid_body", 400);
  }

  try {
    const result = await updateAdminAccount({
      sessionUsername: String(admin.sub || ""),
      username: String(body.username || ""),
      email: String(body.email || ""),
      currentPassword: String(body.currentPassword || ""),
      newPassword: String(body.newPassword || ""),
      confirmPassword: String(body.confirmPassword || ""),
    });
    if (!result.ok) {
      const status = result.code === "not_authenticated" ? 401 : 422;
      return fail(result.code, status);
    }

    const message = result.passwordChanged
      ? "تم تحديث كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً"
      : "تم حفظ تعديلات الحساب.";
    const response = NextResponse.json({
      ok: true,
      username: result.username,
      email: result.email,
      passwordChanged: result.passwordChanged,
      message,
    });

    if (result.passwordChanged) {
      response.cookies.set(ADMIN_COOKIE, "", {
        ...authCookieOptions(true),
        maxAge: 0,
        expires: new Date(0),
      });
      return response;
    }

    if (result.username.trim().toLowerCase() !== String(admin.sub || "").trim().toLowerCase()) {
      const token = await signAdminToken(result.username, remembersSession(admin));
      response.cookies.set(ADMIN_COOKIE, token, authCookieOptions(remembersSession(admin)));
    }
    return response;
  } catch (error) {
    console.error("admin_profile_update_failed", error);
    return fail("profile_update_failed", 500);
  }
}
