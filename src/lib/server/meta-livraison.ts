import { digitsOnly } from "@/lib/phone";
import type { AdminOrder } from "@/lib/admin";
import { FALLBACK_META_CITY, hasArabic, isOfficialMetaCity } from "@/lib/meta-livraison-cities";
import { officialOrFallback } from "@/lib/match-meta-city";

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
  return `ORD-${orderId || "ORDER"}`;
}

function firstNonEmpty(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    const next = String(value ?? "").trim();
    if (next) return next;
  }
  return "";
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
  const destinataire = firstNonEmpty(order.full_name) || "Client";
  const rawCity = firstNonEmpty(order.city);
  let ville = officialOrFallback(firstNonEmpty(order.shipping_city, rawCity));
  if (hasArabic(ville) || !isOfficialMetaCity(ville)) ville = FALLBACK_META_CITY;
  let address = firstNonEmpty(order.full_address, order.address, ville) || "Centre Ville";
  if (rawCity && (hasArabic(rawCity) || !isOfficialMetaCity(rawCity)) && !address.includes(rawCity)) {
    address = `${address} - ${rawCity}`;
  }
  const marchendise = firstNonEmpty(order.pack_label, order.primary_product, order.product_slug) || "Produit";
  const quantity = Math.max(1, Math.round(Number(order.tier_qty || order.primary_qty) || 1));
  const code = parcelCode(order.order_id);
  const note = firstNonEmpty(order.courier_notes, order.driver_comment);
  const payload = {
    destinataire,
    colisStock: false,
    canOpen: true,
    replaceColis: false,
    phone,
    ville,
    address,
    price,
    code,
    marchendise,
    quantity,
    reference: code,
    nom: destinataire,
    fullname: destinataire,
    telephone: phone,
    city: ville,
    adresse: address,
    prix: price,
    crbt: price,
    produit: marchendise,
    product: marchendise,
    commentaire: note,
    note,
    ouverture: true,
    openpackage: true,
  };

  const postUrl = metaLivraisonColisUrl(base);
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": key,
    "X-API-Secret": secret,
  };
  console.log("[DEBUG META LIVRAISON] sending POST", postUrl);
  console.log("[DEBUG META LIVRAISON] payload:", JSON.stringify(payload));
  console.log("[DEBUG META LIVRAISON] sending header names:", Object.keys(headers));
  console.log(`[DEBUG META LIVRAISON] sending key prefix: ${key.slice(0, 6)}..., len=${key.length}`);
  console.log(`[DEBUG META LIVRAISON] sending secret prefix: ${secret.slice(0, 6)}..., len=${secret.length}`);

  const res = await fetch(postUrl, {
    method: "POST",
    cache: "no-store",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const rawBody = await res.text().catch(() => "");
  console.log("STATUS FROM META:", res.status);
  console.log("RAW BODY FROM META:", rawBody);
  console.log("[DEBUG META LIVRAISON] meta response content-type:", res.headers.get("content-type"));
  console.log("[DEBUG META LIVRAISON] meta www-authenticate:", res.headers.get("www-authenticate"));
  const contentType = res.headers.get("content-type") || "";
  let detail: unknown = rawBody;
  if (contentType.toLowerCase().startsWith("application/json")) {
    try {
      detail = rawBody ? JSON.parse(rawBody) : rawBody;
    } catch {
      detail = rawBody;
    }
  }
  const tracking = pickCode(detail, code);
  if (!res.ok) {
    return { ok: false as const, status: res.status, detail, code, raw: detail };
  }
  return { ok: true as const, status: res.status, detail, code: tracking, raw: detail };
}
