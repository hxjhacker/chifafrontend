"use client";

import { Star } from "lucide-react";
import { GALLERY_SHOTS, STOCK_CAP, STOCK_LEFT, type Bundle } from "@/lib/educative";
import { padTime, useOfferCountdown } from "@/hooks/useOfferCountdown";
import { ProductCarousel } from "@/components/lp/ProductCarousel";
import { CodForm } from "./CodForm";

export function HeroGallery({
  bundle,
  onFocusCheckout,
}: {
  bundle: Bundle;
  onFocusCheckout: () => void;
}) {
  const time = useOfferCountdown("cg-educative-offer-end");
  const stockPct = Math.max(8, Math.round((STOCK_LEFT / STOCK_CAP) * 100));

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div>
        <div className="mb-3">
          <span className="inline-flex rounded-full bg-gradient-to-l from-amber to-amber-400 px-3 py-1.5 text-xs font-extrabold text-royal shadow-md">
            الأكثر مبيعاً للدخول المدرسي 🎓
          </span>
        </div>
        <ProductCarousel shots={GALLERY_SHOTS} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-royal">
            <span className="inline-flex" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber text-amber" />
              ))}
            </span>
            4.9 / 5
          </span>
          <p className="text-sm leading-relaxed text-royal/65">أكثر من 1,280 تقييم معتمد من آباء وأمهات</p>
        </div>

        <div>
          <p className="mb-2 inline-flex rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
            100% بدون إنترنت
          </p>
          <h1 className="text-[1.55rem] font-extrabold leading-[1.45] tracking-tight text-royal sm:text-[1.85rem]">
            الفلاشة التعليمية الذكية للأطفال
          </h1>
          <p className="mt-2 max-w-md text-base leading-8 text-royal/75">
            رفيق التفوق المدرسي، وحماية طفلك من إدمان الهواتف.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald/15 bg-white p-4 shadow-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums tracking-tight text-emerald">{bundle.price}</span>
            <span className="text-base font-bold text-emerald">درهم</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400 line-through">{bundle.compareAt} درهم</span>
            {bundle.save > 0 ? (
              <span className="rounded-full bg-emerald px-2.5 py-0.5 text-xs font-bold text-white">
                وفر {bundle.save} درهم
              </span>
            ) : null}
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-semibold text-royal/80">
            فلاشة واحدة · التوصيل مجاني لجميع المدن
          </p>
        </div>

        <div className="rounded-2xl border border-amber/30 bg-amber-100/70 p-4">
          <p className="text-sm font-bold text-royal">العرض ينتهي خلال</p>
          <div className="mt-2 flex gap-2" aria-live="polite">
            {[
              [time.h, "ساعة"],
              [time.m, "دقيقة"],
              [time.s, "ثانية"],
            ].map(([value, label]) => (
              <div key={String(label)} className="min-w-[4.2rem] rounded-xl bg-royal px-2 py-2 text-center text-white">
                <div className="font-cinzel text-xl font-bold">{padTime(Number(value))}</div>
                <div className="text-[10px] text-gold-300">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-royal">
              <span>باقي فقط {STOCK_LEFT} قطعة متوفرة في المخزون</span>
              <span className="text-amber">{stockPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber to-emerald"
                style={{ width: `${stockPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <CodForm bundle={bundle} onFocusCheckout={onFocusCheckout} />
        </div>
      </div>
    </section>
  );
}
