"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Baby, BookOpen, Eye, EyeOff, LineChart, Music } from "lucide-react";
import { ViewsLineChart } from "@/components/admin/ViewsLineChart";
import { cn } from "@/lib/cn";
import type { ViewsObservatoryPayload, ViewRange } from "@/lib/views-observatory";

const EMPTY: ViewsObservatoryPayload = {
  range: "today",
  from: "",
  to: "",
  totals: { all: 0, store: 0, quran: 0, kids: 0, music: 0 },
  trend_pct: 0,
  series: { labels: [], quran: [], kids: [], music: [] },
};

const FILTERS: { id: Exclude<ViewRange, "custom">; label: string }[] = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "الأسبوع" },
  { id: "month", label: "الشهر" },
];

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function ViewsObservatory({ hideAll = false }: { hideAll?: boolean }) {
  const [range, setRange] = useState<ViewRange>("today");
  const [customDate, setCustomDate] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [data, setData] = useState<ViewsObservatoryPayload>(EMPTY);
  const [live, setLive] = useState(true);
  const masked = hideAll || privacy;

  const load = useCallback(async (nextRange: ViewRange, date: string, silent = false) => {
    try {
      const params = new URLSearchParams({ range: nextRange });
      if (nextRange === "custom" && date) params.set("date", date);
      const res = await fetch(`/api/admin/views?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setLive(false);
        return;
      }
      const next = (await res.json()) as ViewsObservatoryPayload;
      setData((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setLive(true);
    } catch {
      if (!silent) setLive(false);
    }
  }, []);

  useEffect(() => {
    void load(range, customDate);
    const timer = window.setInterval(() => {
      void load(range, customDate, true);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [range, customDate, load]);

  function chooseRange(next: Exclude<ViewRange, "custom">) {
    setRange(next);
    setCustomDate("");
  }

  function chooseCustom(value: string) {
    setCustomDate(value);
    if (value) setRange("custom");
  }

  const trend = data.trend_pct ?? 0;
  const trendUp = trend >= 0;

  return (
    <section className="rounded-3xl border border-gold/20 bg-white p-5 shadow-luxury dark:bg-cardDark sm:p-6">
      <div className="flex flex-col gap-4 border-b border-gold/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-royal dark:text-white">
              <LineChart className="h-4 w-4 text-gold" />
              مرصد المشاهدات والأداء
            </h3>
            <p className="mt-0.5 text-[11px] text-royal/60 dark:text-slate-400">
              تحديث فوري للأرقام والزيارات بدون إعادة تحميل
            </p>
          </div>
          <button
            type="button"
            title="إخفاء / إظهار الأرقام"
            aria-label={masked ? "إظهار أرقام المرصد" : "إخفاء أرقام المرصد"}
            onClick={() => setPrivacy((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-cream text-gold transition hover:border-gold dark:bg-brandDark"
          >
            {masked ? <EyeOff className="h-4 w-4 text-moroccoRed" /> : <Eye className="h-4 w-4" />}
          </button>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold",
              live
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-white/10 bg-cream text-royal/50 dark:bg-brandDark dark:text-slate-500",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-ping bg-emerald-400" : "bg-slate-400")} />
            {live ? "متصل (مباشر)" : "غير متصل"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gold/15 bg-cream p-1.5 dark:bg-brandDark">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseRange(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                range === item.id
                  ? "bg-gold text-royal shadow"
                  : "text-royal/60 hover:text-royal dark:text-slate-300 dark:hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="flex items-center border-r border-gold/15 px-1">
            <input
              type="date"
              value={customDate}
              max={todayIso()}
              onChange={(e) => chooseCustom(e.target.value)}
              className={cn(
                "rounded-lg border px-2 py-1 text-xs text-royal outline-none focus:border-gold dark:bg-cardDark dark:text-slate-200",
                range === "custom" ? "border-gold bg-white" : "border-gold/15 bg-white dark:border-white/10",
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="إجمالي الزيارات"
          value={data.totals.all}
          masked={masked}
          icon={<Eye className="h-4 w-4" />}
          gold
          badge={
            <span className={cn("text-[10px] font-bold", trendUp ? "text-emerald-400" : "text-rose-500")}>
              {masked ? "" : `${trendUp ? "+" : ""}${trend}%`}
            </span>
          }
        />
        <MetricCard
          label="USB القرآن الكريم"
          value={data.totals.quran}
          masked={masked}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <MetricCard
          label="USB تعليم الأطفال"
          value={data.totals.kids}
          masked={masked}
          icon={<Baby className="h-4 w-4" />}
        />
        <MetricCard
          label="USB الموسيقى"
          value={data.totals.music}
          masked={masked}
          icon={<Music className="h-4 w-4" />}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-gold/10 bg-cream/70 p-4 shadow-inner dark:bg-brandDark sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-sm font-bold text-royal dark:text-white">
            <LineChart className="h-3.5 w-3.5 text-gold" />
            منحنى تطور مشاهدات المنتجات بمرور الوقت
          </h4>
          <span className="text-[11px] text-royal/50 dark:text-slate-400">وضع التداول الحي (Live Trading)</span>
        </div>
        <div className="relative h-[280px] w-full sm:h-[320px]">
          <ViewsLineChart
            labels={data.series.labels.length ? data.series.labels : ["—"]}
            quran={data.series.quran}
            kids={data.series.kids}
            music={data.series.music}
            hidden={masked}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  masked,
  icon,
  gold,
  badge,
}: {
  label: string;
  value: number;
  masked: boolean;
  icon: ReactNode;
  gold?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-cream/80 p-4 shadow-inner dark:bg-brandDark",
        gold ? "border-gold/20" : "border-gold/10",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-royal/60 dark:text-slate-400">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-white text-gold dark:bg-cardDark">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tabular-nums text-royal dark:text-white">
          {masked ? "••••••" : formatCount(value)}
        </span>
        {badge ?? <span className="text-[10px] font-bold text-royal/40 dark:text-slate-500">مشاهدة</span>}
      </div>
    </div>
  );
}
