import bcrypt from "bcryptjs";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { adminUsername } from "@/lib/admin-jwt";
import { ensureSchema, getPool } from "@/lib/server/db";

type CredentialRow = {
  username: string;
  password_hash: string;
  email: string;
};

export type AdminProfile = {
  username: string;
  email: string;
};

export type AccountUpdateInput = {
  sessionUsername: string;
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type AccountUpdateResult =
  | { ok: true; username: string; email: string; passwordChanged: boolean }
  | { ok: false; code: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function storedCredentials(): Promise<CredentialRow | null> {
  await ensureSchema();
  const result = await getPool().query<CredentialRow>(
    "SELECT username, password_hash, COALESCE(email, '') AS email FROM admin_credentials WHERE id = 1 LIMIT 1",
  );
  return result.rows[0] || null;
}

function sameUsername(given: string, expected: string) {
  return given.trim().toLowerCase() === expected.trim().toLowerCase();
}

function fallbackEmail(username: string) {
  return username.includes("@") ? username.trim().toLowerCase() : "";
}

export async function adminCredentialsConfigured() {
  try {
    if (await storedCredentials()) return true;
  } catch {
    /* Fall back to environment credentials when the database is unavailable. */
  }
  return Boolean(adminUsername());
}

export async function verifyStoredAdminCredentials(username: string, password: string) {
  let stored: CredentialRow | null = null;
  try {
    stored = await storedCredentials();
  } catch {
    return verifyAdminPassword(username, password);
  }

  if (stored) {
    if (!sameUsername(username, stored.username)) return false;
    return bcrypt.compare(password, stored.password_hash);
  }
  return verifyAdminPassword(username, password);
}

export async function getAdminProfile(sessionUsername: string): Promise<AdminProfile | null> {
  const stored = await storedCredentials();
  if (stored) {
    return {
      username: stored.username,
      email: stored.email.trim() || fallbackEmail(stored.username),
    };
  }
  const username = (sessionUsername || adminUsername()).trim();
  if (!username) return null;
  return { username, email: fallbackEmail(username) };
}

async function currentPasswordMatches(stored: CredentialRow | null, sessionUsername: string, currentPassword: string) {
  if (!currentPassword) return false;
  if (stored) return bcrypt.compare(currentPassword, stored.password_hash);
  if (await verifyAdminPassword(sessionUsername, currentPassword)) return true;
  const envUsername = adminUsername();
  if (!sameUsername(sessionUsername, envUsername)) return verifyAdminPassword(envUsername, currentPassword);
  return false;
}

export async function updateAdminAccount(input: AccountUpdateInput): Promise<AccountUpdateResult> {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const currentPassword = input.currentPassword || "";
  const newPassword = input.newPassword || "";
  const confirmPassword = input.confirmPassword || "";

  if (username.length < 2) return { ok: false, code: "username_required" };
  if (username.length > 120) return { ok: false, code: "username_too_long" };
  if (email && !EMAIL_PATTERN.test(email)) return { ok: false, code: "invalid_email" };
  if ((newPassword || confirmPassword) && (!currentPassword || !newPassword || !confirmPassword)) {
    return { ok: false, code: "password_fields_required" };
  }
  if (newPassword && newPassword.length < 8) return { ok: false, code: "password_too_short" };
  if (newPassword && newPassword !== confirmPassword) return { ok: false, code: "password_mismatch" };
  if (newPassword && currentPassword === newPassword) return { ok: false, code: "password_must_change" };

  const stored = await storedCredentials();
  const currentUsername = stored?.username || (input.sessionUsername || adminUsername()).trim();
  const currentEmail = (stored?.email || fallbackEmail(currentUsername)).trim().toLowerCase();
  const usernameChanged = !sameUsername(username, currentUsername);
  const emailChanged = email !== currentEmail;
  const passwordChanged = Boolean(newPassword);

  if (!usernameChanged && !emailChanged && !passwordChanged && stored) {
    return { ok: true, username: stored.username, email: currentEmail, passwordChanged: false };
  }
  if (!currentPassword) return { ok: false, code: "current_password_required" };

  const valid = await currentPasswordMatches(stored, input.sessionUsername || currentUsername, currentPassword);
  if (!valid) return { ok: false, code: "invalid_current_password" };

  const passwordHash = passwordChanged
    ? await bcrypt.hash(newPassword, 12)
    : stored?.password_hash || (await bcrypt.hash(currentPassword, 12));

  await getPool().query(
    `INSERT INTO admin_credentials (id, username, password_hash, email, updated_at)
     VALUES (1, $1, $2, $3, now())
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       email = EXCLUDED.email,
       updated_at = now()`,
    [username, passwordHash, email],
  );

  return { ok: true, username, email, passwordChanged };
}

export async function updateAdminPassword(username: string, currentPassword: string, newPassword: string) {
  const profile = await getAdminProfile(username);
  if (!profile) return false;
  const result = await updateAdminAccount({
    sessionUsername: username,
    username: profile.username,
    email: profile.email,
    currentPassword,
    newPassword,
    confirmPassword: newPassword,
  });
  return result.ok && result.passwordChanged;
}
