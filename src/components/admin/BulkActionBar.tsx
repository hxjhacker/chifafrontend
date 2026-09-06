"use client";

import { FileText, Loader2, Printer, Truck, X } from "lucide-react";

type Props = {
  count: number;
  busy: "dispatch" | "labels" | "manifest" | null;
  confirmOpen: boolean;
  labelsLocked?: boolean;
  labelsHint?: string;
  onConfirmOpen: () => void;
  onConfirmClose: () => void;
  onDispatch: () => void;
  onLabels: () => void;
  onManifest: () => void;
  onClear: () => void;
};

export function BulkActionBar({
  count,
  busy,
  confirmOpen,
  labelsLocked,
  labelsHint,
  onConfirmOpen,
  onConfirmClose,
  onDispatch,
  onLabels,
  onManifest,
  onClear,
}: Props) {
  if (count < 1) return null;
  const locked = Boolean(busy);
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-royal px-3 py-2.5 text-cream shadow-2xl dark:bg-[#070F1B]">
          <p className="px-1 text-sm font-black text-gold">تم تحديد {count} طلبية</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={locked}
              onClick={onConfirmOpen}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs font-black text-royal transition hover:bg-gold/90 disabled:opacity-60"
            >
              {busy === "dispatch" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
              إرسال إلى Meta Livraison
            </button>
            <span className="inline-flex" title={labelsHint || "طباعة البوالص (A6 PDF)"}>
              <button
                type="button"
                disabled={locked || labelsLocked}
                title={labelsHint || "طباعة البوالص (A6 PDF)"}
                onClick={onLabels}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy === "labels" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                طباعة البوالص (A6 PDF)
              </button>
            </span>
            <button
              type="button"
              disabled={locked}
              onClick={onManifest}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
            >
              {busy === "manifest" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              تصدير ورقة التسليم
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-cream/80 transition hover:bg-white/10 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء التحديد
            </button>
          </div>
        </div>
      </div>
      {confirmOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-gold/30 bg-white p-6 shadow-2xl dark:bg-cardDark">
            <h3 className="text-sm font-black text-royal dark:text-white">تأكيد الإرسال الجماعي</h3>
            <p className="mt-2 text-xs font-bold leading-6 text-royal/75 dark:text-slate-300">
              سيتم إرسال <span className="text-gold">{count}</span> طلبية إلى Meta Livraison. الطلبيات غير المؤكدة أو بدون مدينة لن تُرسل.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                disabled={locked}
                onClick={onDispatch}
                className="flex-1 rounded-xl bg-gold py-2.5 text-xs font-black text-royal disabled:opacity-60"
              >
                {busy === "dispatch" ? "جاري الإرسال…" : "نعم، أرسل"}
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={onConfirmClose}
                className="rounded-xl border border-gold/20 bg-cream px-4 py-2.5 text-xs font-bold text-royal/70 dark:bg-brandDark dark:text-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
