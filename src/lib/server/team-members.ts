import { randomUUID } from "node:crypto";
import { ensureSchema, getPool } from "@/lib/server/db";

export type TeamMember = {
  id: string;
  name_ar: string;
  avatar_color: string;
  payout_method: "percentage" | "fixed" | "formula";
  payout_percentage: number | null;
  payout_fixed_amount: number | null;
  payout_loss_deduction: number | null;
  payout_min_order_target: number | null;
  is_active: boolean;
  order_count: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_TEAM_MEMBER = "mohammed";

function serialize(row: {
  id: string;
  name_ar: string;
  avatar_color: string;
  payout_method: "percentage" | "fixed" | "formula";
  payout_percentage: number | string | null;
  payout_fixed_amount: number | string | null;
  payout_loss_deduction: number | string | null;
  payout_min_order_target: number | string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  order_count?: number;
}): TeamMember {
  return {
    id: row.id,
    name_ar: row.name_ar,
    avatar_color: row.avatar_color,
    payout_method: row.payout_method,
    payout_percentage: row.payout_percentage == null ? null : Number(row.payout_percentage),
    payout_fixed_amount: row.payout_fixed_amount == null ? null : Number(row.payout_fixed_amount),
    payout_loss_deduction: row.payout_loss_deduction == null ? null : Number(row.payout_loss_deduction),
    payout_min_order_target: row.payout_min_order_target == null ? null : Number(row.payout_min_order_target),
    is_active: row.is_active,
    order_count: Number(row.order_count || 0),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

export async function listTeamMembers(includeInactive = true) {
  await ensureSchema();
  const result = await getPool().query(
    `SELECT tm.id, tm.name_ar, tm.avatar_color, tm.payout_method, tm.payout_percentage, tm.payout_fixed_amount,
            tm.payout_loss_deduction, tm.payout_min_order_target, tm.is_active, tm.created_at, tm.updated_at,
            COUNT(o.id)::int AS order_count
     FROM team_members tm
     LEFT JOIN orders o ON o.assigned_team_member_id = tm.id
     ${includeInactive ? "" : "WHERE tm.is_active = true"}
     GROUP BY tm.id
     ORDER BY tm.is_active DESC, tm.created_at ASC`,
  );
  return result.rows.map(serialize);
}

export async function ensureTeamMemberId(value: string | null | undefined) {
  await ensureSchema();
  const id = String(value || "").trim();
  if (!id) return DEFAULT_TEAM_MEMBER;
  const result = await getPool().query(`SELECT id FROM team_members WHERE id = $1 AND is_active = true LIMIT 1`, [id]);
  return result.rows[0]?.id || DEFAULT_TEAM_MEMBER;
}

export async function createTeamMember(
  name: string,
  avatarColor = "#38bdf8",
  payout: {
    payout_method?: "percentage" | "fixed" | "formula";
    payout_percentage?: number | null;
    payout_fixed_amount?: number | null;
    payout_loss_deduction?: number | null;
    payout_min_order_target?: number | null;
  } = {},
) {
  await ensureSchema();
  const cleanName = name.trim().slice(0, 120);
  if (cleanName.length < 2) throw new Error("invalid_team_member");
  const id = `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member"}-${randomUUID().slice(0, 8)}`;
  const result = await getPool().query(
    `INSERT INTO team_members (
       id, name_ar, avatar_color, payout_method, payout_percentage, payout_fixed_amount,
       payout_loss_deduction, payout_min_order_target
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name_ar, avatar_color, payout_method, payout_percentage, payout_fixed_amount,
       payout_loss_deduction, payout_min_order_target, is_active, created_at, updated_at`,
    [
      id,
      cleanName,
      avatarColor.trim() || "#38bdf8",
      payout.payout_method || "percentage",
      payout.payout_percentage ?? null,
      payout.payout_fixed_amount ?? null,
      payout.payout_loss_deduction ?? null,
      payout.payout_min_order_target ?? null,
    ],
  );
  return serialize(result.rows[0]);
}

export async function updateTeamMember(id: string, patch: {
  name_ar?: string;
  avatar_color?: string;
  is_active?: boolean;
  payout_method?: "percentage" | "fixed" | "formula";
  payout_percentage?: number | null;
  payout_fixed_amount?: number | null;
  payout_loss_deduction?: number | null;
  payout_min_order_target?: number | null;
}) {
  await ensureSchema();
  const name = patch.name_ar == null ? null : patch.name_ar.trim().slice(0, 120);
  if (name !== null && name.length < 2) throw new Error("invalid_team_member");
  const result = await getPool().query(
    `UPDATE team_members
     SET name_ar = COALESCE($2, name_ar),
         avatar_color = COALESCE(NULLIF($3, ''), avatar_color),
         is_active = COALESCE($4, is_active),
         payout_method = COALESCE(NULLIF($5, ''), payout_method),
         payout_percentage = COALESCE($6, payout_percentage),
         payout_fixed_amount = COALESCE($7, payout_fixed_amount),
         payout_loss_deduction = COALESCE($8, payout_loss_deduction),
         payout_min_order_target = COALESCE($9, payout_min_order_target),
         updated_at = now()
     WHERE id = $1
     RETURNING id, name_ar, avatar_color, payout_method, payout_percentage, payout_fixed_amount,
       payout_loss_deduction, payout_min_order_target, is_active, created_at, updated_at`,
    [
      id,
      name,
      patch.avatar_color?.trim() || "",
      patch.is_active ?? null,
      patch.payout_method || "",
      patch.payout_percentage ?? null,
      patch.payout_fixed_amount ?? null,
      patch.payout_loss_deduction ?? null,
      patch.payout_min_order_target ?? null,
    ],
  );
  return result.rows[0] ? serialize(result.rows[0]) : null;
}
