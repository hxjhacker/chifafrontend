import { digitsOnly } from "@/lib/phone";
import type { AdminOrder } from "@/lib/admin";

const DEFAULT_BASE = "https://api.metalivraison.ma/colis-service";

export function metaLivraisonConfigured() {
  const key = (process.env.META_LIVRAISON_API_KEY || "").trim();
  const secret = (process.env.META_LIVRAISON_API_SECRET || "").trim();
  return Boolean(key && secret && key !== "YOUR_API_KEY_HERE" && secret !== "YOUR_API_SECRET_HERE");
}

export function metaLivraisonBaseUrl() {
  return (process.env.META_LIVRAISON_BASE_URL || DEFAULT_BASE).trim().replace(/\/+$/, "");
}

function nationalPhone(order: AdminOrder) {
  const national = digitsOnly(order.phone_national || "");
  if (national.length === 10) return national;
  const raw = digitsOnly(order.phone || "");
  if (raw.length === 10 && raw.startsWith("0")) return raw;
  if (raw.length === 12 && raw.startsWith("212")) return `0${raw.slice(3)}`;
  if (raw.length === 9) return `0${raw}`;
  return national || raw;
}

function pickCode(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
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
  return "";
}

export async function createMetaLivraisonColis(order: AdminOrder) {
  if (!metaLivraisonConfigured()) {
    return { ok: false as const, status: 503, detail: "meta_livraison_not_configured", code: "", raw: null };
  }

  const key = (process.env.META_LIVRAISON_API_KEY || "").trim();
  const secret = (process.env.META_LIVRAISON_API_SECRET || "").trim();
  const price = Math.round(Number(order.total_price || order.total) || 0);
  const phone = nationalPhone(order);
  const address = (order.full_address || order.address || "").trim() || order.city;
  const body = {
    reference: order.order_id,
    nom: order.full_name,
    fullname: order.full_name,
    telephone: phone,
    phone,
    ville: order.city,
    city: order.city,
    adresse: address,
    address,
    prix: price,
    price,
    crbt: price,
    produit: order.pack_label,
    product: order.pack_label,
    commentaire: order.courier_notes || order.driver_comment || "",
    note: order.courier_notes || order.driver_comment || "",
    ouverture: 1,
    openpackage: 1,
  };

  const res = await fetch(metaLivraisonBaseUrl(), {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": key,
      "X-API-Secret": secret,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  const text = await res.text().catch(() => "");
  let raw: unknown = null;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }
  const code = pickCode(raw);
  if (!res.ok) {
    if (res.status === 401) {
      console.error("401 details:", {
        origin: "meta_livraison",
        status: 401,
        hasKey: Boolean(key),
        hasSecret: Boolean(secret),
        error: text || raw,
      });
    } else {
      console.error("meta_livraison_failed", res.status, text || raw);
    }
    return { ok: false as const, status: res.status, detail: text || "meta_livraison_failed", code, raw };
  }

  return { ok: true as const, status: res.status, detail: "", code, raw };
}
