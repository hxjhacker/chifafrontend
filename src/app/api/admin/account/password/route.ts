import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authCookieOptions } from "@/lib/admin-jwt";
import { requireAdmin } from "@/lib/admin-auth";
import { updateAdminPassword } from "@/lib/server/admin-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ detail: "invalid_body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ detail: "password_fields_required" }, { status: 422 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ detail: "password_too_short" }, { status: 422 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ detail: "password_mismatch" }, { status: 422 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ detail: "password_must_change" }, { status: 422 });
  }

  try {
    const changed = await updateAdminPassword(String(admin.sub || ""), currentPassword, newPassword);
    if (!changed) return NextResponse.json({ detail: "invalid_current_password" }, { status: 401 });

    const response = NextResponse.json({
      ok: true,
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
    return NextResponse.json({ detail: "password_update_failed" }, { status: 500 });
  }
}
