"use client";

import { TIERS } from "@/lib/cn";
import { cn } from "@/lib/cn";
import type { TierQty } from "@/lib/cart";

export function PricingSelector({
  value,
  onChange,
}: {
  value: TierQty;
  onChange: (qty: TierQty) => void;
}) {
  return (
    <div className="grid gap-3">
      {TIERS.map((tier) => {
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
              <span className="font-bold text-royal dark:text-white">{tier.label}</span>
              <span className="text-xl font-bold text-royal dark:text-gold">{tier.price} DH</span>
            </div>
            {tier.save > 0 ? (
              <p className="mt-1 text-sm text-emeraldCustom">توفري {tier.save} درهم مقابل الشراء بالقطعة</p>
            ) : (
              <p className="mt-1 text-sm text-royal/60 dark:text-slate-400">الثمن الفردي — 199 درهم</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
