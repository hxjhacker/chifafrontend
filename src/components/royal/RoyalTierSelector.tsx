"use client";

import { cn } from "@/lib/cn";
import { ROYAL_TIERS, type RoyalTierQty } from "@/lib/royal-pack";

export function RoyalTierSelector({
  value,
  onChange,
}: {
  value: RoyalTierQty;
  onChange: (qty: RoyalTierQty) => void;
}) {
  return (
    <div className="grid gap-3">
      {ROYAL_TIERS.map((tier) => {
        const active = value === tier.qty;
        return (
          <button
            type="button"
            key={tier.qty}
            onClick={() => onChange(tier.qty)}
            className={cn(
              "relative rounded-2xl border-2 px-4 py-4 text-right transition",
              active ? "border-gold bg-gold/15 shadow-gold dark:bg-cardDark" : "border-gold/20 bg-white dark:bg-brandDark",
            )}
          >
            {tier.badge ? (
              <span className="absolute -top-2 left-4 rounded-full bg-royal px-2 py-0.5 text-[11px] text-gold">
                {tier.badge}
              </span>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-royal dark:text-white">{tier.title}</span>
              <span className="text-xl font-bold tabular-nums text-royal dark:text-gold">{tier.price} درهم</span>
            </div>
            <p className="mt-1 text-sm text-royal/60 dark:text-slate-400">{tier.subtitle}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm text-royal/40 line-through tabular-nums dark:text-slate-500">{tier.compareAt} درهم</span>
              {tier.highlight ? (
                <span className="text-sm text-emeraldCustom">{tier.highlight}</span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
