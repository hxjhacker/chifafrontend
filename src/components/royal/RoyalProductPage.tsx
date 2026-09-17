"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Droplets, Eye, ShieldCheck, Truck, XCircle } from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";
import { ProductCarousel } from "@/components/lp/ProductCarousel";
import { StickyCta } from "@/components/educative/StickyCta";
import { Faq } from "@/components/educative/Faq";
import { ReviewGrid, Stars } from "@/components/reviews/ReviewCard";
import { padTime, useOfferCountdown } from "@/hooks/useOfferCountdown";
import { scrollToOrderFields } from "@/lib/scroll";
import { trackFunnel } from "@/lib/tracking";
import {
  getRoyalTier,
  ROYAL_DEFAULT_TIER,
  ROYAL_FAQS,
  ROYAL_FEATURES,
  ROYAL_GALLERY,
  ROYAL_PACK,
  ROYAL_PACK_SLUG,
  ROYAL_REVIEWS,
  ROYAL_SPECS,
  ROYAL_STOCK,
  type RoyalTierQty,
} from "@/lib/royal-pack";
import { RoyalTierSelector } from "./RoyalTierSelector";
import { RoyalCodForm } from "./RoyalCodForm";

const STOCK_CAP = 50;

export function RoyalProductPage({ landing = false }: { landing?: boolean }) {
  const initiated = useRef(false);
  const [qty, setQty] = useState<RoyalTierQty>(ROYAL_DEFAULT_TIER);
  const time = useOfferCountdown("cg-pack-royal-offer-end");
  const tier = getRoyalTier(qty);
  const stockPct = Math.max(8, Math.round((ROYAL_STOCK / STOCK_CAP) * 100));

  const markCheckout = useCallback(() => {
    if (initiated.current) return;
    initiated.current = true;
    trackFunnel("InitiateCheckout", { value: tier.price, contentIds: [ROYAL_PACK_SLUG] });
  }, [tier.price]);

  const scrollToForm = useCallback(() => {
    markCheckout();
    scrollToOrderFields();
  }, [markCheckout]);

  useEffect(() => {
    trackFunnel("ViewContent", { value: 199, contentIds: [ROYAL_PACK_SLUG] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing
  }, []);

  return (
    <div className="bg-cream pb-28 transition-colors duration-300 dark:bg-brandDark" dir="rtl">
      <TrackPageView kind="product" productSlug={ROYAL_PACK_SLUG} />
      {landing ? (
        <div className="border-b border-gold/30 bg-royal px-4 py-2.5 text-center text-xs font-bold text-white dark:bg-cardDark md:text-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
            <span className="inline-flex animate-pulse items-center justify-center rounded-md bg-moroccoRed px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              عرض حصري
            </span>
            <span className="text-gold-100">توصيل مجاني لجميع مدن المغرب + الدفع نقدًا بعد معاينة السلعة بيدك!</span>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-extrabold text-gold-600 shadow-sm dark:bg-cardDark dark:text-gold">
                الأكثر طلباً
              </span>
            </div>
            <ProductCarousel shots={ROYAL_GALLERY} />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/20 bg-white px-3 py-1 text-sm font-bold text-royal dark:bg-cardDark dark:text-slate-100">
                <Stars />
                4.9 / 5
              </span>
              <p className="text-sm leading-relaxed text-royal/65 dark:text-slate-400">{ROYAL_PACK.reviewCountLabel}</p>
            </div>

            <div>
              <p className="mb-2 inline-flex rounded-full bg-emeraldCustom/10 px-3 py-1 text-xs font-bold text-emeraldCustom">
                شحن مجاني · الدفع عند الاستلام
              </p>
              <h1 className="text-[1.55rem] font-extrabold leading-[1.45] tracking-tight text-royal dark:text-white sm:text-[1.85rem]">
                {ROYAL_PACK.title}
              </h1>
              <p className="mt-2 max-w-md text-base leading-8 text-royal/75 dark:text-slate-300">{ROYAL_PACK.tagline}</p>
            </div>

            <div className="rounded-3xl border-2 border-gold/30 bg-white p-4 shadow-luxury dark:bg-cardDark">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight text-royal dark:text-gold">{tier.price}</span>
                <span className="text-base font-bold text-royal dark:text-gold">درهم</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-royal/40 line-through dark:text-slate-500">{tier.compareAt} درهم</span>
                <span className="rounded-full bg-emeraldCustom px-2.5 py-0.5 text-xs font-bold text-white">
                  وفر {tier.save} درهم
                </span>
              </div>
              <p className="mt-3 border-t border-gold/10 pt-3 text-sm font-semibold text-royal/80 dark:text-slate-300">
                {tier.title} · التوصيل مجاني لجميع المدن
              </p>
            </div>

            <RoyalTierSelector value={qty} onChange={setQty} />

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
                  <span>باقي فقط {ROYAL_STOCK} قطعة متوفرة في المخزون</span>
                  <span className="text-gold-600 dark:text-gold">{stockPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white dark:bg-brandDark">
                  <div className="gold-gradient h-full rounded-full" style={{ width: `${stockPct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <RoyalCodForm tier={tier} variant="product" onFocusCheckout={markCheckout} />
            </div>
          </div>
        </section>

        <section aria-labelledby="content-heading">
          <h2 id="content-heading" className="text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">
            شنو كاين داخل الباك؟
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ROYAL_FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-gold/20 bg-white p-5 shadow-sm dark:bg-cardDark">
                <h3 className="font-extrabold text-royal dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-royal/70 dark:text-slate-400">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="hook-heading">
          <h2 id="hook-heading" className="text-center text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">
            علاش الباك الملكي بدل المنشطات؟
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-royal/70 dark:text-slate-400">
            الفرق واضح: إما تأثير مؤقت كيضغط على القلب، وإلا تركيبة طبيعية كتخدم من برّا ومن الداخل.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-red-700 dark:text-red-400">
                <XCircle className="h-5 w-5" aria-hidden />
                أضرار المنشطات الكيميائية
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-red-900/80 dark:text-red-200/80">
                <li>تأثير مؤقت كيرجعك أضعف من قبل</li>
                <li>ضغط على القلب، الأعصاب، والنوم</li>
                <li>إدمان، خجل، وتكتم قدام العائلة</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-emeraldCustom/30 bg-emeraldCustom/5 p-5 dark:bg-emeraldCustom/10">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-emeraldCustom">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
                أمان التركيبة الطبيعية
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-royal/80 dark:text-slate-300">
                <li>أعشاب وعسل طبيعي بلا مواد كيميائية</li>
                <li>مفعول خارجي وداخلي كيتعاود كل نهار</li>
                <li>تغليف سري، والدفع غير من بعد المعاينة</li>
              </ul>
            </article>
          </div>
        </section>

        <section aria-labelledby="specs-heading" className="rounded-[2rem] border border-gold/20 bg-royal p-6 text-white sm:p-8 dark:bg-cardDark">
          <p className="text-sm font-bold text-gold">Natural Dual Pack</p>
          <h2 id="specs-heading" className="mt-1 text-2xl font-extrabold sm:text-3xl">
            كيفاش كيتستعمل الباك
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ROYAL_SPECS.map((spec, index) => {
              const Icon = [Droplets, ShieldCheck, Truck, Eye][index] ?? ShieldCheck;
              return (
                <article key={spec.title} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <Icon className="h-6 w-6 text-gold" aria-hidden />
                  <h3 className="mt-3 font-bold">{spec.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{spec.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <ReviewGrid
          title="زبناء جرّبوه"
          subtitle="تقييمات مشترين حقيقيين بعد التوصيل والمعاينة."
          reviews={ROYAL_REVIEWS}
        />

        <Faq items={ROYAL_FAQS} />
      </main>
      <StickyCta onOrder={scrollToForm} />
    </div>
  );
}
