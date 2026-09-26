"use client";

import { PieChart } from "lucide-react";
import { AdminDoughnut } from "@/components/admin/AdminDoughnut";
import type { LogisticsAnalytics } from "@/lib/logistics";
import { cn } from "@/lib/cn";

type Props = {
  data: LogisticsAnalytics;
};

export function LogisticsStatusDoughnut({ data }: Props) {
  const delivered = data.financial.delivered_count;
  const inTransit = data.financial.in_transit_count;
  const refusedOrCancelled = data.financial.returned_count + data.financial.cancelled_count;
  const total = delivered + inTransit + refusedOrCancelled;
  const labels = ["مسلّم (Livré)", "قيد الشحن (In Transit)", "ملغي / راجع (Refused/Canceled)"];
  const values = [delivered, inTransit, refusedOrCancelled];
  const colors = ["#10B981", "#6366F1", "#E11D48"];

  return (
    <section className="mt-4 rounded-2xl border border-gold/10 bg-cream/70 p-4 dark:bg-brandDark/70">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <PieChart className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-black text-royal dark:text-white">توزيع حالات الطرود</h4>
          <p className="text-[11px] text-royal/60 dark:text-slate-400">حالة جميع الطرود حسب آخر تحديث</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-12">
        <div className="relative mx-auto h-44 w-44 sm:col-span-5">
          <AdminDoughnut
            labels={labels}
            values={values}
            colors={colors}
            cutout="72%"
            showPercentage
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-royal/50 dark:text-slate-400">إجمالي الطرود</span>
            <span className="text-xl font-black text-royal dark:text-gold">{total}</span>
            <span className="text-[10px] font-bold text-royal/50 dark:text-slate-400">
              نسبة التسليم {data.delivery_rate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-2 sm:col-span-7">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-gold/10 bg-white/40 p-2.5 dark:bg-[#0b1322]/60">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-md shadow-sm" style={{ background: colors[index] }} />
                <span className="text-xs font-bold text-royal dark:text-white">{label}</span>
              </div>
              <span className={cn("font-mono text-xs font-black text-royal dark:text-slate-200", !total && "text-slate-500")}>
                {values[index]}{" "}
                <small className="mr-1 font-bold text-emeraldCustom">
                  ({total ? ((values[index] / total) * 100).toFixed(1) : "0.0"}%)
                </small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
