"use client";

import { Banknote, Package, Percent, Trophy, Truck, Wallet } from "lucide-react";
import { LogisticsStatusDoughnut } from "@/components/admin/LogisticsStatusDoughnut";
import { PACK_NAMES, formatMad, type AdminOrder } from "@/lib/admin";
import type { LogisticsAnalytics } from "@/lib/logistics";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/cn";

type Props = {
  data: LogisticsAnalytics;
  orders: AdminOrder[];
  hidden: boolean;
  onToggleNumbers: () => void;
};

function money(value: number, hidden: boolean) {
  return (
    <span className={cn("mt-1 block text-2xl font-black tabular-nums", hidden && "blurred-number")}>
      {formatMad(value)}
    </span>
  );
}

function orderDate(order: AdminOrder) {
  return order.delivered_at || order.updated_at || order.created_at;
}

function monthKey(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  if (!key) return "لا توجد بيانات";
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("ar-MA", { month: "short", year: "numeric" }).format(date);
}

function deliveredMonthStats(orders: AdminOrder[]) {
  const buckets = new Map<string, number>();
  for (const order of orders) {
    if (order.status !== "delivered") continue;
    const key = monthKey(orderDate(order));
    if (!key) continue;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const current = new Date();
  const currentKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
  const currentCount = buckets.get(currentKey) || 0;
  const peak = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0] || ["", 0];

  return {
    currentKey,
    currentCount,
    peakKey: peak[0],
    peakCount: peak[1],
    gauge: peak[1] ? Math.min(100, Math.round((currentCount / peak[1]) * 100)) : 0,
  };
}

function productVisual(slug: string) {
  const product = PRODUCTS.find((item) => item.slug === slug);
  return {
    title: PACK_NAMES[slug] || product?.nameAr || slug || "منتج غير محدد",
    image: product?.image || product?.heroImage || "",
    initials: (PACK_NAMES[slug] || slug || "CG").slice(0, 2).toUpperCase(),
  };
}

function productRows(orders: AdminOrder[]) {
  const rows = new Map<string, { slug: string; total: number; delivered: number }>();

  for (const order of orders) {
    const slugs = [order.product_slug, order.cross_sell_slug, order.upsell_slug].filter(Boolean) as string[];
    for (const slug of new Set(slugs)) {
      const row = rows.get(slug) || { slug, total: 0, delivered: 0 };
      row.total += 1;
      if (order.status === "delivered") row.delivered += 1;
      rows.set(slug, row);
    }
  }

  return [...rows.values()]
    .map((row) => ({ ...row, rate: row.total ? Math.round((row.delivered / row.total) * 1000) / 10 : 0, ...productVisual(row.slug) }))
    .sort((a, b) => b.total - a.total || b.rate - a.rate)
    .slice(0, 6);
}

function DeliveredRecordGauge({ orders, hidden }: { orders: AdminOrder[]; hidden: boolean }) {
  const stats = deliveredMonthStats(orders);
  const stroke = stats.gauge >= 75 ? "#10B981" : stats.gauge >= 45 ? "#F59E0B" : "#E11D48";

  return (
    <section className="h-full rounded-2xl border border-gold/10 bg-cream/70 p-4 shadow-[0_0_32px_-24px_rgba(251,191,36,0.8)] dark:border-slate-800/80 dark:bg-brandDark/70">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emeraldCustom/10 text-emeraldCustom">
          <Trophy className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-black text-royal dark:text-white">الرقم القياسي للطرود المسلمة</h4>
          <p className="text-[11px] text-royal/60 dark:text-slate-400">مقارنة الشهر الحالي بأفضل شهر</p>
        </div>
      </div>

      <div className="relative mx-auto mt-2 h-32 max-w-[240px]">
        <svg viewBox="0 0 220 130" className="h-full w-full overflow-visible" aria-hidden>
          <path d="M25 110 A85 85 0 0 1 195 110" fill="none" stroke="rgba(148,163,184,0.24)" strokeLinecap="round" strokeWidth="18" />
          <path
            d="M25 110 A85 85 0 0 1 195 110"
            fill="none"
            pathLength={100}
            stroke={stroke}
            strokeDasharray={`${stats.gauge} 100`}
            strokeLinecap="round"
            strokeWidth="18"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <span className={cn("block text-3xl font-black tabular-nums text-royal dark:text-white", hidden && "blurred-number")}>
            {stats.currentCount}
          </span>
          <span className="text-[11px] font-bold text-royal/50 dark:text-slate-400">مسلمة هذا الشهر</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-emeraldCustom/20 bg-emeraldCustom/10 p-2.5">
          <p className="text-[10px] font-bold text-emeraldCustom">الشهر الحالي</p>
          <p className={cn("mt-1 text-xs font-black text-royal dark:text-white", hidden && "blurred-number")}>
            {monthLabel(stats.currentKey)} · {stats.currentCount}
          </p>
        </div>
        <div className="rounded-xl border border-gold/20 bg-gold/10 p-2.5">
          <p className="text-[10px] font-bold text-gold">أفضل شهر</p>
          <p className={cn("mt-1 text-xs font-black text-royal dark:text-white", hidden && "blurred-number")}>
            {monthLabel(stats.peakKey)} · {stats.peakCount}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductPerformanceBreakdown({ orders, hidden }: { orders: AdminOrder[]; hidden: boolean }) {
  const rows = productRows(orders);

  return (
    <section className="h-full rounded-2xl border border-gold/10 bg-cream/70 p-4 shadow-[0_0_32px_-24px_rgba(251,191,36,0.8)] dark:border-slate-800/80 dark:bg-brandDark/70">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
          <Package className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-black text-royal dark:text-white">أداء المبيعات حسب المنتج</h4>
          <p className="text-[11px] text-royal/60 dark:text-slate-400">نسبة التسليم لكل منتج نشط</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.slug} className="rounded-xl border border-gold/10 bg-white/40 p-2.5 dark:bg-[#0b1322]/60">
              <div className="flex items-center gap-2.5">
                {row.image ? (
                  <img src={row.image} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-gold/20" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-[10px] font-black text-gold ring-1 ring-gold/20">
                    {row.initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-royal dark:text-white">{row.title}</p>
                    <span className={cn("font-mono text-xs font-black text-royal dark:text-slate-200", hidden && "blurred-number")}>
                      {row.delivered}/{row.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emeraldCustom via-gold to-rose-500 transition-all"
                      style={{ width: `${Math.min(100, row.rate)}%` }}
                    />
                  </div>
                  <p className={cn("mt-1 text-[10px] font-bold text-emeraldCustom", hidden && "blurred-number")}>
                    {row.rate.toFixed(1)}% تسليم
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs font-bold text-royal/50 dark:border-slate-700 dark:text-slate-500">
            لا توجد طلبيات كافية لحساب أداء المنتجات.
          </div>
        )}
      </div>
    </section>
  );
}

export function LogisticsKpiCards({ data, orders, hidden, onToggleNumbers }: Props) {
  const fin = data.financial;
  const closed = data.delivery_rate_denominator;
  const cards = [
    {
      key: "collected",
      label: "المبالغ المحصلة",
      hint: "Livré COD",
      icon: Banknote,
      tone: "text-emeraldCustom",
      chip: "bg-emeraldCustom/15 text-emeraldCustom",
      value: money(fin.total_delivered_amount, hidden),
      meta: `${fin.delivered_count} طلبية مسلّمة`,
    },
    {
      key: "transit",
      label: "المبالغ قيد التوصيل",
      hint: "In Transit COD",
      icon: Truck,
      tone: "text-violet-500",
      chip: "bg-violet-500/15 text-violet-500",
      value: money(fin.in_transit_amount, hidden),
      meta: `${fin.in_transit_count} قيد الشحن`,
    },
    {
      key: "rate",
      label: "نسبة التوصيل الحقيقية",
      hint: "Delivery Rate",
      icon: Percent,
      tone: data.delivery_rate >= 75 ? "text-emeraldCustom" : data.delivery_rate >= 55 ? "text-amber-500" : "text-rose-500",
      chip: data.delivery_rate >= 75 ? "bg-emeraldCustom/15 text-emeraldCustom" : data.delivery_rate >= 55 ? "bg-amber-500/15 text-amber-500" : "bg-rose-500/15 text-rose-500",
      value: (
        <span className={cn("mt-1 block text-2xl font-black tabular-nums", hidden && "blurred-number")}>
          {data.delivery_rate.toFixed(1)}%
        </span>
      ),
      meta: closed ? `${fin.delivered_count} مسلّم / ${closed} مغلق` : "لا توجد طلبيات مغلقة بعد",
    },
    {
      key: "net",
      label: "صافي المستحقات التقديري",
      hint: "Net cash due",
      icon: Wallet,
      tone: fin.net_cash_due >= 0 ? "text-gold" : "text-rose-500",
      chip: "bg-gold/15 text-gold",
      value: money(fin.net_cash_due, hidden),
      meta: `رسوم ${formatMad(fin.estimated_shipping_costs)}`,
    },
  ];

  return (
    <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury dark:bg-cardDark">
      <div className="mb-4 flex items-center justify-between border-b border-gold/10 pb-4">
        <div>
          <h3 className="text-base font-black text-royal dark:text-white">التحصيل والتوصيل</h3>
          <p className="text-[11px] text-royal/60 dark:text-slate-400">
            تسوية COD حسب تعريفة الناقل لكل مدينة (كويك أو ميتا). عند غياب التسعيرة: توصيل {data.delivery_fee} / رفض {data.refusal_fee ?? 10} / إرجاع {data.return_fee} درهم
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleNumbers}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-gold/20 bg-cream px-2.5 text-xs font-bold text-royal/80 transition hover:text-gold dark:bg-brandDark dark:text-slate-300"
        >
          {hidden ? "إظهار الأرقام" : "إخفاء الأرقام"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-gold/10 bg-cream/70 p-4 dark:bg-brandDark/70"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", card.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-royal/40 dark:text-slate-500">
                  {card.hint}
                </span>
              </div>
              <span className="block text-xs font-semibold text-royal/60 dark:text-slate-400">{card.label}</span>
              <div className={card.tone}>{card.value}</div>
              <p className={cn("mt-1 text-[11px] font-bold text-royal/50 dark:text-slate-500", hidden && "blurred-number")}>
                {card.meta}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3" dir="rtl">
        <LogisticsStatusDoughnut data={data} />
        <DeliveredRecordGauge orders={orders} hidden={hidden} />
        <ProductPerformanceBreakdown orders={orders} hidden={hidden} />
      </div>
    </div>
  );
}
