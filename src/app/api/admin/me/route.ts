import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminProfile } from "@/lib/server/admin-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;
  try {
    const profile = await getAdminProfile(String(admin.sub || ""));
    return NextResponse.json({
      ok: true,
      username: profile?.username || admin.sub,
      email: profile?.email || "",
      role: admin.role,
    });
  } catch (error) {
    console.error("admin_me_failed", error);
    return NextResponse.json({ ok: true, username: admin.sub, email: "", role: admin.role });
  }
}
