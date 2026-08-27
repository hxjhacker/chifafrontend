"use client";

import type { Offer } from "@/lib/offer";
import type { Bundle } from "@/lib/educative";

export function StickyCta({
  offer,
  bundle,
  onOrder,
}: {
  offer?: Offer;
  bundle?: Bundle;
  onOrder: () => void;
}) {
  const title = offer?.title ?? bundle?.title ?? "";
  const price = offer?.price ?? bundle?.price ?? 0;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald/20 bg-white px-3 py-3 shadow-[0_-12px_40px_rgba(11,31,58,0.16)]"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-royal/60">{title}</p>
          <p className="text-lg font-extrabold text-emerald">
            {price} <span className="text-sm font-bold">درهم</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onOrder}
          className="shrink-0 rounded-2xl bg-gradient-to-l from-amber to-amber-400 px-4 py-3 text-sm font-extrabold text-royal shadow-lg sm:px-6 sm:text-base"
        >
          اطلب الآن - الدفع عند الاستلام
        </button>
      </div>
    </div>
  );
}
