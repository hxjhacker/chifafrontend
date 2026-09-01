import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";

export type ParsedWhatsAppOrder = {
  customerName: string;
  city: string;
  address: string;
  phone: string;
  price: number | null;
  missing: Array<"name" | "city" | "address" | "phone" | "price">;
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

  const missing: ParsedWhatsAppOrder["missing"] = [];
  if (customerName.trim().length < 3) missing.push("name");
  if (city.trim().length < 2) missing.push("city");
  if (address.trim().length < 5) missing.push("address");
  if (!isTenDigitMaPhone(phone)) missing.push("phone");
  if (price == null) missing.push("price");

  return { customerName: customerName.trim(), city: city.trim(), address: address.trim(), phone, price, missing };
}

export const WHATSAPP_ORDER_PLACEHOLDER = `عبد الرحيم التازي
الدار البيضاء
حي مولاي رشيد، زنقة 12، رقم 8
0612345678
199`;
