import { randomUUID } from "crypto";
import { ensureSchema, getPool } from "@/lib/server/db";

export type ProductRow = {
  id: string;
  slug: string;
  code: string;
  name_ar: string;
  name_en: string;
  default_price_cents: number;
  quick_product_id: number | null;
  is_active: boolean;
  created_at: string | Date | null;
};

function cleanCode(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 64);
}

function autoCode(name: string) {
  const latin = String(name || "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  if (latin.length >= 3) return latin.slice(0, 24);
  return `PRD-${randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

function parseQuickProductId(raw: unknown) {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) throw new Error("invalid_quick_product_id");
  return Math.trunc(value);
}

function dump(row: ProductRow) {
  const cents = Number(row.default_price_cents) || 0;
  const quickId = Number(row.quick_product_id);
  return {
    id: String(row.id),
    name: row.name_ar,
    name_ar: row.name_ar,
    name_en: row.name_en,
    code: row.code || String(row.slug || "").toUpperCase(),
    slug: row.slug,
    default_price: Math.round(cents) / 100,
    default_price_cents: cents,
    quick_product_id: Number.isFinite(quickId) && quickId >= 1 ? Math.trunc(quickId) : null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function uniqueValue(column: "code" | "slug", wanted: string, excludeId?: string) {
  const client = await getPool().connect();
  try {
    let candidate = wanted;
    let n = 2;
    while (true) {
      const result = excludeId
        ? await client.query(`SELECT id FROM products WHERE ${column} = $1 AND id::text <> $2 LIMIT 1`, [candidate, excludeId])
        : await client.query(`SELECT id FROM products WHERE ${column} = $1 LIMIT 1`, [candidate]);
      if (!result.rowCount) return candidate;
      const suffix = column === "code" ? `-${n}` : `_${n}`;
      candidate = `${wanted.slice(0, 64 - suffix.length)}${suffix}`;
      n += 1;
    }
  } finally {
    client.release();
  }
}

export function dumpProduct(row: ProductRow) {
  return dump(row);
}

export async function listAdminProducts() {
  await ensureSchema();
  const result = await getPool().query<ProductRow>(
    `SELECT id, slug, code, name_ar, name_en, default_price_cents, quick_product_id, is_active, created_at
     FROM products
     ORDER BY is_active DESC, created_at DESC`,
  );
  return { products: result.rows.map(dump) };
}

export async function createAdminProduct(input: {
  name: string;
  code?: string;
  default_price?: number;
  quick_product_id?: number | string | null;
  is_active?: boolean;
}) {
  const name = String(input.name || "").trim();
  if (name.length < 2) throw new Error("invalid_name");
  await ensureSchema();
  const wanted = cleanCode(input.code || "") || autoCode(name);
  const code = await uniqueValue("code", wanted);
  const slug = await uniqueValue("slug", code.toLowerCase().replace(/-/g, "_"));
  const cents = Math.max(0, Math.round(Number(input.default_price || 0) * 100));
  const quickId = parseQuickProductId(input.quick_product_id);
  const id = randomUUID();
  const result = await getPool().query<ProductRow>(
    `INSERT INTO products (id, slug, code, name_ar, name_en, tagline_ar, description_ar, accent, default_price_cents, quick_product_id, is_active, created_at)
     VALUES ($1, $2, $3, $4, $4, '', '', 'gold', $5, $6, $7, now())
     RETURNING id, slug, code, name_ar, name_en, default_price_cents, quick_product_id, is_active, created_at`,
    [id, slug, code, name, cents, quickId, input.is_active !== false],
  );
  return dump(result.rows[0]);
}

export async function patchAdminProduct(
  productId: string,
  input: { name?: string; code?: string; default_price?: number; quick_product_id?: number | string | null; is_active?: boolean },
) {
  await ensureSchema();
  const current = await getPool().query<ProductRow>(
    `SELECT id, slug, code, name_ar, name_en, default_price_cents, quick_product_id, is_active, created_at FROM products WHERE id::text = $1 LIMIT 1`,
    [productId],
  );
  if (!current.rowCount) throw new Error("product_not_found");
  const row = current.rows[0];
  let name = row.name_ar;
  let code = row.code;
  let slug = row.slug;
  let cents = Number(row.default_price_cents) || 0;
  const storedQuick = Number(row.quick_product_id);
  let quickId = Number.isFinite(storedQuick) && storedQuick >= 1 ? Math.trunc(storedQuick) : null;
  let active = Boolean(row.is_active);
  if (input.name != null) {
    name = String(input.name).trim();
    if (name.length < 2) throw new Error("invalid_name");
  }
  if (input.code != null) {
    const wanted = cleanCode(input.code) || autoCode(name);
    code = await uniqueValue("code", wanted, String(row.id));
    if (!["quran", "kids", "music", "educative", "taalim"].includes(slug)) {
      slug = await uniqueValue("slug", code.toLowerCase().replace(/-/g, "_"), String(row.id));
    }
  }
  if (input.default_price != null) {
    cents = Math.max(0, Math.round(Number(input.default_price) * 100));
  }
  if (input.quick_product_id !== undefined) {
    quickId = parseQuickProductId(input.quick_product_id);
  }
  if (input.is_active != null) active = Boolean(input.is_active);
  const result = await getPool().query<ProductRow>(
    `UPDATE products
     SET name_ar = $2, name_en = CASE WHEN name_en = name_ar OR name_en IS NULL OR name_en = '' THEN $2 ELSE name_en END,
         code = $3, slug = $4, default_price_cents = $5, quick_product_id = $6, is_active = $7
     WHERE id = $1
     RETURNING id, slug, code, name_ar, name_en, default_price_cents, quick_product_id, is_active, created_at`,
    [row.id, name, code, slug, cents, quickId, active],
  );
  return dump(result.rows[0]);
}

export async function deleteAdminProduct(productId: string) {
  await ensureSchema();
  const result = await getPool().query<{ id: string }>(
    `UPDATE products SET is_active = false WHERE id::text = $1 RETURNING id`,
    [productId],
  );
  if (!result.rowCount) throw new Error("product_not_found");
  return { ok: true, id: String(result.rows[0].id), is_active: false };
}

export async function resolveProductSlug(raw: string) {
  const token = String(raw || "").trim();
  if (!token) return "quran";
  try {
    await ensureSchema();
    const code = cleanCode(token);
    const result = await getPool().query<{ slug: string }>(
      `SELECT slug FROM products
       WHERE slug = $1 OR slug = $2 OR code = $3 OR code = $4
       LIMIT 1`,
      [token, token.toLowerCase(), code, token.toUpperCase()],
    );
    if (result.rows[0]?.slug) return result.rows[0].slug;
  } catch {
    // fall through to sanitized token
  }
  return token.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64) || "quran";
}
