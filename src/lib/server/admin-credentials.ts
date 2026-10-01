import bcrypt from "bcryptjs";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { adminUsername } from "@/lib/admin-jwt";
import { ensureSchema, getPool } from "@/lib/server/db";

type CredentialRow = {
  username: string;
  password_hash: string;
};

async function storedCredentials(): Promise<CredentialRow | null> {
  await ensureSchema();
  const result = await getPool().query<CredentialRow>(
    "SELECT username, password_hash FROM admin_credentials WHERE id = 1 LIMIT 1",
  );
  return result.rows[0] || null;
}

function sameUsername(given: string, expected: string) {
  return given.trim().toLowerCase() === expected.trim().toLowerCase();
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

export async function updateAdminPassword(username: string, currentPassword: string, newPassword: string) {
  const stored = await storedCredentials();
  const expectedUsername = stored?.username || adminUsername();
  if (!sameUsername(username, expectedUsername)) return false;

  const currentIsValid = stored
    ? await bcrypt.compare(currentPassword, stored.password_hash)
    : await verifyAdminPassword(username, currentPassword);
  if (!currentIsValid) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await getPool().query(
    `INSERT INTO admin_credentials (id, username, password_hash, updated_at)
     VALUES (1, $1, $2, now())
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       updated_at = now()`,
    [expectedUsername, passwordHash],
  );
  return true;
}
