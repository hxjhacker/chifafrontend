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
  instanceId = "page",
}: {
  offer?: Offer;
  bundle?: Bundle;
  onFocusCheckout: () => void;
  instanceId?: string;
}) {
  const deal: Offer = offer ?? {
    slug: EDUCATIVE_SLUG,
    qty: bundle?.qty ?? 1,
    price: bundle?.price ?? 149,
    compareAt: bundle?.compareAt ?? 249,
    save: bundle?.save ?? 100,
    title: bundle?.title ?? "1 فلاشة تعليمية",
  };
  const fieldId = `${instanceId}-${deal.slug}`;
  const isPage = instanceId === "page";
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
    <section id={isPage ? "order-form" : undefined}>
      <div className="rounded-[2rem] border-2 border-gold/30 bg-white p-5 shadow-luxury sm:p-8 dark:bg-cardDark">
        <h2 className="text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">أكّدي الطلب دابا — الدفع عند الاستلام</h2>
        <p className="mt-2 text-sm text-royal/70 dark:text-slate-400">ما كاتخلّصيش حتى تشوفي السلعة قدام الموصّل.</p>

        <form id={isPage ? "order-fields" : undefined} onSubmit={onSubmit} className="mt-6 space-y-4" onFocus={onFocusCheckout}>
          <div className="flex flex-wrap items-baseline justify-end gap-3 rounded-2xl bg-gradient-to-l from-royal to-royal-700 px-4 py-3 text-white">
            <span className="text-2xl font-black tabular-nums">
              {deal.price} <span className="text-sm font-bold">درهم</span>
            </span>
            <span className="text-sm text-white/50 line-through tabular-nums">{deal.compareAt} درهم</span>
          </div>

          <label className="block text-sm font-bold text-royal dark:text-slate-100" htmlFor={`full-name-${fieldId}`}>
            الاسم الكامل
            <input
              id={`full-name-${fieldId}`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              required
            />
          </label>

          <label className="block text-sm font-bold text-royal dark:text-slate-100" htmlFor={`phone-${fieldId}`}>
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
              className="field-input text-right"
              required
            />
          </label>

          <label className="block text-sm font-bold text-royal dark:text-slate-100" htmlFor={`city-${fieldId}`}>
            المدينة
            <input
              id={`city-${fieldId}`}
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="field-input"
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
            className="gold-gradient w-full rounded-2xl py-4 text-lg font-extrabold text-royal shadow-luxury transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "كنسجّلو الطلب…" : "تأكيد الطلب"}
          </button>
        </form>

        <ul className="mt-5 grid gap-2 text-sm font-semibold text-royal/80 dark:text-slate-300 sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2 dark:bg-brandDark">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emeraldCustom" aria-hidden />
            ضمان الرضا 100%
          </li>
          <li className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2 dark:bg-brandDark">
            <Eye className="h-4 w-4 shrink-0 text-emeraldCustom" aria-hidden />
            إمكانية المعاينة قبل الدفع
          </li>
          <li className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2 dark:bg-brandDark">
            <MessageCircle className="h-4 w-4 shrink-0 text-emeraldCustom" aria-hidden />
            خدمة عملاء عبر الواتساب
          </li>
        </ul>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-royal/50 dark:text-slate-500">
          <BadgeCheck className="h-3.5 w-3.5 text-emeraldCustom" aria-hidden />
          طلبك كيتسجّل مباشرة وكيتّأكد بالهاتف
        </p>
      </div>
    </section>
  );
}
