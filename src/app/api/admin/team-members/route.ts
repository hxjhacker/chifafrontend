import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createTeamMember, listTeamMembers } from "@/lib/server/team-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    return NextResponse.json({ members: await listTeamMembers() });
  } catch (error) {
    console.error("team_members_list_failed", error);
    return NextResponse.json({ detail: "team_members_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const body = (await request.json()) as { name_ar?: string; avatar_color?: string };
    return NextResponse.json(
      await createTeamMember(String(body.name_ar || ""), String(body.avatar_color || "#38bdf8")),
      { status: 201 },
    );
  } catch (error) {
    const detail = error instanceof Error && error.message === "invalid_team_member" ? error.message : "team_member_create_failed";
    return NextResponse.json({ detail }, { status: detail === "invalid_team_member" ? 422 : 500 });
  }
}
