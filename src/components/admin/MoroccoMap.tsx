"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Info, Minus, Plus, X } from "lucide-react";
import { MOROCCO_PATHS } from "@/lib/admin-map/paths";
import type { RegionStat } from "@/lib/admin-geo";
import { cn } from "@/lib/cn";

type Props = {
  stats: RegionStat[];
  hideNumbers: boolean;
  onToggleNumbers: () => void;
};

export function MoroccoMap({ stats, hideNumbers, onToggleNumbers }: Props) {
  const [active, setActive] = useState<RegionStat | null>(null);
  const [zoom, setZoom] = useState(1);

  const byName = useMemo(() => new Map(stats.map((s) => [s.name, s])), [stats]);

  function select(name: string) {
    setActive(byName.get(name) || { name, total: 0, confirmed: 0, unconfirmed: 0 });
  }

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury dark:bg-cardDark lg:col-span-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-royal dark:text-white">الخرائط</h3>
          <span className="cursor-pointer text-xs text-royal/50 dark:text-slate-400" title="توزيع الطلبيات الجغرافية حسب جهات المملكة">
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
            توزيع مباشر ⚡
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
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emeraldCustom" />
              <h4 className="text-xs font-black text-royal dark:text-white">جهة {active?.name}</h4>
            </div>
            <button type="button" onClick={() => setActive(null)} className="text-xs text-royal/40 hover:text-rose-500 dark:text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-royal/60 dark:text-slate-400">مجموع الطلبات</span>
              <span className={cn("mt-0.5 block text-sm font-black text-royal dark:text-gold", hideNumbers && "blurred-number")}>
                {active?.total ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-emeraldCustom">المؤكدة</span>
              <span className={cn("mt-0.5 block text-sm font-black text-emeraldCustom", hideNumbers && "blurred-number")}>
                {active?.confirmed ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-gold/10 bg-cream p-2 dark:bg-brandDark">
              <span className="block text-[10px] font-semibold text-rose-500">غير مؤكدة</span>
              <span className={cn("mt-0.5 block text-sm font-black text-rose-500", hideNumbers && "blurred-number")}>
                {active?.unconfirmed ?? 0}
              </span>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 465 400" className="h-80 w-full max-w-[370px] origin-center sm:h-96" style={{ transform: `scale(${zoom})` }}>
          <g transform="scale(0.6) translate(87.5, -130.16666666666669)">
            {MOROCCO_PATHS.map((region) => (
              <path
                key={region.name}
                d={region.d}
                className={cn("morocco-region", active?.name === region.name && "active-region")}
                onClick={() => select(region.name)}
              />
            ))}
          </g>
          <g>
            {MOROCCO_PATHS.map((region) => {
              const stat = byName.get(region.name);
              return (
                <text
                  key={`${region.name}-label`}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  x={region.labelX}
                  y={region.labelY}
                  className={cn("region-count-label", hideNumbers && "blurred-number")}
                >
                  {stat?.total ?? 0}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 text-center text-[11px] font-semibold text-royal/60 dark:text-slate-400">
        اضغط على أي جهة لمعاينة مجموع الطلبات ونسبة التأكيد فيها
      </div>
    </div>
  );
}
