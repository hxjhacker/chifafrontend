import { NextResponse } from "next/server";
import { accountErrorMessage } from "@/lib/account-errors";
import { ADMIN_COOKIE, authCookieOptions } from "@/lib/admin-jwt";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminProfile, updateAdminAccount } from "@/lib/server/admin-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(detail: string, status: number) {
  return NextResponse.json({ detail, message: accountErrorMessage(detail, status) }, { status });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let body: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("invalid_body", 400);
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (!currentPassword || !newPassword || !confirmPassword) return fail("password_fields_required", 422);
  if (newPassword.length < 8) return fail("password_too_short", 422);
  if (newPassword !== confirmPassword) return fail("password_mismatch", 422);
  if (currentPassword === newPassword) return fail("password_must_change", 422);

  try {
    const profile = await getAdminProfile(String(admin.sub || ""));
    if (!profile) return fail("not_authenticated", 401);
    const changed = await updateAdminAccount({
      sessionUsername: String(admin.sub || ""),
      username: profile.username,
      email: profile.email,
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!changed.ok) return fail(changed.code, changed.code === "not_authenticated" ? 401 : 422);

    const response = NextResponse.json({
      ok: true,
      passwordChanged: true,
      message: "تم تحديث كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً",
    });
    response.cookies.set(ADMIN_COOKIE, "", {
      ...authCookieOptions(true),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error("admin_password_update_failed", error);
    return fail("password_update_failed", 500);
  }
}
