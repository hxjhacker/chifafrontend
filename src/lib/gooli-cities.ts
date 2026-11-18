import { resolveCity } from "@/lib/cities";

function containsArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

/**
 * Map a dashboard city (usually Arabic) to the Latin name Gooli accepts.
 * Returns null when the name cannot be resolved to a Latin city.
 * Examples: الداخلة → Dakhla, تطوان → Tetouan, آسفي → Safi, الدار البيضاء → Casablanca.
 */
export function toGooliCity(raw: string | null | undefined): string | null {
  const trimmed = String(raw || "").trim();
  if (trimmed.length < 2) return null;
  const latin = resolveCity(trimmed).fr.trim();
  if (!latin || containsArabic(latin)) return null;
  return latin;
}
