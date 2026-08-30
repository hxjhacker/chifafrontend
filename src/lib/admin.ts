export type AdminStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type AdminOrder = {
  order_id: string;
  created_at: string | null;
  full_name: string;
  city: string;
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
};

export const ADMIN_STATUSES: {
  id: AdminStatus;
  label: string;
  tone: string;
  selectClass: string;
}[] = [
  {
    id: "new",
    label: "جديد",
    tone: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40",
    selectClass: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100",
  },
  {
    id: "confirmed",
    label: "مؤكد",
    tone: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-400/40",
    selectClass: "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100",
  },
  {
    id: "shipped",
    label: "تم الشحن",
    tone: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:border-violet-400/40",
    selectClass: "border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-400/10 dark:text-violet-100",
  },
  {
    id: "delivered",
    label: "تم التسليم",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-400/40",
    selectClass: "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100",
  },
  {
    id: "cancelled",
    label: "ملغى",
    tone: "bg-red-100 text-red-800 border-red-300 dark:bg-red-400/15 dark:text-red-200 dark:border-red-400/40",
    selectClass: "border-red-400 bg-red-50 text-red-900 dark:bg-red-400/10 dark:text-red-100",
  },
];

const PACK_NAMES: Record<string, string> = {
  quran: "USB القرآن الكريم",
  kids: "USB تعليم الأطفال",
  music: "USB الأغاني والموسيقى",
  educative: "الفلاشة التعليمية الذكية",
};

export const NEW_EQUIV = new Set(["pending", "upsell_accepted", "new"]);

export function displayStatus(raw: string): AdminStatus {
  if (NEW_EQUIV.has(raw) || raw === "new") return "new";
  if (raw === "confirmed" || raw === "shipped" || raw === "delivered" || raw === "cancelled") return raw;
  return "new";
}

export function packLabel(order: {
  product_slug: string;
  tier_qty: number;
  cross_sell_slug: string | null;
  upsell_slug: string | null;
}) {
  const parts = [`${PACK_NAMES[order.product_slug] || order.product_slug} × ${order.tier_qty}`];
  if (order.cross_sell_slug) parts.push(PACK_NAMES[order.cross_sell_slug] || order.cross_sell_slug);
  if (order.upsell_slug) parts.push(`${PACK_NAMES[order.upsell_slug] || order.upsell_slug} (عرض)`);
  return parts.join(" + ");
}

export function statusMeta(id: AdminStatus) {
  return ADMIN_STATUSES.find((s) => s.id === id) ?? ADMIN_STATUSES[0];
}

export function formatMad(value: number) {
  return `${Math.round(value).toLocaleString("fr-MA")} د.م.`;
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

export function waHref(phone: string, name: string) {
  const d = whatsappDigits(phone);
  const text = encodeURIComponent(`السلام عليكم ${name}، معكم شيفا جلو بخصوص طلبكم.`);
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
      ].join(","),
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
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
