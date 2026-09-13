import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import type { AdminProduct } from "@/lib/admin-products";

export type WhatsAppStockTone = "green" | "amber" | "blue";

export type WhatsAppCatalogProduct = {
  slug: string;
  name: string;
  code: string;
  price: number;
  isQuickStock: boolean;
  stockQuantity: number | null;
  stockLabel: string;
  stockTone: WhatsAppStockTone;
  quickProductId: number | null;
};

export type ParsedWhatsAppOrder = {
  customerName: string;
  city: string;
  address: string;
  phone: string;
  price: number | null;
  qty: number;
  qtyFallback: boolean;
  missing: Array<"name" | "city" | "address" | "phone">;
};

const QUICK_FALLBACK: WhatsAppCatalogProduct[] = [
  {
    slug: "alkhatm_alrijali",
    name: "alkhatm alrijali",
    code: "KH01/7513",
    price: 299,
    isQuickStock: true,
    stockQuantity: 79,
    stockLabel: "79",
    stockTone: "green",
    quickProductId: 6005,
  },
  {
    slug: "almisk_alabyad",
    name: "almisk alabyad",
    code: "MSK_01/7513",
    price: 199,
    isQuickStock: true,
    stockQuantity: 22,
    stockLabel: "22",
    stockTone: "green",
    quickProductId: 6107,
  },
  {
    slug: "zit_alfasokh",
    name: "zit alfasokh",
    code: "zital2/7513",
    price: 249,
    isQuickStock: true,
    stockQuantity: 2,
    stockLabel: "2",
    stockTone: "amber",
    quickProductId: 5775,
  },
];

const STORE_FALLBACK: WhatsAppCatalogProduct[] = [
  {
    slug: "quran",
    name: "USB القرآن الكريم",
    code: "USB_QURAN",
    price: 199,
    isQuickStock: false,
    stockQuantity: null,
    stockLabel: "شحن عادي",
    stockTone: "blue",
    quickProductId: null,
  },
  {
    slug: "taalim",
    name: "USB تعليم الأطفال",
    code: "USB_TAALIMI",
    price: 199,
    isQuickStock: false,
    stockQuantity: null,
    stockLabel: "شحن عادي",
    stockTone: "blue",
    quickProductId: null,
  },
  {
    slug: "music",
    name: "USB موسيقى",
    code: "USB_MOSIQII",
    price: 199,
    isQuickStock: false,
    stockQuantity: null,
    stockLabel: "شحن عادي",
    stockTone: "blue",
    quickProductId: null,
  },
];

function quickStockTone(qty: number): WhatsAppStockTone {
  return qty <= 5 ? "amber" : "green";
}

function mergeCatalog(fallback: WhatsAppCatalogProduct[], api: AdminProduct[], quick: boolean): WhatsAppCatalogProduct[] {
  return fallback.map((item) => {
    const hit = api.find(
      (row) =>
        row.slug === item.slug ||
        row.code === item.code ||
        (item.quickProductId != null && row.quick_product_id === item.quickProductId),
    );
    if (!hit) return item;
    const qty = quick ? (hit.stock_quantity ?? item.stockQuantity ?? 0) : null;
    return {
      ...item,
      slug: hit.slug || item.slug,
      code: hit.code || item.code,
      price: hit.default_price > 0 ? hit.default_price : item.price,
      stockQuantity: qty,
      stockLabel: quick ? String(qty ?? 0) : "شحن عادي",
      stockTone: quick ? quickStockTone(qty ?? 0) : "blue",
      quickProductId: hit.quick_product_id ?? item.quickProductId,
    };
  });
}

export function whatsappCatalog(apiProducts: AdminProduct[], quickStock: boolean): WhatsAppCatalogProduct[] {
  const active = apiProducts.filter((row) => row.is_active);
  return mergeCatalog(quickStock ? QUICK_FALLBACK : STORE_FALLBACK, active, quickStock);
}

function toAsciiDigits(raw: string) {
  return (raw || "")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function nationalTenDigits(raw: string) {
  let digits = digitsOnly(toAsciiDigits(raw));
  if (digits.startsWith("00212")) digits = digits.slice(2);
  if (digits.startsWith("212") && digits.length >= 12) digits = `0${digits.slice(3)}`;
  return digits;
}

function parsePrice(raw: string) {
  const cleaned = toAsciiDigits(raw)
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 1) return null;
  return Math.round(value);
}

function parseQty(raw: string): { qty: number; fallback: boolean } {
  const text = toAsciiDigits(raw).trim();
  if (!text) return { qty: 1, fallback: true };
  const match = text.match(/(\d{1,2})/);
  if (!match) return { qty: 1, fallback: true };
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1) return { qty: 1, fallback: true };
  return { qty: Math.min(20, Math.round(value)), fallback: false };
}

export function parseWhatsAppOrderText(raw: string): ParsedWhatsAppOrder {
  const lines = (raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const customerName = lines[0] || "";
  const city = lines[1] || "";
  const address = lines[2] || "";
  const phone = nationalTenDigits(lines[3] || "");
  const price = parsePrice(lines[4] || "");
  const { qty, fallback: qtyFallback } = parseQty(lines[5] || "");

  const missing: ParsedWhatsAppOrder["missing"] = [];
  if (customerName.trim().length < 3) missing.push("name");
  if (city.trim().length < 2) missing.push("city");
  if (address.trim().length < 5) missing.push("address");
  if (!isTenDigitMaPhone(phone)) missing.push("phone");

  return {
    customerName: customerName.trim(),
    city: city.trim(),
    address: address.trim(),
    phone,
    price,
    qty,
    qtyFallback,
    missing,
  };
}

export function whatsappPlaceholder(quickStock: boolean) {
  const price = quickStock ? 299 : 199;
  return `عبد الرحيم التازي
الدار البيضاء
حي مولاي رشيد، زنقة 12، رقم 8
0612345678
${price}
1`;
}
