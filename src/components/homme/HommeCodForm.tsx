"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { submitOrder } from "@/lib/api";
import { clickIds, newEventId } from "@/lib/tracking";

type Props = { slug: string; title: string; price: number; compareAt: number; onFocusCheckout: () => void };

export function HommeCodForm({ slug, title, price, compareAt, onFocusCheckout }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 3) return setError("كتب الاسم الكامل");
    if (!isTenDigitMaPhone(phone)) return setError("رقم الهاتف خاصو يكون 10 أرقام بالضبط، مثلا: 06XXXXXXXX");
    if (city.trim().length < 2) return setError("كتب اسم المدينة");
    setLoading(true);
    try {
      const order = await submitOrder({
        full_name: name.trim(), phone, city: city.trim(), product_slug: slug, tier_qty: 1,
        event_id: newEventId(), landing_url: window.location.href, ...clickIds(),
      });
      router.push(`/thank-you?order=${order.order_id}`);
    } catch {
      setError("ما قدرناش نسجّلو الطلب. جرّب مرة أخرى أو تأكد من البيانات.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="order-form" className="rounded-[2rem] border border-red-900/70 bg-gradient-to-b from-[#170908] to-[#0e0707] p-5 shadow-[0_0_35px_-8px_rgba(255,46,0,.5)] sm:p-7">
      <h2 className="text-xl font-black text-white sm:text-2xl">أكّد طلبك الآن — الدفع عند الاستلام</h2>
      <p className="mt-1 text-xs text-stone-400">كتقلب الكولي بيدك عاد تخلّص الموزع.</p>
      <form id="order-fields" onSubmit={onSubmit} onFocus={onFocusCheckout} className="mt-5 space-y-3.5">
        <div className="flex items-center justify-between rounded-xl border border-red-900/50 bg-black/60 px-4 py-3">
          <span className="text-xs font-bold text-stone-400">المجموع مع التوصيل المجاني</span>
          <span className="fire-gradient-text text-xl font-black">{price} درهم <span className="ml-1 text-xs text-stone-500 line-through">{compareAt}</span></span>
        </div>
        <label className="block text-xs font-bold text-stone-300">الاسم الكامل
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className="homme-input" />
        </label>
        <label className="block text-xs font-bold text-stone-300">رقم الهاتف
          <input value={phone} onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))} maxLength={10} type="tel" inputMode="tel" dir="ltr" placeholder="06XXXXXXXX" required className="homme-input text-right" />
        </label>
        <label className="block text-xs font-bold text-stone-300">المدينة
          <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="كتب اسم المدينة" required className="homme-input" />
        </label>
        {error ? <p role="alert" className="text-sm font-semibold text-red-400">{error}</p> : null}
        <button disabled={loading} className="fire-button w-full rounded-xl py-4 text-sm font-black text-white disabled:opacity-60">
          {loading ? "كنسجّلو الطلب…" : `تأكيد الطلب · ${price} درهم`}
        </button>
      </form>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-stone-300">
        <span className="rounded-lg border border-stone-800 bg-black/50 p-2">تغليف سري</span>
        <span className="rounded-lg border border-stone-800 bg-black/50 p-2">قلب بيدك عاد خلص</span>
        <span className="rounded-lg border border-stone-800 bg-black/50 p-2">توصيل 24–48 ساعة</span>
      </div>
      <p className="mt-3 text-xs font-bold text-amber-200">{title}</p>
    </section>
  );
}
