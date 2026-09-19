"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
        <section className="mt-14 grid gap-3 sm:grid-cols-3">{[[ShieldCheck, "قلب بيدك عاد خلص"], [Truck, "توصيل مجاني وسري"], [Flame, "عرض حصري محدود"]].map(([Icon, text]) => { const Component = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 rounded-2xl border border-red-950 bg-[#0e0707] p-4 text-sm font-bold"><Component className="h-5 w-5 text-[#FFAE00]" />{String(text)}</div>; })}</section>
      </main>
      <a href={waLink("سلام Chifaglow Homme، بغيت نطلب الباك الملكي.")} target="_blank" rel="noreferrer" aria-label="تواصل عبر واتساب" className="wa-pulse fixed bottom-24 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-[#25D366] text-white shadow-2xl"><WhatsAppIcon className="h-7 w-7" /></a>
      <button type="button" onClick={() => { markCheckout(); scrollToOrderFields(); }} className="fire-button fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-4 py-3 md:hidden"><span className="text-right"><small className="block text-[10px] text-white/75">الباك الملكي المتكامل</small><b className="text-lg text-white">{product.price} درهم</b></span><span className="rounded-lg bg-black/20 px-4 py-2 text-xs font-black text-white">اطلب الآن ⚡</span></button>
    </div>
  );
}
