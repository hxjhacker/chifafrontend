export type AdminProduct = {
  id: string;
  name: string;
  code: string;
  slug: string;
  default_price: number;
  quick_product_id?: number | null;
  is_active: boolean;
};

export function cleanProductCode(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 64);
}

export function generateProductCode(name: string) {
  const latin = String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  if (latin.length >= 3) return latin.slice(0, 24);
  const rand = Math.random().toString(16).slice(2, 7).toUpperCase();
  return `PRD-${rand}`;
}

export function sanitizeProductSlug(raw: string) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return cleaned || "quran";
}

function parseProduct(row: unknown): AdminProduct | null {
  if (!row || typeof row !== "object") return null;
  const item = row as Record<string, unknown>;
  const name = String(item.name || item.name_ar || "").trim();
  const slug = String(item.slug || "").trim();
  const code = cleanProductCode(String(item.code || slug || "")) || slug.toUpperCase();
  if (!name && !code) return null;
  const cents = Number(item.default_price_cents);
  const mad = Number(item.default_price);
  const quickRaw = Number(item.quick_product_id);
  return {
    id: String(item.id || slug || code),
    name: name || code,
    code,
    slug: slug || code.toLowerCase(),
    default_price: Number.isFinite(mad) ? mad : Number.isFinite(cents) ? cents / 100 : 0,
    quick_product_id: Number.isFinite(quickRaw) && quickRaw >= 1 ? Math.trunc(quickRaw) : null,
    is_active: item.is_active !== false,
  };
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const res = await fetch("/api/admin/products", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("products_failed");
  const body = (await res.json().catch(() => ({}))) as { products?: unknown };
  const list = Array.isArray(body.products) ? body.products : Array.isArray(body) ? body : [];
  return list.map(parseProduct).filter((row): row is AdminProduct => Boolean(row));
}

export function productOptionLabel(product: Pick<AdminProduct, "name" | "code">) {
  const code = String(product.code || "").trim();
  const name = String(product.name || "").trim() || code;
  return code && code !== name ? `${name} — ${code}` : name;
}
