"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Eye, MessageCircle, ShieldCheck } from "lucide-react";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { submitOrder } from "@/lib/api";
import { clickIds, newEventId, trackFunnel } from "@/lib/tracking";
import { EDUCATIVE_SLUG, type Bundle } from "@/lib/educative";
import type { Offer } from "@/lib/offer";

export function CodForm({
  offer,
  bundle,
  onFocusCheckout,
}: {
  offer?: Offer;
  bundle?: Bundle;
  onFocusCheckout: () => void;
}) {
  const deal: Offer = offer ?? {
    slug: EDUCATIVE_SLUG,
    qty: bundle?.qty ?? 1,
    price: bundle?.price ?? 149,
    compareAt: bundle?.compareAt ?? 249,
    save: bundle?.save ?? 100,
    title: bundle?.title ?? "1 فلاشة تعليمية",
  };
  const fieldId = deal.slug;
  const router = useRouter();
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

    setLoading(true);
    const eventId = newEventId();
    try {
      const order = await submitOrder({
        full_name: name.trim(),
        phone,
        city: city.trim(),
        product_slug: deal.slug,
        tier_qty: deal.qty,
        event_id: eventId,
        landing_url: window.location.href,
        ...clickIds(),
      });
      trackFunnel("Purchase", {
        eventId,
        value: order.total,
        contentIds: [deal.slug],
        phone,
        city: city.trim(),
        fullName: name.trim(),
      });
      router.push(`/thank-you?order=${order.order_id}`);
    } catch {
      setError("ما قدرناش نسجّلو الطلب. جرّبي مرة أخرى أو تأكدي من رقم الهاتف والمدينة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="order-form">
      <div className="rounded-[2rem] border border-emerald/20 bg-white p-5 shadow-lg sm:p-8">
        <h2 className="text-2xl font-extrabold text-royal sm:text-3xl">أكّدي الطلب دابا — الدفع عند الاستلام</h2>
        <p className="mt-2 text-sm text-royal/70">ما كاتخلّصيش حتى تشوفي السلعة قدام الموصّل.</p>

        <form id="order-fields" onSubmit={onSubmit} className="mt-6 space-y-4" onFocus={onFocusCheckout}>
          <div className="flex flex-wrap items-baseline justify-end gap-3 rounded-2xl bg-gradient-to-l from-royal to-royal-700 px-4 py-3 text-white">
            <span className="text-2xl font-black tabular-nums">
              {deal.price} <span className="text-sm font-bold">درهم</span>
            </span>
            <span className="text-sm text-white/50 line-through tabular-nums">{deal.compareAt} درهم</span>
          </div>

          <label className="block text-sm font-bold text-royal" htmlFor={`full-name-${fieldId}`}>
            الاسم الكامل
            <input
              id={`full-name-${fieldId}`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base font-medium outline-none ring-emerald/30 focus:border-emerald focus:ring-2"
              required
            />
          </label>

          <label className="block text-sm font-bold text-royal" htmlFor={`phone-${fieldId}`}>
            رقم الهاتف
            <input
              id={`phone-${fieldId}`}
              name="tel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
              maxLength={10}
              dir="ltr"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-right text-base font-medium outline-none ring-emerald/30 focus:border-emerald focus:ring-2"
              required
            />
          </label>

          <label className="block text-sm font-bold text-royal" htmlFor={`city-${fieldId}`}>
            المدينة
            <input
              id={`city-${fieldId}`}
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base font-medium outline-none ring-emerald/30 focus:border-emerald focus:ring-2"
              placeholder="كتبي اسم المدينة"
              required
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-l from-amber to-amber-400 py-4 text-lg font-extrabold text-royal shadow-lg disabled:opacity-60"
          >
            {loading ? "كنسجّلو الطلب…" : "تأكيد الطلب"}
          </button>
        </form>

        <ul className="mt-5 grid gap-2 text-sm font-semibold text-royal/80 sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald" aria-hidden />
            ضمان الرضا 100%
          </li>
          <li className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
            <Eye className="h-4 w-4 shrink-0 text-emerald" aria-hidden />
            إمكانية المعاينة قبل الدفع
          </li>
          <li className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-emerald" aria-hidden />
            خدمة عملاء عبر الواتساب
          </li>
        </ul>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-royal/50">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald" aria-hidden />
          طلبك كيتسجّل مباشرة وكيتّأكد بالهاتف
        </p>
      </div>
    </section>
  );
}
