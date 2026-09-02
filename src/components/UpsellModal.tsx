"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { otherProducts } from "@/lib/products";
import { submitUpsell } from "@/lib/api";
import { newEventId, trackPurchaseOnce } from "@/lib/tracking";

export function UpsellModal() {
  const cart = useCart();
  const router = useRouter();
  const [seconds, setSeconds] = useState(12);
  const offer = useMemo(() => {
    if (!cart.productSlug) return null;
    const skip = new Set([cart.productSlug, cart.crossSellSlug || ""]);
    return otherProducts(cart.productSlug).find((p) => !skip.has(p.slug)) ?? null;
  }, [cart.productSlug, cart.crossSellSlug]);

  useEffect(() => {
    if (!cart.upsellOpen) return;
    setSeconds(12);
    const t = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          goThanks();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.upsellOpen]);

  function goThanks() {
    cart.closeUpsell();
    if (cart.orderId) router.push(`/thank-you?order=${cart.orderId}`);
  }

  async function accept() {
    if (!cart.orderId || !offer) return;
    const eventId = newEventId();
    try {
      await submitUpsell(cart.orderId, offer.slug, eventId);
      trackPurchaseOnce({
        orderId: cart.orderId,
        value: 99,
        contentIds: [offer.slug],
        kind: "upsell",
      });
    } catch {
      /* still confirm */
    }
    goThanks();
  }

  return (
    <AnimatePresence>
      {cart.upsellOpen && offer ? (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-royal/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="dialog" aria-modal initial={{ scale: 0.94 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-3xl border border-gold/20 bg-cream p-6 text-center shadow-gold dark:bg-cardDark">
            <p className="text-sm font-bold text-emeraldCustom">عرض حصري — {seconds} ثانية</p>
            <h2 className="mt-2 text-2xl font-bold text-royal dark:text-white">أضف USB إضافي فقط بـ 99 DH</h2>
            <p className="mt-2 text-royal/80 dark:text-slate-300">{offer.nameAr}</p>
            <p className="mt-1 text-sm text-royal/60 dark:text-slate-400">هذا هو المكان الوحيد فالطلب اللي كاين فيه تخفيض.</p>
            <button type="button" onClick={accept} className="btn-gold mt-5 w-full">
              زيدوه للطلب بـ 99 درهم
            </button>
            <button type="button" onClick={goThanks} className="mt-3 text-sm text-royal/60 underline dark:text-slate-400">
              لا شكرا، كمّل الطلب
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
