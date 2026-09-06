import { CITIES, resolveCity } from "@/lib/cities";
import { bestFuzzyMatch } from "@/lib/fuzzy";
import { getRegionForCity, regionIdForOfficialCity, UNKNOWN_REGION } from "@/lib/meta-city-regions";

export { getRegionForCity, regionIdForOfficialCity, UNKNOWN_REGION };

export const MANUAL_PRODUCTS = [
  { id: "quran", label: "USB القرآن الكريم كامل", price: 199, slug: "quran", qty: 1 },
  { id: "kids", label: "USB تعليم الأطفال", price: 149, slug: "kids", qty: 1 },
  { id: "music", label: "USB الموسيقى", price: 199, slug: "music", qty: 1 },
  { id: "bundle", label: "عرض خاص (2 مفاتيح USB)", price: 299, slug: "quran", qty: 2 },
] as const;

export const CITY_CHART_COLORS = ["#84bfce", "#e3fb71", "#d050cf", "#6ece55", "#4eaff7", "#22df36", "#f59e0b", "#e11d48", "#0A192F", "#D4AF37"];

export const MOROCCO_REGIONS = [
  { id: "MA01", name: "طنجة - تطوان - الحسيمة", cities: ["طنجة", "تطوان", "الحسيمة", "العرائش", "القصر الكبير", "شفشاون", "وزان", "أصيلة", "الفنيدق", "المضيق", "مرتيل"] },
  { id: "MA02", name: "الشرق", cities: ["وجدة", "الناظور", "بركان", "تاوريرت", "جرسيف", "جرادة", "الدريوش", "زايو"] },
  { id: "MA03", name: "فاس - مكناس", cities: ["فاس", "مكناس", "تازة", "صفرو", "إفران", "أزرو", "الحاجب", "تاونات", "إيموزار كندر", "بهاليل"] },
  { id: "MA04", name: "الرباط - سلا - القنيطرة", cities: ["الرباط", "سلا", "تمارة", "القنيطرة", "سيدي قاسم", "سيدي سليمان", "تيفلت", "الخميسات", "الصخيرات", "سوق الأربعاء", "عين عودة", "سلا الجديدة"] },
  { id: "MA05", name: "بني ملال - خنيفرة", cities: ["بني ملال", "خريبكة", "خنيفرة", "أزيلال", "الفقيه بن صالح", "وادي زم", "قصبة تادلة", "واويزغت"] },
  { id: "MA06", name: "الدار البيضاء - سطات", cities: ["الدار البيضاء", "المحمدية", "سطات", "برشيد", "الجديدة", "بنسليمان", "بوزنيقة", "سيدي بنور", "عين حرودة", "بوسكورة", "مديونة", "النواصر", "حد السوالم"] },
  { id: "MA07", name: "مراكش - آسفي", cities: ["مراكش", "آسفي", "الصويرة", "قلعة السراغنة", "شيشاوة", "اليوسفية"] },
  { id: "MA08", name: "درعة - تافيلالت", cities: ["الرشيدية", "ورزازات", "زاكورة", "تنغير", "أرفود", "كلميمة", "الريش", "الريصاني", "ميدلت"] },
  { id: "MA09", name: "سوس - ماسة", cities: ["أكادير", "تارودانت", "إنزكان", "أيت ملول", "تيزنيت", "أولاد تايمة", "بيوكرى", "تافراوت"] },
  { id: "MA10", name: "كلميم - واد نون", cities: ["كلميم", "طانطان", "سيدي إفني"] },
  { id: "MA11", name: "العيون - الساقية الحمراء", cities: ["العيون", "بوجدور", "السمارة"] },
  { id: "MA12", name: "الداخلة - وادي الذهب", cities: ["الداخلة", "الداخلة الجديدة"] },
] as const;

export type RegionStat = { id: string; name: string; total: number; confirmed: number; unconfirmed: number };

const ARABIC_CITY_TO_REGION = new Map<string, string>();
for (const region of MOROCCO_REGIONS) {
  for (const city of region.cities) ARABIC_CITY_TO_REGION.set(city, region.name);
}

export function regionForCity(city: string) {
  const official = getRegionForCity(city);
  if (official !== UNKNOWN_REGION) return official;

  const resolved = resolveCity(city).ar;
  if (ARABIC_CITY_TO_REGION.has(resolved)) return ARABIC_CITY_TO_REGION.get(resolved)!;
  if (ARABIC_CITY_TO_REGION.has(city)) return ARABIC_CITY_TO_REGION.get(city)!;

  const fuzzyCity = bestFuzzyMatch(city, CITIES, (c) => [c.ar, c.fr, ...c.aliases], 0.6);
  if (fuzzyCity && ARABIC_CITY_TO_REGION.has(fuzzyCity.ar)) return ARABIC_CITY_TO_REGION.get(fuzzyCity.ar)!;

  const regionHit = bestFuzzyMatch(
    city,
    [...MOROCCO_REGIONS],
    (region) => [...region.cities, region.name],
    0.6,
  );
  if (regionHit) return regionHit.name;

  return UNKNOWN_REGION;
}

export function regionIdForName(name: string) {
  return MOROCCO_REGIONS.find((r) => r.name === name)?.id ?? "";
}

export function regionIdForCity(city: string) {
  const official = regionIdForOfficialCity(city);
  if (official) return official;
  return regionIdForName(regionForCity(city));
}

export function regionNameForId(id: string) {
  return MOROCCO_REGIONS.find((r) => r.id === id)?.name ?? UNKNOWN_REGION;
}

const REGION_ZONES: Record<string, string> = {
  MA01: "TNG",
  MA02: "ORI",
  MA03: "FES",
  MA04: "RBT",
  MA05: "BML",
  MA06: "CASA",
  MA07: "MAR",
  MA08: "ERD",
  MA09: "AGA",
  MA10: "GUL",
  MA11: "LAA",
  MA12: "DKH",
};

const CITY_ZONES: Array<[string[], string]> = [
  [["الدار البيضاء", "كازا", "casablanca", "casa", "المحمدية", "زناتة"], "CASA"],
  [["الرباط", "سلا", "تمارة", "rabat", "sale", "salé"], "RBT"],
  [["مراكش", "marrakech", "marrakesh"], "MAR"],
  [["طنجة", "tangier", "tanger"], "TNG"],
  [["أكادير", "agadir"], "AGA"],
  [["فاس", "fes", "fez"], "FES"],
  [["وجدة", "oujda"], "OUJ"],
  [["القنيطرة", "kenitra"], "KEN"],
];

export function expeditionZone(city: string, regionId?: string | null) {
  const needle = (city || "").trim().toLowerCase();
  for (const [aliases, zone] of CITY_ZONES) {
    if (aliases.some((alias) => needle.includes(alias.toLowerCase()))) return zone;
  }
  const id = regionId || regionIdForCity(city);
  return REGION_ZONES[id] || "CASA";
}

export function buildRegionStats(orders: { city: string; status: string; region_id?: string | null }[]): RegionStat[] {
  const map = new Map<string, RegionStat>();
  for (const region of MOROCCO_REGIONS) {
    map.set(region.name, { id: region.id, name: region.name, total: 0, confirmed: 0, unconfirmed: 0 });
  }
  for (const order of orders) {
    const name = order.region_id
      ? MOROCCO_REGIONS.find((r) => r.id === order.region_id)?.name || regionForCity(order.city)
      : regionForCity(order.city);
    const row = map.get(name);
    if (!row) continue;
    row.total += 1;
    if (order.status === "cancelled" || order.status === "new") row.unconfirmed += 1;
    else row.confirmed += 1;
  }
  return MOROCCO_REGIONS.map((r) => map.get(r.name)!);
}
