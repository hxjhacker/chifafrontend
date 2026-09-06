const REGION_HUB: Record<string, string> = {
  MA01: "TANGER",
  MA02: "OUJDA",
  MA03: "FES",
  MA04: "RABAT",
  MA05: "BENI MELLAL",
  MA06: "CASA",
  MA07: "MARRAKECH",
  MA08: "ERRACHIDIA",
  MA09: "AGADIR",
  MA10: "GUELMIM",
  MA11: "LAAYOUNE",
  MA12: "DAKHLA",
};

const HUB_CANON: Record<string, string> = {
  casa: "CASA",
  casablanca: "CASA",
  fes: "FES",
  fez: "FES",
  meknes: "MEKNES",
  "beni mellal": "BENI MELLAL",
  "beni-mellal": "BENI MELLAL",
  nador: "NADOR",
  marrakech: "MARRAKECH",
  agadir: "AGADIR",
  tanger: "TANGER",
  tangier: "TANGER",
  tetouan: "TETOUAN",
  rabat: "RABAT",
  oujda: "OUJDA",
  kenitra: "KENITRA",
  safi: "SAFI",
  taza: "TAZA",
  sefrou: "SEFROU",
  errachidia: "ERRACHIDIA",
  tiznit: "TIZNIT",
  "tan tan": "TAN TAN",
  "el jadida": "EL JADIDA",
  "had soualem": "CASA",
  guelmim: "GUELMIM",
  laayoune: "LAAYOUNE",
  dakhla: "DAKHLA",
};

function canonHub(raw: string) {
  const key = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  if (!key) return "";
  if (HUB_CANON[key]) return HUB_CANON[key];
  const compact = key.replace(/\s+/g, "");
  for (const [alias, hub] of Object.entries(HUB_CANON)) {
    if (alias.replace(/\s+/g, "") === compact) return hub;
  }
  const upper = key.toUpperCase();
  return Object.values(HUB_CANON).includes(upper) ? upper : "";
}

export function destinationHub(city: string, shippingCity?: string | null, regionId?: string | null) {
  for (const candidate of [shippingCity, city]) {
    const text = (candidate || "").trim();
    if (!text) continue;
    if (text.includes(" - ")) {
      const hub = canonHub(text.split(" - ").pop() || "");
      if (hub) return hub;
    }
    const dashed = text.match(/[-–]\s*([A-Za-z][A-Za-z \-]*)$/);
    if (dashed) {
      const hub = canonHub(dashed[1]);
      if (hub && hub !== "SAHARA" && hub !== "PORT") return hub;
    }
    const hub = canonHub(text);
    if (hub) return hub;
  }
  const region = (regionId || "").trim().toUpperCase();
  return REGION_HUB[region] || "FES";
}

export function parcelOrderCode(orderId: string) {
  return `ORD-${orderId}`;
}

export function labelDate() {
  return new Intl.DateTimeFormat("fr-MA", {
    timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}
