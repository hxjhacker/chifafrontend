export type CityTarifRow = {
  meta_city_id?: string;
  city_name: string;
  delivery_fee: number;
  refusal_fee: number;
  return_fee: number;
  hub_name?: string;
  hub_code?: string;
};

export const DEFAULT_DELIVERY_FEE = 35;
export const DEFAULT_REFUSAL_FEE = 10;
export const DEFAULT_RETURN_FEE = 0;

export function foldCityName(text: string) {
  return (text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u202c]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hubCode(raw?: string | null) {
  return (raw || "").replace(/^HUB\s+/i, "").replace(/\s+/g, " ").trim().toUpperCase();
}

export function buildTarifIndex(rows: CityTarifRow[]) {
  const byFold = new Map<string, CityTarifRow>();
  const byCompact = new Map<string, CityTarifRow>();
  for (const row of rows) {
    const key = foldCityName(row.city_name);
    if (!key) continue;
    byFold.set(key, row);
    byCompact.set(key.replace(/\s+/g, ""), row);
  }
  return { byFold, byCompact };
}

export function findCityTarif(index: ReturnType<typeof buildTarifIndex>, ...names: Array<string | null | undefined>) {
  const seen = new Set<string>();
  for (const name of names) {
    const text = (name || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const folded = foldCityName(text);
    if (!folded) continue;
    const hit = index.byFold.get(folded) || index.byCompact.get(folded.replace(/\s+/g, ""));
    if (hit) return hit;
  }
  return null;
}

export function feesForCity(index: ReturnType<typeof buildTarifIndex>, ...names: Array<string | null | undefined>) {
  const hit = findCityTarif(index, ...names);
  return {
    delivery: hit?.delivery_fee ?? DEFAULT_DELIVERY_FEE,
    refusal: hit?.refusal_fee ?? DEFAULT_REFUSAL_FEE,
    returned: hit?.return_fee ?? DEFAULT_RETURN_FEE,
    mapped: Boolean(hit),
  };
}

let cached: Promise<CityTarifRow[]> | null = null;

export function loadAdminCityTarifs(force = false) {
  if (!cached || force) {
    cached = fetch("/api/admin/city-tarifs", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return [];
        const payload = (await res.json()) as { tarifs?: CityTarifRow[] };
        return payload.tarifs || [];
      })
      .catch(() => []);
  }
  return cached;
}
