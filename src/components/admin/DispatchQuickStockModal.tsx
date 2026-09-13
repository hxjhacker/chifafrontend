"use client";

import { Loader2, Package, Warehouse, X } from "lucide-react";
import { formatMad, type AdminOrder } from "@/lib/admin";

type Props = {
  order: AdminOrder;
  open: boolean;
  shipping: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DispatchQuickStockModal({ order, open, shipping, onClose, onConfirm }: Props) {
  if (!open) return null;
  const qty = Math.max(1, Number(order.tier_qty) || 1);
  const quickId = order.quick_product_id;
  const code = order.product_code || order.product_slug;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="إغلاق" onClick={onClose} />
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-stock-title"
        className="relative w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0d1527] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <p id="quick-stock-title" className="text-sm font-black">
                إرسال من مخزون Quick
              </p>
              <p className="text-[11px] font-semibold text-slate-400">
                {code}
                {quickId ? ` · Quick ID ${quickId}` : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white" aria-label="إغلاق" disabled={shipping}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">المنتج</span>
            <span className="inline-flex items-center gap-1 font-bold">
              <Package className="h-3.5 w-3.5 text-emerald-400" />
              {order.pack_label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">معرف المنتج في كويك</span>
            <span className="font-mono font-black text-emerald-300">{quickId ? `#${quickId}` : "غير معرّف"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">الكمية</span>
            <span className="font-black">{qty}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">التحصيل COD</span>
            <span className="font-black text-amber-300">{formatMad(order.total)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={shipping || !quickId}
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {shipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Warehouse className="h-4 w-4" />}
            {shipping ? "جاري الإرسال لـ Quick..." : "إرسال من مخزون Quick"}
          </button>
          <button
            type="button"
            disabled={shipping}
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-300"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
