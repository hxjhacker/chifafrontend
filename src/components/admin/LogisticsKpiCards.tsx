"use client";

import { Banknote, Percent, Truck, Wallet } from "lucide-react";
import { LogisticsStatusDoughnut } from "@/components/admin/LogisticsStatusDoughnut";
import { formatMad } from "@/lib/admin";
import type { LogisticsAnalytics } from "@/lib/logistics";
import { cn } from "@/lib/cn";

type Props = {
  data: LogisticsAnalytics;
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

export function LogisticsKpiCards({ data, hidden, onToggleNumbers }: Props) {
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
      <LogisticsStatusDoughnut data={data} />
    </div>
  );
}
