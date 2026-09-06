import { resolveCity } from "@/lib/cities";
import { bestFuzzyMatch, foldCity } from "@/lib/fuzzy";
import { FALLBACK_META_CITY, isOfficialMetaCity, OFFICIAL_META_CITIES } from "@/lib/meta-livraison-cities";

export function matchOfficialMetaCity(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (isOfficialMetaCity(trimmed)) return trimmed;

  const folded = foldCity(trimmed);
  if (folded) {
    for (const city of OFFICIAL_META_CITIES) {
      if (foldCity(city) === folded || foldCity(city.split(" - ")[0] || "") === folded) {
        return city;
      }
    }
  }

  try {
    const mapped = resolveCity(trimmed).fr;
    if (mapped && isOfficialMetaCity(mapped)) return mapped;
    if (mapped) {
      const mappedFold = foldCity(mapped);
      for (const city of OFFICIAL_META_CITIES) {
        if (foldCity(city) === mappedFold || foldCity(city.split(" - ")[0] || "") === mappedFold) {
          return city;
        }
      }
    }
  } catch {
    /* keep fuzzy fallback */
  }

  return bestFuzzyMatch(trimmed, [...OFFICIAL_META_CITIES], (city) => [city, city.split(" - ")[0] || ""], 0.72) || "";
}

export function officialOrFallback(raw: string) {
  return isOfficialMetaCity(raw) ? raw.trim() : matchOfficialMetaCity(raw) || FALLBACK_META_CITY;
}
