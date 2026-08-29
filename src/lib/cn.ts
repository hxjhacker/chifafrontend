import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIERS = [
  { qty: 1 as const, price: 199, label: "قطعة واحدة", save: 0, badge: null },
  { qty: 2 as const, price: 279, label: "قطعتين", save: 119, badge: "الأكثر طلباً" },
  { qty: 3 as const, price: 349, label: "3 قطع", save: 248, badge: "أفضل قيمة" },
];

export const CROSS_SELL_PRICE = 199;
export const UPSELL_PRICE = 99;

const configuredApi = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const API_URL =
  !configuredApi || configuredApi === "https://api.chifaglow.com" ? "" : configuredApi;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com";
