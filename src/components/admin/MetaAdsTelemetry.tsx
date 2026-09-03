"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MousePointerClick, RefreshCw, Target, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const USD_TO_MAD = 10;

type MetaInsights = {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  ctr: number;
};

const EMPTY: MetaInsights = { spend: 0, clicks: 0, impressions: 0, cpc: 0, ctr: 0 };

function money(value: number, digits = 2) {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function cpaTone(cpa: number) {
  if (cpa < 25) return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";
  if (cpa <= 45) return "border-amber-400/40 bg-amber-500/10 text-amber-300";
  return "border-rose-500/40 bg-rose-500/10 text-rose-300";
}

export function MetaAdsTelemetry({
  todayOrders,
  hidden = false,
}: {
  todayOrders: number;
  hidden?: boolean;
}) {
  const [data, setData] = useState<MetaInsights>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(true);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/meta-insights", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        setLive(false);
        setData(EMPTY);
        return;
      }
      const next = (await res.json()) as MetaInsights;
      setData({
        spend: Number(next.spend) || 0,
        clicks: Number(next.clicks) || 0,
        impressions: Number(next.impressions) || 0,
        cpc: Number(next.cpc) || 0,
        ctr: Number(next.ctr) || 0,
      });
      setLive(true);
    } catch {
      setLive(false);
      setData(EMPTY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const spendMad = data.spend * USD_TO_MAD;
  const realCpa = spendMad / (todayOrders || 1);

  const busy = loading || refreshing;

  const cards = useMemo(
    () => [
      {
        key: "spend",
        icon: Zap,
        label: "إجمالي الصرف الإعلاني",
        sub: "Live Spend · اليوم",
        body: (
          <>
            <p className={cn("font-mono text-2xl font-black tracking-tight text-white", hidden && "blurred-number")}>
              {money(spendMad)} <span className="text-sm font-bold text-amber-400">MAD</span>
            </p>
            <p className={cn("mt-1 font-mono text-[11px] text-slate-400", hidden && "blurred-number")}>
              ${money(data.spend)} USD
            </p>
          </>
        ),
      },
      {
        key: "cpa",
        icon: Target,
        label: "تكلفة الطلبية الحقيقية",
        sub: `Real CPA · ${todayOrders} طلب اليوم`,
        body: (
          <>
            <p className={cn("font-mono text-2xl font-black tracking-tight text-white", hidden && "blurred-number")}>
              {money(realCpa)} <span className="text-sm font-bold text-slate-400">MAD</span>
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wide",
                cpaTone(realCpa),
              )}
            >
              {realCpa < 25 ? "ممتاز" : realCpa <= 45 ? "متوسط" : "مرتفع"}
            </span>
          </>
        ),
      },
      {
        key: "traffic",
        icon: MousePointerClick,
        label: "جودة الترافيك",
        sub: "CPC & Clicks",
        body: (
          <>
            <p className={cn("font-mono text-2xl font-black tracking-tight text-white", hidden && "blurred-number")}>
              {data.clicks.toLocaleString("en-US")} <span className="text-sm font-bold text-slate-400">نقرة</span>
            </p>
            <p className={cn("mt-1 font-mono text-[11px] text-slate-400", hidden && "blurred-number")}>
              CPC ${money(data.cpc, 3)} · CTR {money(data.ctr, 2)}%
            </p>
          </>
        ),
      },
    ],
    [data.clicks, data.cpc, data.ctr, data.spend, hidden, realCpa, spendMad, todayOrders],
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 p-5 shadow-[0_0_40px_-18px_rgba(245,158,11,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] text-amber-400/80 uppercase">Meta Ads Telemetry</p>
          <h3 className="mt-1 text-base font-black text-white">مراقبة الصرف الإعلاني المباشر</h3>
          <p className="text-[11px] text-slate-400">
            {live ? "بيانات اليوم من Meta Marketing API" : "تعذر الاتصال بـ Meta — عرض القيم الافتراضية"}
          </p>
        </div>
        <button
          type="button"
          aria-label="تحديث بيانات الإعلانات"
          disabled={busy}
          onClick={() => void load(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-bold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          تحديث
        </button>
      </div>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-inner backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                <card.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-black text-slate-100">{card.label}</p>
                <p className="text-[10px] text-slate-500">{card.sub}</p>
              </div>
            </div>
            {card.body}
          </div>
        ))}
      </div>
    </section>
  );
}
