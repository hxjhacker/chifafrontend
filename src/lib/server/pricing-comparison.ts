import { getRegionForCity, UNKNOWN_REGION } from "@/lib/admin-geo";

export type PricingCity = {
  id: string;
  city_key: string;
  city_name: string;
  city_name_ar: string;
  region?: string;
  delivery_delay: string | null;
  quick_delivery_price: number;
  quick_retour_price: number;
  quick_refus_price: number;
  competitor_name: string;
  competitor_delivery_price: number | null;
  competitor_retour_price: number;
  meta_delivery_fee?: number | null;
  quick_covered?: boolean;
  meta_covered?: boolean;
  quick_total: number;
  competitor_total: number | null;
  savings: number | null;
  cheaper: "quick" | "competitor" | "tie" | "unknown";
};

export type PricingStats = {
  total_cities: number;
  file_cities: number;
  average_delivery_rate: number;
  quick_retour_price: number;
  quick_refus_price: number;
  advantage: string;
  source?: string;
  scraped_at?: string | null;
};

type DbCity = {
  id: string;
  city_key: string;
  city_name: string;
  city_name_ar: string | null;
  delivery_delay: string | null;
  quick_delivery_price: number;
  quick_retour_price: number;
  quick_refus_price: number;
  competitor_name: string | null;
  competitor_delivery_price: number | null;
  competitor_retour_price: number | null;
};

function money(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n * 100) / 100;
}

export function serializePricingCity(row: DbCity): PricingCity {
  const quickDelivery = money(row.quick_delivery_price);
  const competitorDelivery =
    row.competitor_delivery_price == null || row.competitor_delivery_price === undefined
      ? null
      : money(row.competitor_delivery_price);
  const competitorRetour = money(row.competitor_retour_price, 15);
  const quickTotal = quickDelivery;
  const competitorTotal = competitorDelivery;
  let cheaper: PricingCity["cheaper"] = "unknown";
  let savings: number | null = null;
  if (competitorDelivery != null) {
    savings = Math.round((competitorDelivery - quickDelivery) * 100) / 100;
    cheaper = savings > 0 ? "quick" : savings < 0 ? "competitor" : "tie";
  }
  const regionName = getRegionForCity(row.city_name);
  return {
    id: String(row.id),
    city_key: row.city_key,
    city_name: row.city_name,
    city_name_ar: row.city_name_ar || "",
    region: regionName === UNKNOWN_REGION ? "" : regionName,
    delivery_delay: (row.delivery_delay || "").trim() || null,
    quick_delivery_price: quickDelivery,
    quick_retour_price: 0,
    quick_refus_price: 0,
    competitor_name: (row.competitor_name || "Meta Livraison").trim() || "Meta Livraison",
    competitor_delivery_price: competitorDelivery,
    competitor_retour_price: competitorRetour,
    meta_delivery_fee: competitorDelivery,
    quick_covered: true,
    meta_covered: competitorDelivery != null,
    quick_total: quickTotal,
    competitor_total: competitorTotal,
    savings,
    cheaper,
  };
}

export function buildPricingStats(cities: PricingCity[], fileCities = cities.length): PricingStats {
  const avg = cities.length
    ? Math.round((cities.reduce((sum, row) => sum + row.quick_delivery_price, 0) / cities.length) * 100) / 100
    : 0;
  return {
    total_cities: cities.length,
    file_cities: fileCities || cities.length,
    average_delivery_rate: avg,
    quick_retour_price: 0,
    quick_refus_price: 0,
    advantage: "ميزة QuickLivraison: الارجاع (Retour) والرفض (Refus) مجاني 0 درهم لجميع المدن",
  };
}

function foldCity(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const AR_ALIASES: Record<string, string> = {
  casablanca: "الدار البيضاء",
  rabat: "الرباط",
  fes: "فاس",
  fez: "فاس",
  marrakech: "مراكش",
  tanger: "طنجة",
  tangier: "طنجة",
  agadir: "أكادير",
  meknes: "مكناس",
  oujda: "وجدة",
  kenitra: "القنيطرة",
  tetouan: "تطوان",
  sale: "سلا",
  temara: "تمارة",
  mohammedia: "المحمدية",
};

export async function citiesFromQuickJsonFile(): Promise<{ cities: PricingCity[]; stats: ReturnType<typeof buildPricingStats> } | null> {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const candidates = [
    join(process.cwd(), "..", "backend", "app", "data", "quick_pricing.json"),
    join(process.cwd(), "app", "data", "quick_pricing.json"),
    join(process.cwd(), "src", "data", "quick_pricing.json"),
  ];
  for (const file of candidates) {
    try {
      const payload = JSON.parse(await readFile(file, "utf8")) as {
        count?: number;
        cities?: { city?: string; delivery_price_mad?: number; delivery_delay?: string | null }[];
      };
      const seen = new Set<string>();
      const cities: PricingCity[] = [];
      for (const item of payload.cities || []) {
        const cityName = String(item.city || "").trim();
        const cityKey = foldCity(cityName);
        if (!cityName || !cityKey || seen.has(cityKey)) continue;
        seen.add(cityKey);
        const arabic = AR_ALIASES[cityKey] || "";
        const quickDelivery = Number(item.delivery_price_mad) || 0;
        cities.push(
          serializePricingCity({
            id: `json-${cityKey.replace(/\s+/g, "-")}`,
            city_key: cityKey,
            city_name: cityName,
            city_name_ar: arabic,
            delivery_delay: item.delivery_delay || null,
            quick_delivery_price: quickDelivery,
            quick_retour_price: 0,
            quick_refus_price: 0,
            competitor_name: "Meta Livraison",
            competitor_delivery_price: 35,
            competitor_retour_price: 15,
          }),
        );
      }
      if (!cities.length) continue;
      return { cities, stats: buildPricingStats(cities, Number(payload.count) || cities.length) };
    } catch {
      // try next path
    }
  }
  return null;
}
