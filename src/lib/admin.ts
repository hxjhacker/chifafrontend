export type AdminStatus = "new" | "confirmed" | "shipped" | "delivered" | "returned" | "cancelled";

export type AdminCarrier = "meta_livraison" | "quick_livraison" | "force_log";

export const ADMIN_CARRIERS: { id: AdminCarrier; label: string; enabled: boolean }[] = [
  { id: "meta_livraison", label: "Meta Livraison", enabled: true },
  { id: "quick_livraison", label: "Quick Livraison", enabled: true },
  { id: "force_log", label: "Force Log", enabled: false },
];

export function carrierLabel(carrier?: string | null) {
  const hit = ADMIN_CARRIERS.find((row) => row.id === carrier);
  return hit?.label || "Meta Livraison";
}

/** Verified Quick warehouse SKUs */
export const QUICK_STOCK_PRODUCTS = {
  zit_alfasokh: { id: 5775, code: "zital2/7513" },
  alkhatm_alrijali: { id: 6005, code: "KH01/7513" },
  almisk_alabyad: { id: 6107, code: "MSK_01/7513" },
} as const;

/** @deprecated Use order.quick_product_id from the catalog instead of this KH01 fallback. */
export const QUICK_STOCK_KH01_PRODUCT_ID = 6005;

export type DeliveryWindow = "anytime" | "morning" | "afternoon" | "weekend";

export type AdminOrder = {
  order_id: string;
  created_at: string | null;
  full_name: string;
  city: string;
  shipping_city?: string | null;
  phone: string;
  phone_national: string;
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
  pack_label: string;
  total: number;
  currency: string;
  status: AdminStatus;
  raw_status: string;
  address: string | null;
  quartier: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  delivery_window: DeliveryWindow | null;
  courier_notes: string | null;
  region_id: string | null;
  bundle_enabled: boolean;
  secondary_qty: number;
  full_address: string | null;
  region: string | null;
  primary_product: string;
  primary_qty: number;
  secondary_product: string | null;
  driver_comment: string | null;
  total_price: number;
  source: string | null;
  updated_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  meta_livraison_code?: string | null;
  meta_livraison_sent_at?: string | null;
  meta_livraison_ticket_url?: string | null;
  carrier?: AdminCarrier;
  tracking_number?: string | null;
  code_envoi?: string | null;
  product_code?: string | null;
  quick_product_id?: number | null;
  is_quick_stock?: boolean | null;
  stock_quantity?: number | null;
  carrier_status?: string | null;
  dispatched_at?: string | null;
  shipping_cost?: number | null;
  can_open?: boolean | null;
};

export type AdminStats = {
  revenue: number;
  currency: string;
  new_orders: number;
  confirmed_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  confirmation_rate: number;
  total_orders: number;
  city_breakdown: { city: string; count: number }[];
};

export const ADMIN_STATUSES: {
  id: AdminStatus;
  label: string;
  tone: string;
  selectClass: string;
}[] = [
  {
    id: "new",
    label: "جديدة",
    tone: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40",
    selectClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  {
    id: "confirmed",
    label: "تم التأكيد",
    tone: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-400/40",
    selectClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  {
    id: "shipped",
    label: "قيد الشحن",
    tone: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:border-violet-400/40",
    selectClass: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
  {
    id: "delivered",
    label: "تم التسليم",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-400/40",
    selectClass: "bg-emeraldCustom/10 text-emeraldCustom border-emeraldCustom/30",
  },
  {
    id: "returned",
    label: "مرتجع",
    tone: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-400/15 dark:text-orange-200 dark:border-orange-400/40",
    selectClass: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
  {
    id: "cancelled",
    label: "ملغاة",
    tone: "bg-red-100 text-red-800 border-red-300 dark:bg-red-400/15 dark:text-red-200 dark:border-red-400/40",
    selectClass: "bg-moroccoRed/10 text-moroccoRed border-moroccoRed/30",
  },
];

export const PACK_NAMES: Record<string, string> = {
  quran: "USB القرآن",
  taalim: "USB التعليمي",
  music: "USB الموسيقى",
  zit_alfasokh: "زيت الفسوخ",
  alkhatm_alrijali: "الخاتم الرجالي",
  almisk_alabyad: "المسك الأبيض",
  kids: "USB تعليم الأطفال",
  educative: "الفلاشة التعليمية الذكية",
  extra: "مفتاح إضافي بسعر العرض",
  "pack-royal-power": "الباك الملكي المتكامل",
  "pack-royal": "الباك الملكي المتكامل",
};

export const NEW_EQUIV = new Set(["pending", "upsell_accepted", "new"]);

export const STATUS_TRANSITIONS: Record<AdminStatus, readonly AdminStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned", "cancelled"],
  delivered: [],
  returned: [],
  cancelled: ["new", "confirmed"],
};

export function displayStatus(raw: string): AdminStatus {
  if (NEW_EQUIV.has(raw) || raw === "new") return "new";
  if (raw === "in_shipping") return "shipped";
  if (raw === "confirmed" || raw === "shipped" || raw === "delivered" || raw === "returned" || raw === "cancelled") {
    return raw;
  }
  return "new";
}

export const LABEL_PRINT_HINT =
  "يجب إرسال الطلبية إلى Meta Livraison أولاً للحصول على رقم التتبع قبل الطباعة.";

export function quickClientCode(orderId?: string | null) {
  const id = String(orderId || "").trim();
  return id ? `CFG-${id.slice(0, 8)}` : "";
}

export function isDummyParcelCode(code?: string | null) {
  return String(code || "").trim().toUpperCase().startsWith("PARCEL_");
}

export function displayTrackingCode(order: {
  carrier?: string | null;
  meta_livraison_code?: string | null;
  tracking_number?: string | null;
  order_id?: string | null;
}) {
  const stored = String(order.meta_livraison_code || order.tracking_number || "").trim();
  if ((order.carrier || "") === "quick_livraison" && isDummyParcelCode(stored)) {
    return quickClientCode(order.order_id) || stored;
  }
  return stored;
}

export function hasTracking(order: { meta_livraison_code?: string | null; tracking_number?: string | null }): boolean {
  return Boolean((order.meta_livraison_code || order.tracking_number || "").trim());
}

export function carrierTrackingUrl(order: {
  carrier?: string | null;
  meta_livraison_code?: string | null;
  tracking_number?: string | null;
  meta_livraison_ticket_url?: string | null;
  order_id?: string | null;
}): string | null {
  const ticket = String(order.meta_livraison_ticket_url || "").trim();
  if (ticket) return ticket;
  const code = displayTrackingCode(order);
  if (!code) return null;
  if ((order.carrier || "meta_livraison") === "quick_livraison") {
    return `https://clients.quicklivraison.ma/tracking/${encodeURIComponent(code)}`;
  }
  return null;
}

export function allowedNextStatuses(current: AdminStatus): AdminStatus[] {
  return [...(STATUS_TRANSITIONS[current] || [])];
}

export function canTransitionStatus(from: string, to: string): boolean {
  const current = displayStatus(from);
  const next = displayStatus(to);
  if (current === next) return true;
  return allowedNextStatuses(current).includes(next);
}

export function assertStatusTransition(from: string, to: string) {
  if (!canTransitionStatus(from, to)) throw new Error("invalid_status_transition");
}

type AddressParts = {
  full_name?: string | null;
  city?: string | null;
  phone?: string | null;
  phone_national?: string | null;
  address?: string | null;
  full_address?: string | null;
  quartier?: string | null;
  street?: string | null;
  building?: string | null;
  landmark?: string | null;
};

export function hasCompleteConfirmDetails(order: AddressParts): boolean {
  const name = (order.full_name || "").trim();
  const city = (order.city || "").trim();
  const phone = (order.phone || order.phone_national || "").trim();
  const address = detailedAddress(order).trim();
  if (name.length < 3 || city.length < 2 || !phone || address.length < 8) return false;
  const rest = address.split(city).join(" ").replace(/[،,.\-\s]/g, "");
  return rest.length >= 5;
}

export function needsConfirmModal(order: AddressParts & { status: string }, next: AdminStatus): boolean {
  if (displayStatus(next) !== "confirmed") return false;
  const from = displayStatus(order.status);
  if (from !== "new" && from !== "cancelled") return false;
  return !hasCompleteConfirmDetails(order);
}

export function packLabel(order: {
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
}) {
  const primary =
    order.product_slug === "pack-royal-power" || order.product_slug === "pack-royal"
      ? PACK_NAMES[order.product_slug]
      : `${PACK_NAMES[order.product_slug] || order.product_slug} × ${order.tier_qty}`;
  const parts = [primary];
  if (order.cross_sell_slug) parts.push(PACK_NAMES[order.cross_sell_slug] || order.cross_sell_slug);
  if (order.upsell_slug) parts.push(`${PACK_NAMES[order.upsell_slug] || order.upsell_slug} (عرض)`);
  return parts.join(" + ");
}

export function orderLineItems(order: AdminOrder) {
  const lines: { label: string; qty: number }[] = [
    {
      label: PACK_NAMES[order.product_slug] || order.product_slug,
      qty: Math.max(1, order.tier_qty || order.primary_qty || 1),
    },
  ];
  const extraSlug = order.cross_sell_slug || order.secondary_product;
  if (order.bundle_enabled || extraSlug) {
    lines.push({
      label: PACK_NAMES[extraSlug || "extra"] || extraSlug || "عرض إضافي",
      qty: Math.max(1, order.secondary_qty || 1),
    });
  }
  if (order.upsell_slug && order.upsell_slug !== extraSlug) {
    lines.push({ label: PACK_NAMES[order.upsell_slug] || order.upsell_slug, qty: 1 });
  }
  return lines;
}

export function sourceLabel(source: string | null | undefined) {
  if (source === "admin") return "واتساب / لوحة التحكم";
  if (source === "website") return "الموقع";
  return source || "الموقع";
}

export function detailedAddress(order: {
  address?: string | null;
  full_address?: string | null;
  quartier?: string | null;
  street?: string | null;
  building?: string | null;
  landmark?: string | null;
}) {
  const stored = (order.address || order.full_address || "").trim();
  if (stored) return stored;
  const bits = [order.quartier, order.street, order.building, order.landmark]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return bits.join("، ");
}

export const DEFAULT_DRIVER_NOTES = "الاتصال قبل الوصول / فتح المعاينة قبل الأداء";

export const STORE_CONTACT = {
  name: "CHIFAGLOW",
  nameAr: "شيفا جلو",
  tagline: "فلاشات القرآن والتعليم — الدفع عند الاستلام",
  phone: "06 20 86 38 95",
  phoneE164: "+212 620 86 38 95",
  site: "chifaglow.com",
};

export function statusMeta(id: AdminStatus) {
  return ADMIN_STATUSES.find((s) => s.id === id) ?? ADMIN_STATUSES[0];
}

export function formatMad(value: number) {
  return `${Math.round(value).toLocaleString("fr-MA")} درهم`;
}

export function shortOrderRef(id: string) {
  return `#CFG-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function pct(part: number, total: number) {
  if (!total) return "0.00%";
  return `${((part / total) * 100).toFixed(2)}%`;
}

export function formatStamp(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-MA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function whatsappDigits(phone: string) {
  const d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("212") && d.length >= 12) return d;
  if (d.startsWith("0") && d.length === 10) return `212${d.slice(1)}`;
  if (d.length === 9) return `212${d}`;
  return d;
}

export function telHref(phone: string) {
  const d = whatsappDigits(phone);
  return d ? `tel:+${d}` : `tel:${phone}`;
}

export function waHref(phone: string, name: string, product?: string, city?: string) {
  const d = whatsappDigits(phone);
  const productBit = product ? ` ديال ${product}` : "";
  const cityBit = city ? ` للمدينة ديال ${city}` : "";
  const text = encodeURIComponent(
    `السلام عليكم ${name}، معكم شيفا جلو. بغينا نأكدو طلبية${productBit}${cityBit}. واش تقدرو تؤكدو لينا العنوان ووقت التوصيل؟ شكرا.`,
  );
  return `https://wa.me/${d}?text=${text}`;
}

function csvCell(value: string | number) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ordersToCsv(orders: AdminOrder[]) {
  const header = [
    "Order ID",
    "Timestamp",
    "Customer Name",
    "City",
    "Phone",
    "Pack",
    "Total MAD",
    "Status",
    "Address",
    "Quartier",
    "Street",
    "Building",
    "Landmark",
    "Delivery Window",
    "Courier Notes",
  ];
  const lines = [
    header.join(","),
    ...orders.map((o) =>
      [
        csvCell(o.order_id),
        csvCell(o.created_at || ""),
        csvCell(o.full_name),
        csvCell(o.city),
        csvCell(o.phone_national || o.phone),
        csvCell(o.pack_label),
        csvCell(o.total),
        csvCell(statusMeta(o.status).label),
        csvCell(o.address || ""),
        csvCell(o.quartier || ""),
        csvCell(o.street || ""),
        csvCell(o.building || ""),
        csvCell(o.landmark || ""),
        csvCell(o.delivery_window || ""),
        csvCell(o.courier_notes || ""),
      ].join(","),
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function copyablePhone(order: { phone: string; phone_national: string }) {
  const raw = order.phone_national || order.phone || "";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("212") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(0, 10);
  return raw;
}

export function cloneOrderCreatePayload(order: AdminOrder) {
  return {
    full_name: order.full_name,
    phone: copyablePhone(order),
    city: order.city,
    address: detailedAddress(order) || order.address || "",
    region_id: order.region_id || order.region || "",
    product_slug: order.product_slug,
    tier_qty: Math.max(1, order.tier_qty || order.primary_qty || 1),
    total_mad: Number(order.total ?? order.total_price) || 0,
    status: "new" as AdminStatus,
    courier_notes: order.courier_notes || order.driver_comment || "",
    quartier: order.quartier || "",
    street: order.street || "",
    building: order.building || "",
    landmark: order.landmark || "",
    cross_sell_slug: order.cross_sell_slug || order.secondary_product || null,
    bundle_enabled: Boolean(order.bundle_enabled || order.cross_sell_slug || order.secondary_product),
    secondary_qty: Math.max(1, order.secondary_qty || 1),
  };
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
