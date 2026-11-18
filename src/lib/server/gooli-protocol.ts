import { createHmac, timingSafeEqual } from "node:crypto";
import { detailedAddress, gooliExternalRef, orderLineItems, type AdminOrder, type AdminStatus } from "@/lib/admin";
import { digitsOnly } from "@/lib/phone";
import { toGooliCity } from "@/lib/gooli-cities";

export const GOOLI_BATCH_LIMIT = 200;
export const GOOLI_CARRIER = "gooli";
export const WEBHOOK_MAX_SKEW_SEC = 5 * 60;

export type GooliProduct = { name: string; quantity: number };

export type GooliOrderPayload = {
  external_ref: string;
  fullname: string;
  phone: string;
  city: string;
  address: string;
  products: GooliProduct[];
  price: number;
  note: string;
  open_package: true;
};

export type GooliFieldError = {
  external_ref?: string;
  field?: string;
  message: string;
};

export type GooliCreatedRow = {
  external_ref: string;
  tracking_code: string;
};

const TERMINAL: ReadonlySet<AdminStatus> = new Set(["delivered", "returned", "cancelled"]);

export function isGooliCarrier(value: unknown) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return raw === "gooli" || raw === "gooli_express" || raw === "gooliexpress";
}

export function gooliPhone(raw: string | null | undefined): string | null {
  let digits = digitsOnly(String(raw || ""));
  if (digits.startsWith("00212")) digits = digits.slice(5);
  if (digits.startsWith("212") && digits.length >= 12) digits = `0${digits.slice(3, 12)}`;
  else if (digits.length === 9 && "567".includes(digits[0] || "")) digits = `0${digits}`;
  if (digits.length === 10 && digits.startsWith("0") && "567".includes(digits[1] || "")) return digits;
  return null;
}

export function gooliPrice(order: Pick<AdminOrder, "total" | "total_price">) {
  const raw = Number(order.total_price ?? order.total);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw * 100) / 100;
}

export function gooliProducts(order: AdminOrder): GooliProduct[] {
  const lines = orderLineItems(order)
    .map((line) => ({
      name: String(line.label || "").trim() || "Article",
      quantity: Math.max(1, Math.round(Number(line.qty) || 1)),
    }))
    .filter((line) => line.name);
  if (lines.length) return lines;
  const fallback = String(order.pack_label || order.product_slug || "Article").trim() || "Article";
  return [{ name: fallback, quantity: Math.max(1, Math.round(Number(order.tier_qty) || 1)) }];
}

export function buildGooliOrder(order: AdminOrder): { payload: GooliOrderPayload } | { error: GooliFieldError } {
  const externalRef = gooliExternalRef(order.order_id);
  const fullname = String(order.full_name || "").trim();
  if (fullname.length < 3) {
    return { error: { external_ref: externalRef, field: "fullname", message: "اسم المستلم ناقص." } };
  }
  const phone = gooliPhone(order.phone_national || order.phone);
  if (!phone) {
    return {
      error: {
        external_ref: externalRef,
        field: "phone",
        message: "رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 05 أو 06 أو 07.",
      },
    };
  }
  const city = toGooliCity(order.shipping_city || order.city);
  if (!city) {
    const label = String(order.shipping_city || order.city || "").trim() || "بدون مدينة";
    return {
      error: {
        external_ref: externalRef,
        field: "city",
        message: `المدينة غير مطابقة في Gooli: ${label}`,
      },
    };
  }
  const address = detailedAddress(order).trim() || city;
  const note = String(order.courier_notes || order.driver_comment || "").trim();
  return {
    payload: {
      external_ref: externalRef,
      fullname,
      phone,
      city,
      address,
      products: gooliProducts(order),
      price: gooliPrice(order),
      note,
      open_package: true,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function collectRows(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root) return [];
  const buckets = [root.orders, root.data, root.created, root.results, root.items];
  const rows: Record<string, unknown>[] = [];
  for (const bucket of buckets) {
    if (Array.isArray(bucket)) {
      for (const item of bucket) {
        const row = asRecord(item);
        if (row) rows.push(row);
      }
    } else {
      const row = asRecord(bucket);
      if (row && (row.external_ref || row.tracking_code || row.errors)) rows.push(row);
    }
  }
  if (root.external_ref || root.tracking_code) rows.push(root);
  return rows;
}

export function parseGooliErrors(payload: unknown): GooliFieldError[] {
  const root = asRecord(payload);
  const errors: GooliFieldError[] = [];
  const push = (value: unknown, fallbackRef = "") => {
    if (typeof value === "string" && value.trim()) {
      errors.push({ external_ref: fallbackRef || undefined, message: value.trim() });
      return;
    }
    const row = asRecord(value);
    if (!row) return;
    const message = pickString(row, ["message", "error", "detail", "msg"]);
    const field = pickString(row, ["field", "attribute", "key"]);
    const externalRef = pickString(row, ["external_ref", "externalRef", "reference", "ref"]);
    if (Array.isArray(row.errors)) {
      for (const nested of row.errors) push(nested, externalRef || fallbackRef);
      if (message) errors.push({ external_ref: externalRef || fallbackRef || undefined, field: field || undefined, message });
      return;
    }
    if (!message && !field) return;
    errors.push({
      external_ref: externalRef || fallbackRef || undefined,
      field: field || undefined,
      message: message || "رفض Gooli هذه الطلبية.",
    });
  };
  if (root && Array.isArray(root.errors)) {
    for (const item of root.errors) push(item);
  }
  for (const row of collectRows(payload)) {
    if (Array.isArray(row.errors)) push(row);
  }
  const rootMessage = root ? pickString(root, ["message", "error", "detail"]) : "";
  if (!errors.length && rootMessage) errors.push({ message: rootMessage });
  return errors;
}

export function parseGooliCreated(payload: unknown): GooliCreatedRow[] {
  const created: GooliCreatedRow[] = [];
  const seen = new Set<string>();
  for (const row of collectRows(payload)) {
    if (Array.isArray(row.errors) && row.errors.length) continue;
    const externalRef = pickString(row, ["external_ref", "externalRef", "reference", "ref"]).replace(/^#/, "");
    const tracking = pickString(row, ["tracking_code", "trackingCode", "tracking", "code", "barcode", "awb"]);
    if (!externalRef || !tracking) continue;
    const key = `${externalRef}:${tracking}`;
    if (seen.has(key)) continue;
    seen.add(key);
    created.push({ external_ref: externalRef, tracking_code: tracking });
  }
  return created;
}

export function formatGooliErrors(errors: GooliFieldError[]) {
  return errors
    .map((error) => {
      const who = error.external_ref ? `${error.external_ref}: ` : "";
      const field = error.field ? `${error.field} — ` : "";
      return `${who}${field}${error.message}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function foldStatus(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[_./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Map a Gooli status label onto the dashboard status. `null` means "leave unchanged". */
export function mapGooliStatus(raw: string | null | undefined): AdminStatus | null {
  const folded = foldStatus(String(raw || ""));
  if (!folded) return null;
  if (/(hors zone|out of zone|zone non couverte|خارج منطقة)/.test(folded)) return "out_of_zone";
  if (/(retour|returned|returne|مرتجع)/.test(folded)) return "returned";
  if (/(annul|cancel|refus|refuse|ملغ)/.test(folded)) return "cancelled";
  if (/(non livre|pas livre|not delivered)/.test(folded)) return "shipped";
  if (/(ajoute|synced|sync|ramass|exped|distribution|livraison|en cours|en livraison|shipped|nouveau|attente|اضيف|تمت الاضاف)/.test(folded)) {
    return "shipped";
  }
  if (/(?:^|\s)(livre|livree|delivered)(?:\s|$)/.test(folded) || /تم التسليم|تم التوصيل/.test(folded)) return "delivered";
  if (folded === "confirmed" || folded === "confirme") return "confirmed";
  return null;
}

export function shouldApplyGooliStatus(current: AdminStatus, next: AdminStatus) {
  if (current === next) return true;
  if (current === "delivered" && next === "shipped") return false;
  if (current === "delivered" && next === "confirmed") return false;
  if ((current === "returned" || current === "cancelled") && !TERMINAL.has(next) && next !== "delivered") return false;
  return true;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, Buffer.alloc(left.length));
    return false;
  }
  return timingSafeEqual(left, right);
}

function digest(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest();
}

function digestMatches(secret: string, payload: string, presented: string) {
  const mac = digest(secret, payload);
  const token = presented.trim();
  if (!token) return false;
  return safeEqual(mac.toString("hex"), token.toLowerCase()) || safeEqual(mac.toString("base64"), token);
}

function parseSignatureHeader(header: string) {
  const hashes: string[] = [];
  let timestamp = "";
  for (const part of header.split(",")) {
    const piece = part.trim();
    if (!piece) continue;
    const eq = piece.indexOf("=");
    if (eq === -1) {
      hashes.push(piece.replace(/^sha256=/i, ""));
      continue;
    }
    const key = piece.slice(0, eq).trim().toLowerCase();
    const value = piece.slice(eq + 1).trim().replace(/^sha256=/i, "");
    if (key === "t" || key === "ts" || key === "timestamp") timestamp = value;
    else if (value) hashes.push(value);
  }
  return { timestamp, hashes };
}

function epochSeconds(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return null;
    return num > 10_000_000_000 ? Math.floor(num / 1000) : Math.floor(num);
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

function timestampFromBody(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const root = asRecord(parsed);
    if (!root) return "";
    return pickString(root, ["timestamp", "sent_at", "created_at", "createdAt"]);
  } catch {
    return "";
  }
}

export function verifyGooliSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  nowSec?: number;
}) {
  const secret = input.secret.trim();
  const signature = String(input.signatureHeader || "").trim();
  if (!secret || !signature) return false;
  const parsed = parseSignatureHeader(signature);
  const hashes = parsed.hashes.filter(Boolean);
  if (!hashes.length) return false;
  const timestampRaw = parsed.timestamp || String(input.timestampHeader || "").trim() || timestampFromBody(input.rawBody);
  const timestamp = epochSeconds(timestampRaw);
  if (timestamp == null) return false;
  const now = input.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > WEBHOOK_MAX_SKEW_SEC) return false;
  const signed = `${timestamp}.${input.rawBody}`;
  return hashes.some((hash) => digestMatches(secret, signed, hash) || digestMatches(secret, input.rawBody, hash));
}

export function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
