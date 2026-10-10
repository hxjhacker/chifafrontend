import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateTeamMember } from "@/lib/server/team-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ memberId: string }> }) {
  const denied = await requireAdmin(request);
  if (denied instanceof NextResponse) return denied;
  try {
    const { memberId } = await context.params;
    const body = (await request.json()) as {
      name_ar?: string;
      avatar_color?: string;
      is_active?: boolean;
      payout_method?: "percentage" | "fixed" | "formula";
      payout_percentage?: number | null;
      payout_fixed_amount?: number | null;
      payout_loss_deduction?: number | null;
      payout_min_order_target?: number | null;
    };
    const member = await updateTeamMember(memberId, body);
    if (!member) return NextResponse.json({ detail: "team_member_not_found" }, { status: 404 });
    return NextResponse.json(member);
  } catch (error) {
    const detail = error instanceof Error && error.message === "invalid_team_member" ? error.message : "team_member_update_failed";
    return NextResponse.json({ detail }, { status: detail === "invalid_team_member" ? 422 : 500 });
  }
}
