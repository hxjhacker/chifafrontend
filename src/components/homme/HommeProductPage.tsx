"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { getProduct } from "@/lib/products";
import { TrackPageView } from "@/components/TrackPageView";
import { trackFunnel, clickIds, newEventId } from "@/lib/tracking";
import { submitOrder } from "@/lib/api";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { scrollToOrderFields } from "@/lib/scroll";
import { waLink, WhatsAppIcon } from "@/components/Chrome";

const PACK_IMAGES = [
  "/image/spack-royal/hero.jpg",
  "/image/spack-royal/features.jpg",
  "/image/spack-royal/ingredients.jpg",
  "/image/spack-royal/productpak1.jpg",
  "/image/spack-royal/productpak2.jpg",
  "/image/spack-royal/productpak3.jpg",
  "/image/spack-royal/productpak4.jpg",
] as const;

export function HommeProductPage({ slug }: { slug: string }) {
  const product = getProduct(slug);
  const initiated = useRef(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const images = product?.slug === "pack-royal" ? PACK_IMAGES : product ? [product.heroImage, ...product.gallery] : [];
  const activeImage = images[currentImageIndex] ?? images[0];

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [slug]);

  useEffect(() => {
    if (images.length < 2) return;
    const interval = window.setInterval(() => {
      setCurrentImageIndex((index) => (index + 1) % images.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [images.length]);

  const markCheckout = useCallback(() => {
    if (!product || initiated.current) return;
    initiated.current = true;
    trackFunnel("InitiateCheckout", { value: product.price, contentIds: [product.slug] });
  }, [product]);

  useEffect(() => {
    if (product) trackFunnel("ViewContent", { value: product.price, contentIds: [product.slug] });
  }, [product]);

  function changeImage(direction: -1 | 1) {
    setCurrentImageIndex((index) => (index + direction + images.length) % images.length);
  }

  async function submitCod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setError("");
    if (name.trim().length < 3) return setError("كتب الاسم الكامل");
    if (!isTenDigitMaPhone(phone)) return setError("رقم الهاتف خاصو يكون 10 أرقام بالضبط، مثلا: 06XXXXXXXX");
    if (city.trim().length < 2) return setError("كتب اسم المدينة");
    if (address.trim().length < 3) return setError("كتب العنوان بالتفصيل");
    setLoading(true);
    markCheckout();
    try {
      const order = await submitOrder({
        full_name: name.trim(),
        phone,
        city: city.trim(),
        address: address.trim(),
        product_slug: product.slug,
        tier_qty: 1,
        event_id: newEventId(),
        landing_url: window.location.href,
        ...clickIds(),
      });
      window.location.assign(`/thank-you?order=${order.order_id}`);
    } catch {
      setError("ما قدرناش نسجّلو الطلب. جرّب مرة أخرى أو تأكد من البيانات.");
    } finally {
      setLoading(false);
    }
  }

  if (!product || !activeImage) return null;

  return (
    <div className="min-h-screen bg-[#060303] pb-28 text-[#FEE2E2]" dir="rtl">
      <TrackPageView kind="product" productSlug={product.slug} />
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-12">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#FF2E00]/50 bg-red-950/70 px-3 py-1 text-xs font-black text-[#FFAE00]">
              <Flame className="h-3.5 w-3.5" /> الأكثر طلباً بالمغرب
            </span>
            <div className="relative mt-4 overflow-hidden rounded-3xl border border-red-900/70 bg-black p-3 shadow-[0_0_50px_-12px_rgba(255,46,0,.55)]">
              <img src={activeImage} alt={`${product.nameAr} - صورة ${currentImageIndex + 1}`} className="aspect-square w-full rounded-2xl object-cover" width={720} height={720} />
              <button type="button" onClick={() => changeImage(1)} aria-label="الصورة السابقة" className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/65 p-2 text-white backdrop-blur hover:bg-[#FF2E00]"><ChevronRight className="h-5 w-5" /></button>
              <button type="button" onClick={() => changeImage(-1)} aria-label="الصورة التالية" className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/65 p-2 text-white backdrop-blur hover:bg-[#FF2E00]"><ChevronLeft className="h-5 w-5" /></button>
            </div>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="صور المنتج">
              {images.map((image, index) => (
                <button key={image} type="button" role="tab" aria-selected={currentImageIndex === index} onClick={() => setCurrentImageIndex(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black p-0.5 ${currentImageIndex === index ? "border-2 border-[#FF2E00]" : "border border-red-950"}`}>
                  <img src={image} alt="" className="h-full w-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-red-900 bg-[#0e0707] px-3 py-1 text-sm font-bold text-[#FFAE00]">⭐ 4.9 / 5</span><span className="text-xs text-stone-400">أكثر من 420 طلب مؤكد بالمغرب</span></div>
            <span className="mt-5 inline-flex rounded-full border border-emerald-800 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-400">شحن مجاني · قلب بيدك عاد خلص</span>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">{product.nameAr}</h1>
            <p className="mt-3 max-w-xl text-base leading-8 text-stone-300">{product.description}</p>
            <div className="mt-5 rounded-3xl border border-red-900/70 bg-[#0e0707] p-5">
              <div className="flex items-baseline gap-2"><span className="fire-gradient-text text-5xl font-black">{product.price}</span><span className="font-bold text-[#FFAE00]">درهم</span></div>
              <div className="mt-2 flex gap-2 text-sm"><span className="text-stone-500 line-through">{product.compareAt} درهم</span><span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">وفر {product.compareAt - product.price} درهم</span></div>
            </div>

            <section id="order-form" className="mt-6 rounded-[2rem] border border-red-900/70 bg-gradient-to-b from-[#170908] to-[#0e0707] p-5 shadow-[0_0_35px_-8px_rgba(255,46,0,.5)] sm:p-7">
              <h2 className="text-xl font-black text-white sm:text-2xl">أكّد طلبك الآن — الدفع عند الاستلام</h2>
              <p className="mt-1 text-xs text-stone-400">ما كتخلّص حتى كتشوف السلعة قدام الموزع.</p>
              <form onSubmit={submitCod} onFocus={markCheckout} className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between rounded-xl border border-red-900/50 bg-black/60 px-4 py-3"><span className="text-xs font-bold text-stone-400">المجموع مع التوصيل</span><span className="fire-gradient-text text-xl font-black">{product.price} درهم</span></div>
                <label className="block text-xs font-bold text-stone-300">الاسم الكامل<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required className="homme-input" /></label>
                <label className="block text-xs font-bold text-stone-300">رقم الهاتف<input value={phone} onChange={(event) => setPhone(digitsOnly(event.target.value).slice(0, 10))} maxLength={10} type="tel" inputMode="tel" dir="ltr" placeholder="06XXXXXXXX" required className="homme-input text-right" /></label>
                <label className="block text-xs font-bold text-stone-300">المدينة<input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" placeholder="كتب اسم المدينة" required className="homme-input" /></label>
                <label className="block text-xs font-bold text-stone-300">العنوان<input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="الحي، الشارع، رقم المنزل" required className="homme-input" /></label>
                {error ? <p role="alert" className="text-sm font-semibold text-red-400">{error}</p> : null}
                <button disabled={loading} className="fire-button w-full rounded-xl py-4 text-sm font-black text-white disabled:opacity-60">{loading ? "كنسجّلو الطلب…" : `تأكيد الطلب · ${product.price} درهم`}</button>
              </form>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-stone-300"><span className="rounded-lg border border-stone-800 bg-black/50 p-2">تغليف سري</span><span className="rounded-lg border border-stone-800 bg-black/50 p-2">معاينة قبل الدفع</span><span className="rounded-lg border border-stone-800 bg-black/50 p-2">توصيل 24–48 ساعة</span></div>
            </section>
          </div>
        </section>
        {product.slug === "pack-royal" ? <PackSalesSections /> : null}
        <section className="mt-14 grid gap-3 sm:grid-cols-3">{[[ShieldCheck, "قلب بيدك عاد خلص"], [Truck, "توصيل مجاني وسري"], [Flame, "عرض حصري محدود"]].map(([Icon, text]) => { const Component = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 rounded-2xl border border-red-950 bg-[#0e0707] p-4 text-sm font-bold"><Component className="h-5 w-5 text-[#FFAE00]" />{String(text)}</div>; })}</section>
        {product.slug !== "pack-royal" ? <StandalonePackUpsell /> : null}
      </main>
      <a href={waLink("سلام Chifaglow Homme، بغيت نطلب الباك الملكي.")} target="_blank" rel="noreferrer" aria-label="تواصل عبر واتساب" className="wa-pulse fixed bottom-24 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-[#25D366] text-white shadow-2xl"><WhatsAppIcon className="h-7 w-7" /></a>
      <button type="button" onClick={() => { markCheckout(); scrollToOrderFields(); }} className="fire-button fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-4 py-3 md:hidden"><span className="text-right"><small className="block text-[10px] text-white/75">الباك الملكي المتكامل</small><b className="text-lg text-white">{product.price} درهم</b></span><span className="rounded-lg bg-black/20 px-4 py-2 text-xs font-black text-white">اطلب الآن ⚡</span></button>
    </div>
  );
}

function StandalonePackUpsell() {
  return (
    <section className="mt-14 overflow-hidden rounded-[2rem] border border-[#FF2E00]/60 bg-gradient-to-l from-[#210b08] via-[#0e0707] to-[#060303] p-6 shadow-[0_0_45px_-12px_rgba(255,46,0,.7)] sm:p-9">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <span className="inline-flex rounded-full bg-[#FF2E00] px-3 py-1 text-[10px] font-black text-white">عرض الترقية الحصري</span>
          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">باغي النتيجة القصوى والمضاعفة؟ 🔥</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">استفد من عرض الباك الملكي المتكامل (عسل الطاقة + زيت التدليك) بـ <b className="text-[#FFAE00]">199 درهم فقط</b> عوض <del className="text-stone-500">450 درهم</del>.</p>
          <div className="mt-4 flex items-center gap-3 text-xs font-bold"><span className="text-emerald-400">✓ توصيل مجاني</span><span className="text-emerald-400">✓ تغليف سري</span><span className="text-emerald-400">✓ معاينة قبل الأداء</span></div>
        </div>
        <Link href="/products/pack-royal" className="fire-button inline-flex items-center justify-center rounded-xl px-7 py-4 text-center text-sm font-black text-white">اكتشف الباك الملكي — 199 درهم</Link>
      </div>
    </section>
  );
}

const VOICE_REVIEWS = [
  { name: "كريم", city: "الرباط", src: "/odio/odio1.mp3", fallback: "/odio/odio1" },
  { name: "يوسف", city: "أزرو", src: "/odio/odio2.mp3", fallback: "/odio/odio2" },
  { name: "رشيد", city: "الدار البيضاء", src: "/odio/odio3.mp3", fallback: "/odio/odio3" },
] as const;

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function VoiceNoteReviews() {
  const [currentPlaying, setCurrentPlaying] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });
  const [durations, setDurations] = useState<Record<number, string>>({ 0: "0:00", 1: "0:00", 2: "0:00" });
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio?.pause();
      });
    };
  }, []);

  function pauseOthers(except: number) {
    audioRefs.current.forEach((audio, index) => {
      if (!audio || index === except) return;
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function togglePlay(index: number) {
    const audio = audioRefs.current[index];
    if (!audio) return;
    if (currentPlaying === index && !audio.paused) {
      audio.pause();
      setCurrentPlaying(null);
      return;
    }
    pauseOthers(index);
    void audio.play().then(() => setCurrentPlaying(index)).catch(() => setCurrentPlaying(null));
  }

  return (
    <section id="reviews">
      <p className="text-xs font-black tracking-[.2em] text-[#FF2E00]">TÉMOIGNAGES CLIENTS</p>
      <h2 className="mt-2 text-2xl font-black text-white">آراء الزبناء</h2>
      <p className="mt-1 text-sm text-stone-400">تسجيلات صوتية حقيقية عبر واتساب بعد الاستلام والمعاينة.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {VOICE_REVIEWS.map((review, index) => {
          const playing = currentPlaying === index;
          const pct = progress[index] ?? 0;
          return (
            <article key={review.src} className="rounded-3xl border border-[#202C33] bg-[#111B21] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A884] font-black text-white">{review.name[0]}</span>
                  <div>
                    <h3 className="font-bold text-white">{review.name} • {review.city}</h3>
                    <p className="text-[10px] text-[#8696A0]">الباك الملكي المتكامل</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold text-emerald-400">مشترٍ موثق ✓</span>
              </div>
              <audio
                ref={(el) => {
                  audioRefs.current[index] = el;
                }}
                preload="metadata"
                src={review.src}
                onError={(event) => {
                  const el = event.currentTarget;
                  if (el.dataset.fallbackTried === "1") return;
                  el.dataset.fallbackTried = "1";
                  el.src = review.fallback;
                }}
                onLoadedMetadata={(event) => {
                  setDurations((prev) => ({ ...prev, [index]: formatClock(event.currentTarget.duration) }));
                }}
                onTimeUpdate={(event) => {
                  const el = event.currentTarget;
                  const ratio = el.duration ? (el.currentTime / el.duration) * 100 : 0;
                  setProgress((prev) => ({ ...prev, [index]: ratio }));
                  setDurations((prev) => ({ ...prev, [index]: formatClock(el.duration - el.currentTime || el.duration) }));
                }}
                onEnded={() => {
                  setCurrentPlaying((current) => (current === index ? null : current));
                  setProgress((prev) => ({ ...prev, [index]: 0 }));
                }}
              />
              <button
                type="button"
                onClick={() => togglePlay(index)}
                aria-label={playing ? `إيقاف تسجيل ${review.name}` : `تشغيل تسجيل ${review.name}`}
                className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-[#202C33] bg-[#202C33] p-3 text-right"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#00A884] text-xs text-white ${playing ? "animate-pulse" : ""}`}>
                  {playing ? "❚❚" : "▶"}
                </span>
                <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-[#1a2730]">
                  <span className="absolute inset-y-0 right-0 rounded-full bg-[#00A884] transition-[width] duration-150" style={{ width: `${Math.max(playing ? 8 : 0, pct)}%` }} />
                  <span className={`absolute inset-0 flex items-center justify-center gap-0.5 ${playing ? "opacity-100" : "opacity-40"}`}>
                    {[6, 12, 8, 16, 10, 14, 7, 18, 9, 13, 8, 15].map((h, bar) => (
                      <span
                        key={bar}
                        className="w-0.5 rounded-full bg-[#d1f4ea]"
                        style={{
                          height: `${h}px`,
                          animation: playing ? `pulse ${0.7 + (bar % 4) * 0.12}s ease-in-out infinite` : "none",
                        }}
                      />
                    ))}
                  </span>
                </span>
                <small className="min-w-[2.5rem] text-xs font-bold text-[#8696A0]">{durations[index] ?? "0:00"}</small>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PackSalesSections() {
  const contents = [
    ["🌿", "زيت التدليك المركز", "دهن موضعي حار سريع الامتصاص، كينشط الدورة الدموية ويسخن الأنسجة لصلابة وراحة فورية بلا ملمس دهني مزعج."],
    ["🍯", "عسل الطاقة بالأعشاب", "ملعقة صغيرة يومياً ترفع النشاط والتحمل، وكتحارب الفشلة والعياء باش ترجع الثقة والحرارة بشكل مستمر وطبيعي."],
    ["🛡️", "تركيبة طبيعية 100%", "أعشاب وعسل حر بلا مواد كيميائية، آمنة ومريحة، بلا إدمان وبلا أعراض جانبية."],
    ["📦", "تغليف سري والمعاينة بيدك", "الطلب كيوصلك فـ كرتونة مسدودة، وتخلص بعد المعاينة أمام الموزع."],
  ] as const;
  const steps = [
    ["1", "استعمال موضعي (الزيت)", "دهن موضعي مع تدليك خفيف، سريع الامتصاص."],
    ["2", "مكمل يومي (العسل)", "ملعقة صغيرة يومياً لطرد العياء طوال اليوم."],
    ["3", "شحن سري ومجاني", "تغليف محكم لا يكشف المحتوى."],
    ["4", "المعاينة قبل الدفع", "الدفع نقداً بعد فتح الطرد والتأكد منه."],
  ] as const;
  return (
    <div className="mt-16 space-y-16 border-t border-red-950 pt-12">
      <section>
        <p className="text-xs font-black tracking-[.2em] text-[#FF6A00]">ROYAL PACK CONTENTS</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">مكونات الباك الملكي</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contents.map(([icon, title, body]) => <article key={title} className="rounded-3xl border border-red-950 bg-[#0e0707] p-5 shadow-[0_0_28px_-15px_rgba(255,46,0,.7)]"><span className="text-2xl">{icon}</span><h3 className="mt-3 font-black text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-stone-400">{body}</p></article>)}
        </div>
      </section>

      <section>
        <h2 className="text-center text-2xl font-black text-white sm:text-3xl">علاش تختار الباك الملكي بدل المواد الكيماوية؟</h2>
        <div className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-red-900/70 bg-red-950/20 p-6"><h3 className="font-black text-red-400">✕ أضرار المنشطات الكيميائية</h3><ul className="mt-4 space-y-2 text-sm text-stone-300"><li>• تأثير مؤقت وسريع</li><li>• إجهاد القلب والأعصاب</li><li>• صداع وإحراج</li></ul></article>
          <article className="rounded-3xl border border-emerald-800/60 bg-emerald-950/20 p-6"><h3 className="font-black text-emerald-400">✓ أمان وفاعلية التركيبة الملكية</h3><ul className="mt-4 space-y-2 text-sm text-stone-300"><li>• أعشاب بلدية وعسل نقي</li><li>• مفعول داخلي وخارجي</li><li>• تغليف سري ودفع بعد المعاينة</li></ul></article>
        </div>
      </section>

      <section className="rounded-3xl border border-red-950 bg-[#0e0707] p-6 sm:p-8">
        <p className="text-xs font-black tracking-[.2em] text-[#FF6A00]">DUAL PACK INSTRUCTIONS</p>
        <h2 className="mt-2 text-2xl font-black text-white">طريقة الاستعمال</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([number, title, body]) => <article key={number} className="rounded-2xl border border-stone-800 bg-black/50 p-4"><span className="fire-gradient-text text-xl font-black">{number}</span><h3 className="mt-2 text-sm font-black text-[#FFAE00]">{title}</h3><p className="mt-2 text-xs leading-relaxed text-stone-400">{body}</p></article>)}
        </div>
      </section>

      <VoiceNoteReviews />

      <section>
        <h2 className="text-2xl font-black text-white">الأسئلة الشائعة</h2>
        <div className="mt-5 max-w-4xl space-y-3">
          {[
            ["شنو كاين داخل الباك الملكي المتكامل؟", "زيت التدليك المركز للاستعمال الموضعي وعسل الطاقة بالأعشاب كمكمل يومي."],
            ["واش نقدر نعاين السلعة قبل ما نخلص؟", "آه، كتفتح الكولي وكتتأكد من المنتوج قدام الموزع قبل ما تخلّص."],
            ["واش التغليف كيكون سري؟", "نعم، الطلب كيوصل فـ كرتونة محايدة ومسدودة لا تكشف محتوى الكولي."],
          ].map(([question, answer]) => <details key={question} className="group rounded-2xl border border-red-950 bg-[#0e0707] p-5"><summary className="flex cursor-pointer items-center justify-between font-bold text-white">{question}<span className="text-[#FF2E00] transition group-open:rotate-180">▼</span></summary><p className="mt-3 text-sm leading-relaxed text-stone-400">{answer}</p></details>)}
        </div>
      </section>
    </div>
  );
}
