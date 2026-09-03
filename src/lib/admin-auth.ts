import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAuthConfigured, adminPasswordHash, adminPasswordPlain, adminUsername, verifyAdminToken } from "./admin-jwt";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

type Bucket = { fails: number[]; lockedUntil: number };
const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number) {
  bucket.fails = bucket.fails.filter((t) => now - t < WINDOW_MS);
  if (bucket.lockedUntil && bucket.lockedUntil <= now) bucket.lockedUntil = 0;
}

export function loginRetryAfter(ip: string) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket) return 0;
  prune(bucket, now);
  return bucket.lockedUntil > now ? Math.ceil((bucket.lockedUntil - now) / 1000) : 0;
}

export function recordLoginFailure(ip: string) {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { fails: [], lockedUntil: 0 };
  prune(bucket, now);
  bucket.fails.push(now);
  if (bucket.fails.length >= MAX_FAILS) bucket.lockedUntil = now + WINDOW_MS;
  buckets.set(ip, bucket);
  return bucket.lockedUntil > now ? Math.ceil((bucket.lockedUntil - now) / 1000) : 0;
}

export function recordLoginSuccess(ip: string) {
  buckets.delete(ip);
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function verifyAdminPassword(username: string, password: string) {
  const expectedUser = adminUsername();
  const hash = adminPasswordHash();
  const plain = adminPasswordPlain();
  if (!expectedUser || (!hash && !plain)) return false;
  if (!safeEqual(username.trim().toLowerCase(), expectedUser.toLowerCase())) {
    await bcrypt.compare(password || "x", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW");
    return false;
  }
  if (hash) {
    try {
      if (await bcrypt.compare(password, hash)) return true;
    } catch {
      /* invalid hash — fall through */
    }
  }
  if (plain) return safeEqual(password, plain);
  return false;
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function cookieFromHeader(header: string | null, name: string) {
  if (!header) return "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return "";
}

export async function readAdminFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const jar = await cookies();
  const token =
    bearer ||
    jar.get(ADMIN_COOKIE)?.value ||
    cookieFromHeader(request.headers.get("cookie"), ADMIN_COOKIE) ||
    "";
  return verifyAdminToken(token);
}

export async function requireAdmin(request: Request) {
  if (!adminAuthConfigured()) {
    return NextResponse.json({ detail: "admin_not_configured" }, { status: 503 });
  }
  const admin = await readAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ detail: "not_authenticated" }, { status: 401 });
  }
  return admin;
}
