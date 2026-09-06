import { digitsOnly } from "@/lib/phone";
import type { AdminOrder } from "@/lib/admin";

const EMPTY_KEYS = new Set(["", "YOUR_API_KEY_HERE", "YOUR_API_SECRET_HERE"]);
const DEFAULT_BASE = "https://api.metalivraison.ma/colis-service";
const COLIS_PATH = "/api/v1/partner/colis";

function clean(value: string | undefined | null) {
  let text = (value || "").trim().replace(/^\uFEFF/, "");
  if (text.length >= 2 && text[0] === text[text.length - 1] && (text[0] === '"' || text[0] === "'")) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

function liveEnv(name: string, fallback = "") {
  return clean(process.env[name] || fallback);
}

export function metaLivraisonApiKey() {
  return liveEnv("META_LIVRAISON_API_KEY");
}

export function metaLivraisonApiSecret() {
  return liveEnv("META_LIVRAISON_API_SECRET");
}

export function metaLivraisonBaseUrl() {
  return liveEnv("META_LIVRAISON_BASE_URL", DEFAULT_BASE).replace(/\/+$/, "");
}

export function metaLivraisonConfigured() {
  const key = metaLivraisonApiKey();
  const secret = metaLivraisonApiSecret();
  return Boolean(key && secret && !EMPTY_KEYS.has(key) && !EMPTY_KEYS.has(secret));
}

export function metaLivraisonColisUrl(base = metaLivraisonBaseUrl()) {
  const trimmed = (base || DEFAULT_BASE).replace(/\/+$/, "");
  if (trimmed.endsWith(COLIS_PATH)) return trimmed;
  return `${trimmed}${COLIS_PATH}`;
}

export function debugMetaLivraisonCredentials() {
  const key = metaLivraisonApiKey();
  const secret = metaLivraisonApiSecret();
  const base = metaLivraisonBaseUrl();
  console.log(`[DEBUG META LIVRAISON] Base URL: ${base}`);
  console.log(`[DEBUG META LIVRAISON] Key length: ${key.length}, Key prefix: ${key.slice(0, 6)}...`);
  console.log(`[DEBUG META LIVRAISON] Secret length: ${secret.length}, Secret prefix: ${secret.slice(0, 6)}...`);
  console.log(`[DEBUG META LIVRAISON] POST URL: ${metaLivraisonColisUrl(base)}`);
}

function nationalPhone(order: AdminOrder) {
  let digits = digitsOnly(order.phone_national || order.phone || "");
  if (digits.startsWith("212") && digits.length >= 12) digits = `0${digits.slice(3)}`;
  else if (digits.length === 9 && "567".includes(digits[0])) digits = `0${digits}`;
  return digits;
}

function parcelCode(orderId: string) {
  return `ORD-${(orderId || "ORDER").slice(0, 8)}-${Math.floor(Date.now() / 1000)}`;
}

function pickCode(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const root = payload as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const colis = nested.colis && typeof nested.colis === "object" ? (nested.colis as Record<string, unknown>) : nested;
  for (const key of ["code", "tracking", "tracking_code", "trackingCode", "num_colis", "numColis", "reference", "ref"]) {
    const value = colis[key] ?? nested[key] ?? root[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

export async function createMetaLivraisonColis(order: AdminOrder) {
  const key = metaLivraisonApiKey();
  const secret = metaLivraisonApiSecret();
  const base = metaLivraisonBaseUrl();
  debugMetaLivraisonCredentials();
  if (!metaLivraisonConfigured()) {
    return { ok: false as const, status: 400, detail: "meta_livraison_not_configured", code: "", raw: null };
  }

  const phone = nationalPhone(order);
  if (!(phone.length === 10 && phone.startsWith("0"))) {
    return {
      ok: false as const,
      status: 400,
      detail: { phone: "must be 10 digits starting with 0", value: phone },
      code: "",
      raw: null,
    };
  }

  const rawPrice = Number(order.total_price || order.total) || 0;
  const price = Number.isInteger(rawPrice) ? rawPrice : Math.round(rawPrice * 100) / 100;
  const ville = (order.city || "").trim();
  const address = (order.full_address || order.address || "").trim() || ville;
  const code = parcelCode(order.order_id);
  const body = {
    code,
    reference: code,
    nom: (order.full_name || "").trim(),
    fullname: (order.full_name || "").trim(),
    telephone: phone,
    phone,
    ville,
    city: ville,
    adresse: address,
    address,
    prix: price,
    price,
    crbt: price,
    produit: order.pack_label,
    product: order.pack_label,
    commentaire: (order.courier_notes || order.driver_comment || "").trim(),
    note: (order.courier_notes || order.driver_comment || "").trim(),
    ouverture: 1,
    openpackage: 1,
  };

  const postUrl = metaLivraisonColisUrl(base);
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": key,
    "X-API-Secret": secret,
  };
  console.log("[DEBUG META LIVRAISON] sending POST", postUrl);
  console.log("[DEBUG META LIVRAISON] sending header names:", Object.keys(headers));
  console.log(`[DEBUG META LIVRAISON] sending key prefix: ${key.slice(0, 6)}..., len=${key.length}`);
  console.log(`[DEBUG META LIVRAISON] sending secret prefix: ${secret.slice(0, 6)}..., len=${secret.length}`);

  const res = await fetch(postUrl, {
    method: "POST",
    cache: "no-store",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  const text = await res.text().catch(() => "");
  console.log("STATUS FROM META:", res.status);
  console.log("RAW BODY FROM META:", text);
  console.log("[DEBUG META LIVRAISON] meta response content-type:", res.headers.get("content-type"));
  console.log("[DEBUG META LIVRAISON] meta www-authenticate:", res.headers.get("www-authenticate"));
  const contentType = res.headers.get("content-type") || "";
  let detail: unknown = text;
  if (contentType.toLowerCase().startsWith("application/json")) {
    try {
      detail = text ? JSON.parse(text) : text;
    } catch {
      detail = text;
    }
  }
  const tracking = pickCode(detail, code);
  if (!res.ok) {
    return { ok: false as const, status: res.status, detail, code, raw: detail };
  }
  return { ok: true as const, status: res.status, detail, code: tracking, raw: detail };
}
