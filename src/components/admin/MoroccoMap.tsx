"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Info, Minus, Plus, X } from "lucide-react";
import { MOROCCO_PATHS } from "@/lib/admin-map/paths";
import { formatMad } from "@/lib/admin";
import { MOROCCO_REGIONS } from "@/lib/admin-geo";
import { regionRateFill, RATE_AMBER, RATE_GRAY, RATE_GREEN, RATE_ROSE, type LogisticsRegion } from "@/lib/logistics";
import { cn } from "@/lib/cn";

type Props = {
  regions: LogisticsRegion[];
  hideNumbers: boolean;
  onToggleNumbers: () => void;
  className?: string;
};

const LEGEND = [
  { label: "≥ 75%", color: RATE_GREEN },
  { label: "55–74%", color: RATE_AMBER },
  { label: "< 55%", color: RATE_ROSE },
  { label: "بدون طلبيات", color: RATE_GRAY },
];

export function MoroccoMap({ regions, hideNumbers, onToggleNumbers, className }: Props) {
  const [pinned, setPinned] = useState<LogisticsRegion | null>(null);
  const [hovered, setHovered] = useState<LogisticsRegion | null>(null);
  const [zoom, setZoom] = useState(1);

  const byName = useMemo(() => {
    const map = new Map<string, LogisticsRegion>();
    for (const region of MOROCCO_REGIONS) {
      const hit = regions.find((r) => r.region_id === region.id || r.name === region.name);
      map.set(region.name, hit || {
        region_id: region.id,
        name: region.name,
        total_orders: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        in_transit: 0,
        delivery_rate: 0,
        cod_generated: 0,
        top_cities: [],
      });
    }
    return map;
  }, [regions]);

  const active = pinned || hovered;

  function lookup(name: string) {
    return byName.get(name) || null;
  }

  function select(name: string) {
    const next = lookup(name);
    setPinned((prev) => (prev && next && prev.region_id === next.region_id ? null : next));
  }

  return (
    <div className={cn("relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury dark:bg-cardDark", className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-royal dark:text-white">الخرائط</h3>
          <span className="cursor-pointer text-xs text-royal/50 dark:text-slate-400" title="نسبة التوصيل الحقيقية حسب جهات المملكة">
            <Info className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleNumbers}
            className="flex items-center gap-1 rounded-lg border border-gold/20 bg-cream px-2 py-1 text-xs font-bold text-royal/60 hover:text-gold dark:bg-brandDark dark:text-slate-400"
          >
            {hideNumbers ? <Eye className="h-3 w-3 text-emeraldCustom" /> : <EyeOff className="h-3 w-3" />}
            <span>أرقام الخريطة</span>
          </button>
          <span className="rounded-lg border border-emeraldCustom/20 bg-emeraldCustom/10 px-2.5 py-1 text-[11px] font-bold text-emeraldCustom">
            معدل التوصيل
          </span>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-gold/10 bg-cream/40 py-2 dark:bg-brandDark/40">
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gold/20 bg-white text-xs font-black text-royal shadow-sm transition hover:bg-gold hover:text-royal dark:bg-cardDark dark:text-slate-200"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gold/20 bg-white text-xs font-black text-royal shadow-sm transition hover:bg-gold hover:text-royal dark:bg-cardDark dark:text-slate-200"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>

        <div
          id="region-info-card"
          className={cn(
            "absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-gold/30 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 dark:bg-cardDark/95",
            active ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
          )}
          aria-hidden={!active}
        >
          <div className="mb-2 flex items-center justify-between border-b border-gold/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: active ? regionRateFill(active) : RATE_GRAY }} />
              <div>
                <h4 className="text-xs font-black text-royal dark:text-white">جهة {active?.name}</h4>
                {active?.region_id ? <span className="text-[10px] font-bold text-gold">{active.region_id}</span> : null}
              </div>
            </div>
            <button type="button" onClick={() => setPinned(null)} className="text-xs text-royal/40 hover:text-rose-500 dark:text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-royal/60 dark:text-slate-400">مجموع الطلبات</span>
              <span className={cn("mt-0.5 block text-sm font-black text-royal dark:text-gold", hideNumbers && "blurred-number")}>
                {active?.total_orders ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-emeraldCustom">تم التسليم</span>
              <span className={cn("mt-0.5 block text-sm font-black text-emeraldCustom", hideNumbers && "blurred-number")}>
                {active?.delivered ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-rose-500">مرتجع</span>
              <span className={cn("mt-0.5 block text-sm font-black text-rose-500", hideNumbers && "blurred-number")}>
                {active?.returned ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-gold">COD المحصّل</span>
              <span className={cn("mt-0.5 block text-sm font-black text-gold", hideNumbers && "blurred-number")}>
                {formatMad(active?.cod_generated ?? 0)}
              </span>
            </div>
          </div>
          <p className={cn("mt-2 text-center text-[11px] font-bold text-royal/60 dark:text-slate-400", hideNumbers && "blurred-number")}>
            نسبة التوصيل {active ? `${active.delivery_rate.toFixed(1)}%` : "—"}
            {active?.top_cities?.[0] ? ` · أعلى مدينة: ${active.top_cities[0].city}` : ""}
          </p>
        </div>

        <svg viewBox="0 0 465 400" className="h-80 w-full max-w-[370px] origin-center sm:h-96" style={{ transform: `scale(${zoom})` }}>
          <g transform="scale(0.6) translate(87.5, -130.16666666666669)">
            {MOROCCO_PATHS.map((region) => {
              const stat = lookup(region.name);
              const fill = stat ? regionRateFill(stat) : RATE_GRAY;
              const isActive = active?.name === region.name;
              return (
                <path
                  key={region.name}
                  d={region.d}
                  className={cn("morocco-region", isActive && "active-region")}
                  style={{ fill }}
                  onMouseEnter={() => setHovered(stat)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => select(region.name)}
                />
              );
            })}
          </g>
          <g>
            {MOROCCO_PATHS.map((region) => {
              const stat = lookup(region.name);
              return (
                <text
                  key={`${region.name}-label`}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  x={region.labelX}
                  y={region.labelY}
                  className={cn("region-count-label", hideNumbers && "blurred-number")}
                >
                  {stat?.delivered ?? 0} / {stat?.total_orders ?? 0}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-royal/60 dark:text-slate-400">
        {LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
