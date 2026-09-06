import { CITIES, resolveCity } from "@/lib/cities";
import { bestFuzzyMatch, foldCity } from "@/lib/fuzzy";

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

const CITY_TO_REGION = new Map<string, string>();
for (const region of MOROCCO_REGIONS) {
  for (const city of region.cities) CITY_TO_REGION.set(city, region.name);
}

const HUB_TO_REGION: Record<string, string> = {
  fes: "MA03",
  meknes: "MA03",
  sefrou: "MA03",
  taounate: "MA03",
  taza: "MA03",
  "beni mellal": "MA05",
  "beni-mellal": "MA05",
  khenifra: "MA05",
  casa: "MA06",
  "had soualem": "MA06",
  nador: "MA02",
  chefchaouen: "MA01",
  ouazzane: "MA01",
  agadir: "MA09",
  tiznit: "MA09",
  marrakech: "MA07",
  errachidia: "MA08",
  tinghir: "MA08",
};

const REGION_KEYWORDS: Array<[string, string]> = [
  ["imouzzer kandar", "MA03"],
  ["imouzzer-kandar", "MA03"],
  ["ait melloul", "MA09"],
  ["el kelaa", "MA07"],
  ["kelaa des sraghna", "MA07"],
  ["had soualem", "MA06"],
  ["sidi kacem", "MA04"],
  ["sidi slimane", "MA04"],
  ["sidi ifni", "MA10"],
  ["fquih ben salah", "MA05"],
  ["al hoceima", "MA01"],
  ["m diq", "MA01"],
  ["casablanca", "MA06"],
  ["mohammedia", "MA06"],
  ["benslimane", "MA06"],
  ["berrechid", "MA06"],
  ["berrchid", "MA06"],
  ["bouskoura", "MA06"],
  ["mediouna", "MA06"],
  ["el jadida", "MA06"],
  ["settat", "MA06"],
  ["soualem", "MA06"],
  ["marrakech", "MA07"],
  ["chichaoua", "MA07"],
  ["essaouira", "MA07"],
  ["youssoufia", "MA07"],
  ["rehamna", "MA07"],
  ["beni mellal", "MA05"],
  ["khouribga", "MA05"],
  ["khenifra", "MA05"],
  ["ouaouizeght", "MA05"],
  ["fquih", "MA05"],
  ["azilal", "MA05"],
  ["inezgane", "MA09"],
  ["taroudant", "MA09"],
  ["chtouka", "MA09"],
  ["errachidia", "MA08"],
  ["ouarzazate", "MA08"],
  ["tinghir", "MA08"],
  ["zagora", "MA08"],
  ["midelt", "MA08"],
  ["chefchaouen", "MA01"],
  ["tetouan", "MA01"],
  ["tanger", "MA01"],
  ["fnideq", "MA01"],
  ["larache", "MA01"],
  ["asilah", "MA01"],
  ["hoceima", "MA01"],
  ["mdiq", "MA01"],
  ["oujda", "MA02"],
  ["berkane", "MA02"],
  ["driouch", "MA02"],
  ["jerada", "MA02"],
  ["taourirt", "MA02"],
  ["guercif", "MA02"],
  ["figuig", "MA02"],
  ["nador", "MA02"],
  ["meknes", "MA03"],
  ["sefrou", "MA03"],
  ["ifrane", "MA03"],
  ["azrou", "MA03"],
  ["taounate", "MA03"],
  ["bhalil", "MA03"],
  ["imouzzer", "MA03"],
  ["temara", "MA04"],
  ["kenitra", "MA04"],
  ["skhirat", "MA04"],
  ["khemisset", "MA04"],
  ["rabat", "MA04"],
  ["guelmim", "MA10"],
  ["tantan", "MA10"],
  ["tan tan", "MA10"],
  ["boujdour", "MA11"],
  ["tarfaya", "MA11"],
  ["laayoune", "MA11"],
  ["smara", "MA11"],
  ["essmara", "MA11"],
  ["dakhla", "MA12"],
  ["aousserd", "MA12"],
  ["agadir", "MA09"],
  ["tiznit", "MA09"],
  ["tata", "MA09"],
  ["safi", "MA07"],
  ["taza", "MA03"],
  ["fes", "MA03"],
  ["sale", "MA04"],
  ["casa", "MA06"],
  ["zag", "MA10"],
  ["assa", "MA10"],
];

export function regionIdForOfficialCity(city: string) {
  const raw = (city || "").trim();
  if (!raw) return "MA06";
  const hub = raw.includes(" - ") ? foldCity(raw.split(" - ").pop() || "") : "";
  if (hub && HUB_TO_REGION[hub]) return HUB_TO_REGION[hub];
  const folded = foldCity(raw);
  if (!folded) return "MA06";
  for (const [keyword, id] of REGION_KEYWORDS) {
    if (folded.includes(keyword) || (keyword.length >= 5 && keyword.includes(folded))) return id;
  }
  return "";
}

export function regionForCity(city: string) {
  const officialId = regionIdForOfficialCity(city);
  if (officialId) return regionNameForId(officialId);

  const resolved = resolveCity(city).ar;
  if (CITY_TO_REGION.has(resolved)) return CITY_TO_REGION.get(resolved)!;
  if (CITY_TO_REGION.has(city)) return CITY_TO_REGION.get(city)!;

  const fuzzyCity = bestFuzzyMatch(city, CITIES, (c) => [c.ar, c.fr, ...c.aliases], 0.6);
  if (fuzzyCity && CITY_TO_REGION.has(fuzzyCity.ar)) return CITY_TO_REGION.get(fuzzyCity.ar)!;

  const regionHit = bestFuzzyMatch(
    city,
    [...MOROCCO_REGIONS],
    (region) => [...region.cities, region.name],
    0.6,
  );
  if (regionHit) return regionHit.name;

  return "الدار البيضاء - سطات";
}

export function regionIdForName(name: string) {
  return MOROCCO_REGIONS.find((r) => r.name === name)?.id ?? "MA06";
}

export function regionIdForCity(city: string) {
  return regionIdForName(regionForCity(city));
}

export function regionNameForId(id: string) {
  return MOROCCO_REGIONS.find((r) => r.id === id)?.name ?? regionForCity("");
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
