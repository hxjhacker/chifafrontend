import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";

export const WHATSAPP_PRODUCTS = {
  1: { slug: "quran" as const, label: "USB القرآن الكريم" },
  2: { slug: "kids" as const, label: "USB تعليم الأطفال" },
  3: { slug: "music" as const, label: "USB الموسيقى" },
};

export type WhatsAppProductCode = keyof typeof WHATSAPP_PRODUCTS;

export type ParsedWhatsAppOrder = {
  customerName: string;
  city: string;
  address: string;
  phone: string;
  price: number | null;
  productCode: WhatsAppProductCode | null;
  productSlug: "quran" | "kids" | "music";
  productLabel: string;
  qty: number;
  qtyFallback: boolean;
  missing: Array<"name" | "city" | "address" | "phone" | "price" | "product">;
};

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

function parseProductCode(raw: string): WhatsAppProductCode | null {
  const text = toAsciiDigits(raw).trim().toLowerCase();
  if (!text) return null;
  if (/قرآن|quran/.test(text)) return 1;
  if (/أطفال|اطفال|تعليم|kids/.test(text)) return 2;
  if (/موسيقى|موسيقي|أغاني|اغاني|music/.test(text)) return 3;
  const match = text.match(/[123]/);
  if (match) return Number(match[0]) as WhatsAppProductCode;
  return null;
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
  const productCode = parseProductCode(lines[5] || "");
  const { qty, fallback: qtyFallback } = parseQty(lines[6] || "");
  const product = productCode ? WHATSAPP_PRODUCTS[productCode] : WHATSAPP_PRODUCTS[1];

  const missing: ParsedWhatsAppOrder["missing"] = [];
  if (customerName.trim().length < 3) missing.push("name");
  if (city.trim().length < 2) missing.push("city");
  if (address.trim().length < 5) missing.push("address");
  if (!isTenDigitMaPhone(phone)) missing.push("phone");
  if (price == null) missing.push("price");
  if (!productCode) missing.push("product");

  return {
    customerName: customerName.trim(),
    city: city.trim(),
    address: address.trim(),
    phone,
    price,
    productCode,
    productSlug: product.slug,
    productLabel: product.label,
    qty,
    qtyFallback,
    missing,
  };
}

export const WHATSAPP_ORDER_PLACEHOLDER = `عبد الرحيم التازي
الدار البيضاء
حي مولاي رشيد، زنقة 12، رقم 8
0612345678
199
1
2`;
