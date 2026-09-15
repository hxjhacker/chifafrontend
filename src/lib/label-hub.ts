import { displayTrackingCode } from "@/lib/admin";

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

export function destinationHub(city?: string | null, shippingCity?: string | null, regionId?: string | null) {
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

export function parcelOrderCode(orderId?: string | null) {
  const id = String(orderId || "").trim() || "ORDER";
  return `ORD-${id}`;
}

export function labelDate() {
  return new Intl.DateTimeFormat("fr-MA", {
    timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export const META_SENDER = { name: "CHIFA GLOW", account: "7605", phone: "06-20-86-38-95", hub: "FES" };
export const QUICK_SENDER = { name: "chifaglow", account: "7513", phone: "0644183475", hub: "CASA", stock: "STOCK" };

function nationalPhoneDigits(raw: string) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("212") && digits.length >= 12) digits = `0${digits.slice(3, 12)}`;
  else if (digits.startsWith("0") && digits.length >= 10) digits = digits.slice(0, 10);
  else if (digits.length === 9) digits = `0${digits}`;
  return digits;
}

export function formatMetaPhone(raw: string) {
  const national = nationalPhoneDigits(raw);
  if (national.length === 10) {
    return `${national.slice(0, 2)}-${national.slice(2, 4)}-${national.slice(4, 6)}-${national.slice(6, 8)}-${national.slice(8)}`;
  }
  return raw || "—";
}

export function formatQuickPhone(raw: string) {
  const national = nationalPhoneDigits(raw);
  if (national.length === 10) {
    return `${national.slice(0, 2)}-${national.slice(2, 5)}-${national.slice(5, 8)}-${national.slice(8)}`;
  }
  return raw || "—";
}

export function spacedTracking(code: string) {
  return (code || "").trim().split("").join(" ");
}

export function canOpenParcel(order: { can_open?: boolean | null; canOpen?: boolean | null }) {
  const raw = order.can_open ?? order.canOpen;
  return raw === true;
}

export function labelQrValue(order: {
  meta_livraison_ticket_url?: string | null;
  meta_livraison_code?: string | null;
  tracking_number?: string | null;
  order_id?: string | null;
}) {
  return (
    (order.meta_livraison_ticket_url || "").trim() ||
    (order.meta_livraison_code || order.tracking_number || "").trim() ||
    parcelOrderCode(order.order_id)
  );
}

export function trackingCode(order: {
  carrier?: string | null;
  meta_livraison_code?: string | null;
  tracking_number?: string | null;
  order_id?: string | null;
}) {
  return displayTrackingCode(order) || parcelOrderCode(order.order_id);
}

export function merchandiseLines(order: {
  product_slug?: string | null;
  pack_label?: string | null;
  tier_qty?: number | null;
  primary_qty?: number | null;
  cross_sell_slug?: string | null;
  secondary_product?: string | null;
  secondary_qty?: number | null;
  upsell_slug?: string | null;
  bundle_enabled?: boolean;
}) {
  const lines: { sku: string; qty: number }[] = [
    {
      sku: (order.product_slug || order.pack_label || "Produit").trim() || "Produit",
      qty: Math.max(1, Number(order.tier_qty || order.primary_qty) || 1),
    },
  ];
  const extra = (order.cross_sell_slug || order.secondary_product || "").trim();
  if (order.bundle_enabled || extra) {
    lines.push({ sku: extra || "extra", qty: Math.max(1, Number(order.secondary_qty) || 1) });
  }
  const upsell = (order.upsell_slug || "").trim();
  if (upsell && upsell !== extra) lines.push({ sku: upsell, qty: 1 });
  return lines;
}

export function metaMerchandise(order: Parameters<typeof merchandiseLines>[0]) {
  return merchandiseLines(order)
    .map((line) => line.sku)
    .join(" | ");
}

export function quickMerchandise(order: Parameters<typeof merchandiseLines>[0]) {
  return merchandiseLines(order)
    .map((line) => `${line.sku} (${line.qty})`)
    .join(" | ");
}

export function labelAmount(order: { total?: number | null; total_price?: number | null }) {
  return Math.round(Number(order.total ?? order.total_price) || 0);
}
