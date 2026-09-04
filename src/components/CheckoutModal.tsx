"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { submitOrder } from "@/lib/api";
import { clickIds, newEventId } from "@/lib/tracking";

export function CheckoutModal() {
  const cart = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 3) return setError("كتبي الاسم الكامل");
    if (!isTenDigitMaPhone(phone)) {
      return setError("رقم الهاتف خاصو يكون 10 أرقام بالضبط، مثلا: 06XXXXXXXX");
    }
    if (city.trim().length < 2) return setError("كتبي اسم المدينة");
    if (!cart.productSlug) return;
    setLoading(true);
    const eventId = newEventId();
    try {
      const order = await submitOrder({
        full_name: name.trim(),
        phone,
        city: city.trim(),
        product_slug: cart.productSlug,
        tier_qty: cart.tierQty,
        cross_sell_slug: cart.crossSellSlug,
        event_id: eventId,
        defer_purchase: true,
        landing_url: window.location.href,
        ...clickIds(),
      });
      cart.onOrderCreated(order.order_id);
    } catch {
      setError("ما قدرناش نسجّلو الطلب. جرّبي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {cart.checkoutOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-end bg-royal/60 md:place-items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            role="dialog"
            aria-modal
            onSubmit={onSubmit}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md rounded-t-3xl border border-gold/20 bg-cream p-6 shadow-gold md:rounded-3xl dark:bg-cardDark dark:text-slate-100"
          >
            <h2 className="text-xl font-bold text-royal dark:text-white">أكّد الطلب — الدفع عند الاستلام</h2>
            <label className="mt-4 block text-sm">
              الاسم الكامل
              <input value={name} onChange={(e) => setName(e.target.value)} className="field-input" autoComplete="name" />
            </label>
            <label className="mt-3 block text-sm">
              رقم الهاتف
              <input
                value={phone}
                onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
                maxLength={10}
                className="field-input text-right"
                dir="ltr"
                inputMode="numeric"
                placeholder="06XXXXXXXX"
              />
            </label>
            <label className="mt-3 block text-sm">
              المدينة
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="field-input"
                placeholder="كتبي اسم المدينة"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading} className="btn-gold mt-5 w-full">
              {loading ? "كنسجّلو الطلب…" : "أكّد الطلب — الدفع عند الاستلام"}
            </button>
            <button type="button" className="mt-2 w-full py-2 text-sm text-royal/60 dark:text-slate-400" onClick={() => cart.setCheckout(false)}>
              رجوع للسلة
            </button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
