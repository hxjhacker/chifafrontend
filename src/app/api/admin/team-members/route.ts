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
    const body = (await request.json()) as {
      name_ar?: string;
      avatar_color?: string;
      payout_method?: "percentage" | "fixed" | "formula";
      payout_percentage?: number | null;
      payout_fixed_amount?: number | null;
      payout_loss_deduction?: number | null;
      payout_min_order_target?: number | null;
    };
    return NextResponse.json(
      await createTeamMember(String(body.name_ar || ""), String(body.avatar_color || "#38bdf8"), {
        payout_method: body.payout_method,
        payout_percentage: body.payout_percentage == null ? null : Number(body.payout_percentage),
        payout_fixed_amount: body.payout_fixed_amount == null ? null : Number(body.payout_fixed_amount),
        payout_loss_deduction: body.payout_loss_deduction == null ? null : Number(body.payout_loss_deduction),
        payout_min_order_target: body.payout_min_order_target == null ? null : Number(body.payout_min_order_target),
      }),
      { status: 201 },
    );
  } catch (error) {
    const detail = error instanceof Error && error.message === "invalid_team_member" ? error.message : "team_member_create_failed";
    return NextResponse.json({ detail }, { status: detail === "invalid_team_member" ? 422 : 500 });
  }
}
