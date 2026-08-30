import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const ADMIN_COOKIE = "cg_admin";
export const JWT_ALG = "HS256";

export type AdminJwt = JWTPayload & { role?: string; sub?: string };

function secretBytes() {
  const secret = (process.env.ADMIN_JWT_SECRET || "").trim();
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export function jwtHours() {
  const n = Number(process.env.ADMIN_JWT_HOURS || 12);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

export function adminAuthConfigured() {
  const user = (process.env.ADMIN_USERNAME || "").trim();
  const hash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  const plain = (process.env.ADMIN_PASSWORD || "").trim();
  return Boolean(user && (hash || plain) && secretBytes());
}

export async function signAdminToken(username: string) {
  const key = secretBytes();
  if (!key) throw new Error("admin_jwt_secret_missing");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${jwtHours()}h`)
    .sign(key);
}

export async function verifyAdminToken(token: string): Promise<AdminJwt | null> {
  const key = secretBytes();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [JWT_ALG] });
    if (payload.role !== "admin" || !payload.sub) return null;
    return payload as AdminJwt;
  } catch {
    return null;
  }
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: jwtHours() * 3600,
  };
}
