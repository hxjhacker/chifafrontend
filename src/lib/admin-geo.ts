import { resolveCity } from "@/lib/cities";

export const MANUAL_PRODUCTS = [
  { id: "quran", label: "USB القرآن الكريم كامل", price: 199, slug: "quran", qty: 1 },
  { id: "kids", label: "USB تعليم الأطفال", price: 149, slug: "kids", qty: 1 },
  { id: "music", label: "USB الموسيقى", price: 199, slug: "music", qty: 1 },
  { id: "bundle", label: "عرض خاص (2 مفاتيح USB)", price: 299, slug: "quran", qty: 2 },
] as const;

export const CITY_CHART_COLORS = ["#84bfce", "#e3fb71", "#d050cf", "#6ece55", "#4eaff7", "#22df36", "#f59e0b", "#e11d48", "#0A192F", "#D4AF37"];

export const MOROCCO_REGIONS = [
  { name: "طنجة - تطوان - الحسيمة", cities: ["طنجة", "تطوان", "الحسيمة", "العرائش", "القصر الكبير", "شفشاون", "وزان", "أصيلة", "الفنيدق", "المضيق", "مرتيل"] },
  { name: "الشرق", cities: ["وجدة", "الناظور", "بركان", "تاوريرت", "جرسيف", "جرادة", "الدريوش", "زايو"] },
  { name: "فاس - مكناس", cities: ["فاس", "مكناس", "تازة", "صفرو", "إفران", "أزرو", "الحاجب", "تاونات"] },
  { name: "الرباط - سلا - القنيطرة", cities: ["الرباط", "سلا", "تمارة", "القنيطرة", "سيدي قاسم", "سيدي سليمان", "تيفلت", "الخميسات", "الصخيرات", "سوق الأربعاء"] },
  { name: "بني ملال - خنيفرة", cities: ["بني ملال", "خريبكة", "خنيفرة", "أزيلال", "الفقيه بن صالح", "وادي زم", "ميدلت"] },
  { name: "الدار البيضاء - سطات", cities: ["الدار البيضاء", "المحمدية", "سطات", "برشيد", "الجديدة", "بنسليمان", "بوزنيقة", "سيدي بنور", "عين حرودة", "بوسكورة"] },
  { name: "مراكش - آسفي", cities: ["مراكش", "آسفي", "الصويرة", "قلعة السراغنة", "شيشاوة", "اليوسفية"] },
  { name: "درعة - تافيلالت", cities: ["الرشيدية", "ورزازات", "زاكورة", "تنغير", "أرفود", "كلميمة", "الريش"] },
  { name: "سوس - ماسة", cities: ["أكادير", "تارودانت", "إنزكان", "أيت ملول", "تيزنيت", "أولاد تايمة", "بيوكرى"] },
  { name: "كلميم - واد نون", cities: ["كلميم", "طانطان", "سيدي إفني"] },
  { name: "العيون - الساقية الحمراء", cities: ["العيون", "بوجدور", "السمارة"] },
  { name: "الداخلة - وادي الذهب", cities: ["الداخلة"] },
] as const;

export type RegionStat = { name: string; total: number; confirmed: number; unconfirmed: number };

const CITY_TO_REGION = new Map<string, string>();
for (const region of MOROCCO_REGIONS) {
  for (const city of region.cities) CITY_TO_REGION.set(city, region.name);
}

export function regionForCity(city: string) {
  const resolved = resolveCity(city).ar;
  if (CITY_TO_REGION.has(resolved)) return CITY_TO_REGION.get(resolved)!;
  if (CITY_TO_REGION.has(city)) return CITY_TO_REGION.get(city)!;
  const n = (city || "").trim().toLowerCase();
  for (const region of MOROCCO_REGIONS) {
    if (region.cities.some((c) => n.includes(c.toLowerCase()) || c.toLowerCase().includes(n))) return region.name;
  }
  return "الدار البيضاء - سطات";
}

export function buildRegionStats(orders: { city: string; status: string }[]): RegionStat[] {
  const map = new Map<string, RegionStat>();
  for (const region of MOROCCO_REGIONS) {
    map.set(region.name, { name: region.name, total: 0, confirmed: 0, unconfirmed: 0 });
  }
  for (const order of orders) {
    const name = regionForCity(order.city);
    const row = map.get(name);
    if (!row) continue;
    row.total += 1;
    if (order.status === "cancelled") row.unconfirmed += 1;
    else if (order.status === "new") {
      /* pending confirmation — count in total only */
    } else {
      row.confirmed += 1;
    }
  }
  return MOROCCO_REGIONS.map((r) => map.get(r.name)!);
}
