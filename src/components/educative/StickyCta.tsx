"use client";

export function StickyCta({ onOrder }: { offer?: unknown; bundle?: unknown; onOrder: () => void }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald/20 bg-white px-3 py-3 shadow-[0_-12px_40px_rgba(11,31,58,0.16)]"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={onOrder}
          className="cta-pulse w-full rounded-2xl bg-gradient-to-l from-amber to-amber-400 px-4 py-3.5 text-sm font-extrabold text-royal shadow-lg sm:text-base"
        >
          اطلب الآن - الدفع عند الاستلام
        </button>
      </div>
    </div>
  );
}
