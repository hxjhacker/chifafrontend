"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { galleryShots, getProduct } from "@/lib/products";
import { CATALOG_OFFER, type Offer } from "@/lib/offer";
import { trackFunnel } from "@/lib/tracking";
import { padTime, useOfferCountdown } from "@/hooks/useOfferCountdown";
import { scrollToOrderFields } from "@/lib/scroll";
import { ProductCarousel } from "@/components/lp/ProductCarousel";
import { CodForm } from "@/components/educative/CodForm";
import { StickyCta } from "@/components/educative/StickyCta";
import { Specs } from "@/components/educative/Specs";
import { Faq } from "@/components/educative/Faq";

const BADGES: Record<string, string> = {
  quran: "هدية روحية فاخرة",
  kids: "محتوى تربوي للأطفال",
  music: "جاهز للسيارة والمحل",
};

const STOCK = 18;

export function ProductLanding({ slug }: { slug: string }) {
  const product = getProduct(slug);
  const initiated = useRef(false);
  const time = useOfferCountdown(`cg-${slug}-offer-end`);
  const shots = useMemo(() => (product ? galleryShots(product) : []), [product]);
  const stockPct = Math.max(8, Math.round((STOCK / 50) * 100));

  const offer: Offer | null = product
    ? {
        slug: product.slug,
        qty: CATALOG_OFFER.qty,
        price: CATALOG_OFFER.price,
        compareAt: CATALOG_OFFER.compareAt,
        save: CATALOG_OFFER.save,
        title: `1 ${product.nameAr}`,
      }
    : null;

  const markCheckout = useCallback(() => {
    if (!offer || initiated.current) return;
    initiated.current = true;
    trackFunnel("InitiateCheckout", {
      value: offer.price,
      contentIds: [offer.slug],
    });
  }, [offer]);

  const scrollToForm = useCallback(() => {
    markCheckout();
    scrollToOrderFields();
  }, [markCheckout]);

  useEffect(() => {
    if (!offer) return;
    trackFunnel("ViewContent", { value: offer.price, contentIds: [offer.slug] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing
  }, []);

  if (!product || !offer) return <p className="p-8">المنتج غير موجود.</p>;

  return (
    <div className="bg-gradient-to-b from-sky-50 via-cream to-emerald/5 pb-28" dir="rtl">
      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full bg-gradient-to-l from-amber to-amber-400 px-3 py-1.5 text-xs font-extrabold text-royal shadow-md">
                {BADGES[product.slug] ?? "الأكثر طلباً"}
              </span>
            </div>
            <ProductCarousel shots={shots} />
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
              <p className="text-sm leading-relaxed text-royal/65">أكثر من 1,200 تقييم من المغرب</p>
            </div>

            <div>
              <p className="mb-2 inline-flex rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
                100% بدون إنترنت
              </p>
              <h1 className="text-[1.55rem] font-extrabold leading-[1.45] tracking-tight text-royal sm:text-[1.85rem]">
                {product.nameAr}
              </h1>
              <p className="mt-2 max-w-md text-base leading-8 text-royal/75">{product.tagline}</p>
            </div>

            <div className="rounded-3xl border border-emerald/15 bg-white p-4 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight text-emerald">{offer.price}</span>
                <span className="text-base font-bold text-emerald">درهم</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-400 line-through">{offer.compareAt} درهم</span>
                <span className="rounded-full bg-emerald px-2.5 py-0.5 text-xs font-bold text-white">
                  وفر {offer.save} درهم
                </span>
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
                  <span>باقي فقط {STOCK} قطعة متوفرة في المخزون</span>
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
              <CodForm offer={offer} onFocusCheckout={markCheckout} />
            </div>
          </div>
        </section>

        <section aria-labelledby="content-heading">
          <h2 id="content-heading" className="text-2xl font-extrabold text-royal sm:text-3xl">
            شنو كاين داخل الفلاشة؟
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {product.features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-emerald/20 bg-white p-5 shadow-sm">
                <h3 className="font-extrabold text-royal">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-royal/70">{feature.body}</p>
              </article>
            ))}
            {product.bullets.map((bullet) => (
              <article key={bullet} className="rounded-3xl border border-emerald/20 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold leading-relaxed text-royal/80">{bullet}</p>
              </article>
            ))}
          </div>
        </section>

        <Specs />

        <section aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="text-2xl font-extrabold text-royal sm:text-3xl">
            زبناء جرّبوها
          </h2>
          <p className="mt-2 text-royal/70">تقييمات مشترين حقيقيين بعد التوصيل والمعاينة.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {product.reviews.map((review) => (
              <article key={review.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-royal">{review.name}</p>
                    <p className="text-xs text-royal/50">{review.city}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-1 text-[11px] font-bold text-emerald">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    مشترٍ موثّق
                  </span>
                </div>
                <p className="mt-2 inline-flex text-amber" aria-label={`${review.stars} من 5`}>
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber text-amber" />
                  ))}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-royal/80">{review.text}</p>
              </article>
            ))}
          </div>
        </section>

        <Faq />
      </main>
      <StickyCta offer={offer} onOrder={scrollToForm} />
    </div>
  );
}
