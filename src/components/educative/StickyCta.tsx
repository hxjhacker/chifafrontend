"use client";

export function StickyCta({ onOrder }: { offer?: unknown; bundle?: unknown; onOrder: () => void }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-white/95 px-3 py-3 shadow-[0_-12px_40px_rgba(11,31,58,0.16)] backdrop-blur-md dark:bg-brandDark/95"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={onOrder}
          className="gold-gradient cta-pulse w-full rounded-2xl px-4 py-3.5 text-sm font-extrabold text-royal shadow-luxury sm:text-base"
        >
          اطلب الآن - الدفع عند الاستلام
        </button>
      </div>
    </div>
  );
}
