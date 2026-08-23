"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { filterCities } from "@/lib/cities";
import { isValidMaPhone } from "@/lib/phone";
import { submitOrder } from "@/lib/api";
import { clickIds, newEventId, trackFunnel } from "@/lib/tracking";

export function CheckoutModal() {
  const cart = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cities = useMemo(() => filterCities(cityQ), [cityQ]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 3) return setError("كتبي الاسم الكامل");
    if (!isValidMaPhone(phone)) {
      return setError("دخل رقم مغربي صحيح يبدا بـ 05 أو 06 أو 07 أو +212");
    }
    if (!city) return setError("اختاري المدينة من اللائحة");
    if (!cart.productSlug) return;
    setLoading(true);
    const eventId = newEventId();
    try {
      const order = await submitOrder({
        full_name: name.trim(),
        phone,
        city,
        product_slug: cart.productSlug,
        tier_qty: cart.tierQty,
        cross_sell_slug: cart.crossSellSlug,
        event_id: eventId,
        landing_url: window.location.href,
        ...clickIds(),
      });
      trackFunnel("Purchase", {
        eventId,
        value: order.total,
        contentIds: [cart.productSlug],
        phone,
        city,
        fullName: name.trim(),
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
            className="w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-gold md:rounded-3xl"
          >
            <h2 className="text-xl font-bold text-royal">أكّد الطلب — الدفع عند الاستلام</h2>
            <label className="mt-4 block text-sm">
              الاسم الكامل
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-3" autoComplete="name" />
            </label>
            <label className="mt-3 block text-sm">
              رقم الهاتف
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-3" inputMode="tel" placeholder="06xxxxxxxx" />
            </label>
            <label className="mt-3 block text-sm">
              المدينة
              <input
                value={cityQ}
                onChange={(e) => {
                  setCityQ(e.target.value);
                  setCity("");
                }}
                className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-3"
                placeholder="كتبي اسم المدينة"
              />
            </label>
            <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-gold-200 bg-white">
              {cities.slice(0, 12).map((c) => (
                <li key={c.fr}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(c.ar);
                      setCityQ(`${c.ar} — ${c.fr}`);
                    }}
                    className={`block w-full px-3 py-2 text-right text-sm ${city === c.ar ? "bg-gold-200" : ""}`}
                  >
                    {c.ar} <span className="text-royal/50">({c.fr})</span>
                  </button>
                </li>
              ))}
            </ul>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading} className="btn-gold mt-5 w-full">
              {loading ? "كنسجّلو الطلب…" : "أكّد الطلب — الدفع عند الاستلام"}
            </button>
            <button type="button" className="mt-2 w-full py-2 text-sm text-royal/60" onClick={() => cart.setCheckout(false)}>
              رجوع للسلة
            </button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
