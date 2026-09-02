import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const ADMIN_COOKIE = "cg_admin";
export const JWT_ALG = "HS256";
export const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

const FALLBACK_USER = "manager@chifa.com";
const FALLBACK_PASS = "adminpro@";
const FALLBACK_JWT = "204a308d75e24d90b8e47391e1cc9d33b2b08cce2dcd4482a2276542bd346504";

export type AdminJwt = JWTPayload & { role?: string; sub?: string };

export function looksLikeBcrypt(value: string) {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || "").trim() || FALLBACK_USER;
}

export function adminPasswordPlain() {
  const explicit = (process.env.ADMIN_PASSWORD || "").trim();
  if (explicit) return explicit;
  const hashOrPass = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  if (hashOrPass && !looksLikeBcrypt(hashOrPass)) return hashOrPass;
  return FALLBACK_PASS;
}

export function adminPasswordHash() {
  const hash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  return looksLikeBcrypt(hash) ? hash : "";
}

function secretBytes() {
  const secret = (process.env.ADMIN_JWT_SECRET || "").trim() || FALLBACK_JWT;
  return new TextEncoder().encode(secret);
}

export function jwtHours() {
  const n = Number(process.env.ADMIN_JWT_HOURS || 12);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

export function adminAuthConfigured() {
  return Boolean(adminUsername() && (adminPasswordPlain() || adminPasswordHash()));
}

export async function signAdminToken(username: string, remember = false) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(remember ? "30d" : `${jwtHours()}h`)
    .sign(secretBytes());
}

export async function verifyAdminToken(token: string): Promise<AdminJwt | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretBytes(), { algorithms: [JWT_ALG] });
    if (payload.role !== "admin" || !payload.sub) return null;
    return payload as AdminJwt;
  } catch {
    return null;
  }
}

export function authCookieOptions(remember = false) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  if (!remember) return options;
  return {
    ...options,
    maxAge: REMEMBER_MAX_AGE,
    expires: new Date(Date.now() + REMEMBER_MAX_AGE * 1000),
  };
}
