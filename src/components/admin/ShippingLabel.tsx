"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { type AdminOrder } from "@/lib/admin";
import { MetaLivraisonLabel } from "@/components/admin/labels/MetaLivraisonLabel";
import { QuickLivraisonLabel } from "@/components/admin/labels/QuickLivraisonLabel";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
};

export { MetaLivraisonLabel } from "@/components/admin/labels/MetaLivraisonLabel";
export { QuickLivraisonLabel } from "@/components/admin/labels/QuickLivraisonLabel";

export function ShippingLabel({ order, onClose }: Props) {
  useLockBodyScroll(Boolean(order));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

  const quick = order.carrier === "quick_livraison";
  const carrierName = quick ? "Quick Livraison" : "Meta Livraison";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 print:static print:inset-auto print:bg-white print:p-0">
      <div className="shipping-label-chrome no-print absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-[420px] flex-col items-center gap-3 overflow-y-auto print:max-h-none print:w-auto print:max-w-none print:overflow-visible">
        <div className="no-print flex w-full items-center justify-between rounded-2xl border border-[#1e293b] bg-[#0b1322] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">معاينة بوليصة الشحن</p>
            <p className="text-[11px] text-slate-400">حراري مربع 100×100 مم — {carrierName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة التذكرة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              إغلاق
            </button>
          </div>
        </div>

        {quick ? <QuickLivraisonLabel order={order} /> : <MetaLivraisonLabel order={order} />}
      </div>
    </div>
  );
}
