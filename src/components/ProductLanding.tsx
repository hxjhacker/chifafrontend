"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { galleryShots, getProduct } from "@/lib/products";
import { CATALOG_OFFER, type Offer } from "@/lib/offer";
import { TrackPageView } from "@/components/TrackPageView";
import { trackFunnel } from "@/lib/tracking";
import { padTime, useOfferCountdown } from "@/hooks/useOfferCountdown";
import { scrollToOrderFields } from "@/lib/scroll";
import { ProductCarousel } from "@/components/lp/ProductCarousel";
import { CodForm } from "@/components/educative/CodForm";
import { StickyCta } from "@/components/educative/StickyCta";
import { Specs } from "@/components/educative/Specs";
import { Faq } from "@/components/educative/Faq";
import { ReviewGrid, Stars } from "@/components/reviews/ReviewCard";

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

  if (!product || !offer) return <p className="p-8 text-royal dark:text-slate-100">المنتج غير موجود.</p>;

  return (
    <div className="bg-cream pb-28 transition-colors duration-300 dark:bg-brandDark" dir="rtl">
      <TrackPageView kind="product" productSlug={product.slug} />
      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-extrabold text-gold-600 shadow-sm dark:bg-cardDark dark:text-gold">
                {BADGES[product.slug] ?? "الأكثر طلباً"}
              </span>
            </div>
            <ProductCarousel shots={shots} />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/20 bg-white px-3 py-1 text-sm font-bold text-royal dark:bg-cardDark dark:text-slate-100">
                <Stars />
                4.9 / 5
              </span>
              <p className="text-sm leading-relaxed text-royal/65 dark:text-slate-400">أكثر من 1,200 تقييم من المغرب</p>
            </div>

            <div>
              <p className="mb-2 inline-flex rounded-full bg-emeraldCustom/10 px-3 py-1 text-xs font-bold text-emeraldCustom">
                100% بدون إنترنت
              </p>
              <h1 className="text-[1.55rem] font-extrabold leading-[1.45] tracking-tight text-royal dark:text-white sm:text-[1.85rem]">
                {product.nameAr}
              </h1>
              <p className="mt-2 max-w-md text-base leading-8 text-royal/75 dark:text-slate-300">{product.tagline}</p>
            </div>

            <div className="rounded-3xl border-2 border-gold/30 bg-white p-4 shadow-luxury dark:bg-cardDark">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight text-royal dark:text-gold">{offer.price}</span>
                <span className="text-base font-bold text-royal dark:text-gold">درهم</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-royal/40 line-through dark:text-slate-500">{offer.compareAt} درهم</span>
                <span className="rounded-full bg-emeraldCustom px-2.5 py-0.5 text-xs font-bold text-white">
                  وفر {offer.save} درهم
                </span>
              </div>
              <p className="mt-3 border-t border-gold/10 pt-3 text-sm font-semibold text-royal/80 dark:text-slate-300">
                فلاشة واحدة · التوصيل مجاني لجميع المدن
              </p>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 dark:bg-cardDark">
              <p className="text-sm font-bold text-royal dark:text-white">العرض ينتهي خلال</p>
              <div className="mt-2 flex gap-2" aria-live="polite">
                {[
                  [time.h, "ساعة"],
                  [time.m, "دقيقة"],
                  [time.s, "ثانية"],
                ].map(([value, label]) => (
                  <div key={String(label)} className="min-w-[4.2rem] rounded-xl bg-royal px-2 py-2 text-center text-white dark:bg-brandDark">
                    <div className="font-cinzel text-xl font-bold">{padTime(Number(value))}</div>
                    <div className="text-[10px] text-gold-300">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-royal dark:text-slate-200">
                  <span>باقي فقط {STOCK} قطعة متوفرة في المخزون</span>
                  <span className="text-gold-600 dark:text-gold">{stockPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white dark:bg-brandDark">
                  <div className="gold-gradient h-full rounded-full" style={{ width: `${stockPct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CodForm offer={offer} onFocusCheckout={markCheckout} />
            </div>
          </div>
        </section>

        <section aria-labelledby="content-heading">
          <h2 id="content-heading" className="text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">
            شنو كاين داخل الفلاشة؟
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {product.features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-gold/20 bg-white p-5 shadow-sm dark:bg-cardDark">
                <h3 className="font-extrabold text-royal dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-royal/70 dark:text-slate-400">{feature.body}</p>
              </article>
            ))}
            {product.bullets.map((bullet) => (
              <article key={bullet} className="rounded-3xl border border-gold/20 bg-white p-5 shadow-sm dark:bg-cardDark">
                <p className="text-sm font-semibold leading-relaxed text-royal/80 dark:text-slate-300">{bullet}</p>
              </article>
            ))}
          </div>
        </section>

        <Specs />

        <ReviewGrid
          title="زبناء جرّبوها"
          subtitle="تقييمات مشترين حقيقيين بعد التوصيل والمعاينة."
          reviews={product.reviews}
        />

        <Faq />
      </main>
      <StickyCta offer={offer} onOrder={scrollToForm} />
    </div>
  );
}
