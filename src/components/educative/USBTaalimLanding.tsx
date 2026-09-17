"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tv,
  WifiOff,
  ShieldCheck,
  CheckCircle2,
  Star,
  ChevronDown,
  Truck,
  Sparkles,
  FolderCheck,
  Eye,
} from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";
import { submitOrder } from "@/lib/api";
import { TAALIM_SLUG } from "@/lib/educative";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { scrollToOrderFields } from "@/lib/scroll";
import { clickIds, newEventId, trackFunnel } from "@/lib/tracking";

const SINGLE = { qty: 1 as const, price: 199, compareAt: 299 };
const FAMILY = { qty: 2 as const, price: 299, compareAt: 398 };

const fieldClass =
  "w-full rounded-2xl border border-gold/30 bg-[#FFFBFA] px-4 py-3.5 text-sm font-medium text-royal outline-none transition placeholder:text-royal/30 focus:border-gold focus:ring-2 focus:ring-gold/25";

function Ornament({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-8 bg-gradient-to-l from-gold to-transparent" />
      <p className="font-cinzel text-[10px] font-bold tracking-[0.32em] text-gold-600">{label}</p>
      <span className="h-px w-8 bg-gradient-to-r from-gold to-transparent" />
    </div>
  );
}

export function USBTaalimLanding() {
  const router = useRouter();
  const initiated = useRef(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    quantity: "1" as "1" | "2",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bundle = formData.quantity === "2" ? FAMILY : SINGLE;

  const markCheckout = useCallback(() => {
    if (initiated.current) return;
    initiated.current = true;
    trackFunnel("InitiateCheckout", {
      value: bundle.price,
      contentIds: [TAALIM_SLUG],
    });
  }, [bundle.price]);

  const scrollToForm = useCallback(() => {
    markCheckout();
    scrollToOrderFields();
  }, [markCheckout]);

  useEffect(() => {
    trackFunnel("ViewContent", { value: SINGLE.price, contentIds: [TAALIM_SLUG] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (formData.fullName.trim().length < 3) return setError("أدخل الاسم الكامل");
    if (!isTenDigitMaPhone(formData.phone)) {
      return setError("رقم الهاتف يجب أن يكون 10 أرقام، مثلا: 0612345678");
    }
    if (formData.city.trim().length < 2) return setError("أدخل اسم المدينة");
    if (formData.address.trim().length < 3) return setError("أدخل عنوان التوصيل");

    setLoading(true);
    markCheckout();
    const eventId = newEventId();
    try {
      const order = await submitOrder({
        full_name: formData.fullName.trim(),
        phone: formData.phone,
        city: formData.city.trim(),
        address: formData.address.trim(),
        product_slug: TAALIM_SLUG,
        tier_qty: bundle.qty,
        event_id: eventId,
        landing_url: window.location.href,
        ...clickIds(),
      });
      router.push(`/thank-you?order=${order.order_id}`);
    } catch {
      setError("تعذر تسجيل الطلب. حاول مرة أخرى أو تأكد من رقم الهاتف والمدينة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F4EFE6] text-royal antialiased selection:bg-gold/30 dark:bg-[#F4EFE6] dark:text-royal"
    >
      <TrackPageView kind="product" productSlug="kids" />

      <div className="border-b border-gold/40 bg-[#081526] px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-gold md:text-xs">
        <div className="flex items-center justify-center gap-2">
          <Truck className="h-3.5 w-3.5" />
          <span>توصيل مجاني لجميع مدن المغرب · الدفع عند الاستلام بعد المعاينة</span>
        </div>
      </div>

      <section
        className="relative overflow-hidden bg-royal px-4 pb-10 pt-8 text-cream"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 70% 0%, rgba(212,175,55,0.22), transparent 52%), radial-gradient(ellipse at 10% 80%, rgba(212,175,55,0.08), transparent 46%)",
        }}
      >
        <div className="mx-auto max-w-xl">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/70 bg-royal shadow-[0_0_0_3px_rgba(212,175,55,0.12)]">
                <span className="font-cinzel text-lg font-black text-gold">T</span>
              </span>
              <div>
                <span className="font-cinzel block text-[15px] font-black tracking-[0.22em] text-cream">TAALIM</span>
                <span className="block text-[9px] font-semibold tracking-[0.38em] text-gold">KIDS COLLECTION</span>
              </div>
            </div>
            <span className="rounded-full border border-gold/40 px-3 py-1 text-[10px] font-bold tracking-wide text-gold">
              متوفر الآن
            </span>
          </header>

          <div className="space-y-5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold/10 px-3.5 py-1 text-[11px] font-bold text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              الحل البديل لإدمان اليوتيوب وتضييع الوقت
            </div>
            <h1 className="text-[1.75rem] font-extrabold leading-[1.5] md:text-[2.05rem]">
              حوّل شاشة التلفاز إلى <span className="text-gold">أكبر مدرسة ذكية ومسلية</span> لطفلك في المنزل
            </h1>
            <p className="text-sm leading-8 text-cream/75 md:text-[15px]">
              مكتبة رقمية متكاملة تضم{" "}
              <strong className="font-extrabold text-cream">+1300 فيديو تعليمي هادف</strong> تأسيسي في اللغات، الحساب،
              والقرآن الكريم لمختلف المستويات (من سنتين إلى 12 سنة).
            </p>

            <div className="mx-auto max-w-md p-[1.5px] shadow-luxury" style={{ borderRadius: "1.85rem", background: "linear-gradient(135deg, #F3E9C8, #D4AF37 45%, #AA820A)" }}>
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#07101C]">
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/hero-kids.svg"
                    alt="الفلاشة التعليمية للأطفال على التلفاز"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 space-y-1 p-5 text-center">
                    <span className="font-cinzel inline-block text-[10px] font-bold tracking-[0.28em] text-gold">
                      USB PLUG & PLAY
                    </span>
                    <p className="text-sm font-semibold text-cream">تعمل بنقرة واحدة · بدون إنترنت أو اشتراكات</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-center gap-2 pt-1">
              <span className="text-3xl font-black tabular-nums text-gold">{bundle.price}</span>
              <span className="mb-1 text-sm font-bold text-cream/80">درهم</span>
              <span className="mb-1 text-sm text-cream/35 line-through tabular-nums">{bundle.compareAt} درهم</span>
            </div>

            <button
              type="button"
              onClick={scrollToForm}
              className="gold-gradient w-full rounded-2xl py-4 text-lg font-extrabold text-royal shadow-gold transition hover:brightness-105 active:scale-[0.99]"
            >
              أطلب الفلاشة الآن — الدفع عند الاستلام
            </button>

            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-cream/60">
              <li className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gold" />
                معاينة قبل الدفع
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-gold" />
                توصيل مجاني
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                ضمان سنة
              </li>
            </ul>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-xl space-y-10 px-4 pb-32 pt-10">
        <section className="grid grid-cols-2 gap-3">
          {[
            { icon: WifiOff, title: "بدون إنترنت 100%", body: "حماية كاملة من المحتوى العشوائي" },
            { icon: Tv, title: "للتلفاز والحاسوب", body: "تركب وتشتغل تلقائياً فوراً" },
            { icon: FolderCheck, title: "أكثر من 1300 فيديو", body: "منظم في مجلدات حسب المستوى" },
            { icon: ShieldCheck, title: "ضمان سنة كاملة", body: "فلاشة أصلية عالية السرعة" },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col items-center rounded-2xl border border-gold/25 bg-[#FFFBFA] p-4 text-center shadow-[0_10px_30px_-18px_rgba(11,31,58,0.35)]"
            >
              <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-extrabold text-royal">{title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-royal/55">{body}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-gold/25 bg-[#FFFBFA] p-6 shadow-luxury">
          <Ornament label="THE LIBRARY" />
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-royal">ماذا يحتوي مجلد الفلاشة بالتفصيل؟</h2>
            <p className="mt-1 text-xs text-royal/50">تم إعداد المحتوى من طرف أساتذة ومتخصصين في الطفولة المبكرة</p>
          </div>

          <ul className="space-y-3.5 text-sm leading-7 text-royal/80">
            {[
              ["الحروف واللغات:", "تأسيس العربية، الفرنسية والإنجليزية بالنطق السليم."],
              ["الرياضيات والحساب الذهني:", "الأرقام، الجمع، الطرح، والأشكال الهندسية."],
              ["التربية الإسلامية:", "قصص الأنبياء، قصار السور بالترتيل، والأذكار اليومية."],
              ["الذكاء وتنمية المهارات:", "أناشيد تربوية ورسوم متحركة تنمي التركيز."],
            ].map(([label, text]) => (
              <li key={label} className="flex items-start gap-3 border-b border-gold/10 pb-3 last:border-0 last:pb-0">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold-600" />
                <span>
                  <strong className="font-extrabold text-royal">{label}</strong> {text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <Ornament label="TESTIMONIALS" />
          <h2 className="text-center text-base font-extrabold text-royal">آراء الآباء والأمهات</h2>
          <div className="space-y-3">
            {[
              {
                name: "سارة .م",
                city: "الدار البيضاء",
                text: "بصراحة هناتني من صداع التيليفون واليوتيوب. ولدي عندو 4 سنين كيجلس يتفرج ويقلد الكلمات بالفرنسية والعربية.",
              },
              {
                name: "رشيد .ب",
                city: "طنجة",
                text: "خدمات مباشرة فالتلفزة بلا مشاكل. الفيديوهات نقية وجودة عالية والصوت واضح بزاف. شكراً ليكم.",
              },
            ].map((review) => (
              <div key={review.name} className="rounded-2xl border border-gold/25 bg-[#FFFBFA] p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-royal">
                    {review.name}{" "}
                    <span className="font-semibold text-royal/45">({review.city})</span>
                  </span>
                  <div className="flex text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-7 text-royal/70">&quot;{review.text}&quot;</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="order-section"
          className="space-y-5 rounded-[1.75rem] border border-gold/40 bg-[#FFFBFA] p-6 shadow-luxury"
        >
          <Ornament label="PRIVATE ORDER" />
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-extrabold text-royal">استمارة الطلب المباشر</h2>
            <p className="text-xs text-royal/50">أدخل معلوماتك وسنتصل بك لتأكيد الإرسال قبل الشحن</p>
          </div>

          <form id="order-form" onSubmit={handleSubmit} onFocus={markCheckout} className="space-y-4">
            <div id="order-fields" className="grid grid-cols-2 gap-2.5">
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                  formData.quantity === "1" ? "border-gold bg-gold/10 shadow-sm" : "border-gold/20 bg-[#F4EFE6]"
                }`}
              >
                <input
                  type="radio"
                  name="quantity"
                  value="1"
                  checked={formData.quantity === "1"}
                  onChange={() => setFormData({ ...formData, quantity: "1" })}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-royal/65">فلاشة واحدة</span>
                <span className="mt-1 text-lg font-black tabular-nums text-royal">{SINGLE.price} درهم</span>
                <span className="text-[10px] text-royal/35 line-through">{SINGLE.compareAt} درهم</span>
              </label>

              <label
                className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 text-center transition ${
                  formData.quantity === "2" ? "border-gold bg-gold/10 shadow-sm" : "border-gold/20 bg-[#F4EFE6]"
                }`}
              >
                <span className="pointer-events-none absolute right-0 top-0 rounded-bl-xl bg-royal px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-gold">
                  الأكثر طلباً
                </span>
                <input
                  type="radio"
                  name="quantity"
                  value="2"
                  checked={formData.quantity === "2"}
                  onChange={() => setFormData({ ...formData, quantity: "2" })}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-royal/65">فلاشتين (توفير)</span>
                <span className="mt-1 text-lg font-black tabular-nums text-royal">{FAMILY.price} درهم</span>
                <span className="text-[10px] text-royal/35 line-through">{FAMILY.compareAt} درهم</span>
              </label>
            </div>

            <div>
              <label htmlFor="taalim-name" className="mb-1.5 block text-xs font-bold text-royal">
                الاسم الكامل
              </label>
              <input
                id="taalim-name"
                required
                type="text"
                autoComplete="name"
                placeholder="مثال: محمد العلوي"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="taalim-phone" className="mb-1.5 block text-xs font-bold text-royal">
                رقم الهاتف (واتساب)
              </label>
              <input
                id="taalim-phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                maxLength={10}
                placeholder="مثال: 0612345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: digitsOnly(e.target.value).slice(0, 10) })}
                className={`${fieldClass} text-right`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="taalim-city" className="mb-1.5 block text-xs font-bold text-royal">
                  المدينة
                </label>
                <input
                  id="taalim-city"
                  required
                  type="text"
                  autoComplete="address-level2"
                  placeholder="مثال: فاس"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="taalim-address" className="mb-1.5 block text-xs font-bold text-royal">
                  عنوان التوصيل
                </label>
                <input
                  id="taalim-address"
                  required
                  type="text"
                  autoComplete="street-address"
                  placeholder="الحي أو رقم المنزل"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-royal py-3.5 text-base font-extrabold text-gold shadow-luxury transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "جاري الإرسال..." : "تأكيد الطلب الآن"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <Ornament label="FAQ" />
          <h2 className="text-center text-base font-extrabold text-royal">الأسئلة الشائعة</h2>
          <div className="space-y-2 text-sm">
            {[
              [
                "هل تعمل على جميع أنواع التلفاز؟",
                "نعم، تعمل على جميع أجهزة التلفاز التي تحتوي على منفذ USB (Smart TV والتلفاز العادي الذي يقبل مشغل الفيديو)، وكذلك الحواسيب المحمولة والمكتبية.",
              ],
              [
                "هل أحتاج إلى إنترنت لتشغيل الفيديوهات؟",
                "لا، جميع الفيديوهات محملة ومخزنة بالكامل داخل الفلاشة وتعمل بشكل فوري بدون الحاجة لأي اتصال بالإنترنت.",
              ],
              [
                "هل أدفع قبل ما نشوف الفلاشة؟",
                "لا. التوصيل لجميع المدن المغربية، والدفع عند الاستلام بعد معاينة السلعة قدام الموصّل. إلا ما عجباتكش، ما كاتخلّصش.",
              ],
            ].map(([q, a]) => (
              <details key={q} className="rounded-2xl border border-gold/25 bg-[#FFFBFA] p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-royal">
                  <span>{q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gold-600" />
                </summary>
                <p className="mt-2.5 leading-7 text-royal/65">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="pb-2 text-center font-cinzel text-[10px] tracking-[0.28em] text-royal/35">
          TAALIM KIDS · FOR THE HOME
        </p>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-[#FFFBFA]/95 backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div>
            <span className="block text-[10px] font-semibold tracking-wide text-royal/40">سعر العرض</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black tabular-nums text-royal">{bundle.price} درهم</span>
              <span className="text-[11px] text-royal/35 line-through">{bundle.compareAt} درهم</span>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="gold-gradient rounded-2xl px-7 py-2.5 text-sm font-extrabold text-royal shadow-gold transition hover:brightness-105 active:scale-95"
          >
            أطلب الآن
          </button>
        </div>
      </div>
    </div>
  );
}
