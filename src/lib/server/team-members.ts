import { randomUUID } from "node:crypto";
import { ensureSchema, getPool } from "@/lib/server/db";

export type TeamMember = {
  id: string;
  name_ar: string;
  avatar_color: string;
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
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  order_count?: number;
}): TeamMember {
  return {
    id: row.id,
    name_ar: row.name_ar,
    avatar_color: row.avatar_color,
    is_active: row.is_active,
    order_count: Number(row.order_count || 0),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

export async function listTeamMembers(includeInactive = true) {
  await ensureSchema();
  const result = await getPool().query(
    `SELECT tm.id, tm.name_ar, tm.avatar_color, tm.is_active, tm.created_at, tm.updated_at,
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

export async function createTeamMember(name: string, avatarColor = "#38bdf8") {
  await ensureSchema();
  const cleanName = name.trim().slice(0, 120);
  if (cleanName.length < 2) throw new Error("invalid_team_member");
  const id = `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member"}-${randomUUID().slice(0, 8)}`;
  const result = await getPool().query(
    `INSERT INTO team_members (id, name_ar, avatar_color)
     VALUES ($1, $2, $3)
     RETURNING id, name_ar, avatar_color, is_active, created_at, updated_at`,
    [id, cleanName, avatarColor.trim() || "#38bdf8"],
  );
  return serialize(result.rows[0]);
}

export async function updateTeamMember(id: string, patch: { name_ar?: string; avatar_color?: string; is_active?: boolean }) {
  await ensureSchema();
  const name = patch.name_ar == null ? null : patch.name_ar.trim().slice(0, 120);
  if (name !== null && name.length < 2) throw new Error("invalid_team_member");
  const result = await getPool().query(
    `UPDATE team_members
     SET name_ar = COALESCE($2, name_ar),
         avatar_color = COALESCE(NULLIF($3, ''), avatar_color),
         is_active = COALESCE($4, is_active),
         updated_at = now()
     WHERE id = $1
     RETURNING id, name_ar, avatar_color, is_active, created_at, updated_at`,
    [id, name, patch.avatar_color?.trim() || "", patch.is_active ?? null],
  );
  return result.rows[0] ? serialize(result.rows[0]) : null;
}
