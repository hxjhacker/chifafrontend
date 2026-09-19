"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, ShieldCheck, Truck, WalletCards } from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";

const PRODUCTS = [
  { slug: "royal-honey", title: "عسل الطاقة والجينسنغ الملكي", body: "عسل بالأعشاب والجينسنغ لروتين نشاطك اليومي.", price: 149, old: 249, image: "/image/spack-royal/product3asal1.jpg", badge: "طاقة داخلية" },
  { slug: "pack-royal", title: "الباك الملكي المتكامل", body: "عسل الطاقة الحار + زيت التدليك الحراري المركز.", price: 199, old: 450, image: "/image/spack-royal/hero.jpg", badge: "العرض الناري الشامل" },
  { slug: "royal-oil", title: "زيت التدليك والنشاط المركز", body: "زيت تدليك دافئ بملمس خفيف وروتين استعمال بسيط.", price: 129, old: 199, image: "/image/spack-royal/oil.jpg", badge: "تنشيط موضعي" },
] as const;

export function HomePage() {
  return (
    <>
      <MobileHome />
      <div className="hidden md:block">
    <div className="min-h-screen bg-[#060303] pb-20 text-red-50">
      <TrackPageView kind="store" />
      <section id="hero" className="relative overflow-hidden border-b border-red-950 py-14 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[42rem] -translate-x-1/2 rounded-full bg-red-600/15 blur-[150px]" />
        <div className="relative mx-auto grid grid-cols-1 max-w-7xl gap-8 px-5 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ff2e00]/50 bg-red-950/70 px-4 py-1.5 text-xs font-black text-amber-300"><Flame className="h-4 w-4" /> طاقة ودفء طبيعيين بروتين مختار</p>
            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl">فجّر طاقتك الكامنة<span className="fire-gradient-text mt-2 block">بعروض القوة والنشاط الملكية</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300">خلطات مختارة للرجال: عسل الطاقة بالأعشاب، زيت تدليك مركز، أو الباك المتكامل. توصيل سري مجاني ودفع نقداً بعد معاينة الكولي.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#products" className="fire-button rounded-xl px-8 py-4 text-center font-black text-white">اكتشف العروض الآن</a><a href="#mechanism" className="rounded-xl border border-red-900 bg-[#0e0707] px-8 py-4 text-center font-bold text-amber-200">علاش شيفا جلو Homme؟</a></div>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-red-950 pt-7 text-center"><div><b className="fire-gradient-text text-xl">100%</b><p className="mt-1 text-[10px] text-stone-400">تغليف سري</p></div><div><b className="text-xl text-amber-300">24–48H</b><p className="mt-1 text-[10px] text-stone-400">توصيل سريع</p></div><div><b className="text-xl text-white">4.9/5</b><p className="mt-1 text-[10px] text-stone-400">تقييمات الزبناء</p></div></div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-red-900/70 bg-gradient-to-b from-[#180c0a] to-[#0e0707] p-5 shadow-[0_0_55px_-10px_rgba(255,46,0,.65)]">
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-l from-[#ff2e00] to-[#ff6a00] px-4 py-1 text-xs font-black">الأكثر طلباً 🔥</span>
              <img src="/image/spack-royal/hero.jpg" alt="الباك الملكي المتكامل" className="mx-auto aspect-square w-full rounded-2xl bg-black object-cover p-3" width={600} height={600} />
              <div className="mt-5 flex items-center justify-between"><div><h2 className="font-black text-white">الباك الملكي المتكامل</h2><p className="mt-1 text-xs text-stone-400">عسل الطاقة + زيت التدليك</p></div><div className="text-left"><b className="fire-gradient-text text-3xl">199 درهم</b><del className="block text-xs text-stone-500">450 درهم</del></div></div>
              <div className="mt-5 flex justify-between border-t border-red-950 pt-4 text-xs font-bold"><span className="text-emerald-400">● متبقي 7 حبات فقط</span><span className="text-amber-300">توفير 251 درهم</span></div>
            </div>
          </div>
        </div>
      </section>
      <section id="mechanism" className="border-b border-red-950 bg-[#0e0707] py-16"><div className="mx-auto max-w-6xl px-5"><div className="mx-auto max-w-2xl text-center"><span className="text-xs font-black tracking-[.2em] text-[#ff6a00]">CHIFAGLOW HOMME</span><h2 className="mt-3 text-3xl font-black text-white">روتين بسيط من الداخل والخارج</h2><p className="mt-3 text-sm text-stone-400">اختار العسل، الزيت، أو الباك الكامل حسب روتينك اليومي.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-red-950 bg-[#150a09] p-7"><span className="text-3xl">🍯</span><h3 className="mt-4 text-xl font-black text-white">عسل الطاقة بالأعشاب</h3><p className="mt-3 text-sm leading-relaxed text-stone-400">تركيبة عسل وجينسنغ تناسب روتين النشاط اليومي.</p></article><article className="rounded-3xl border border-red-950 bg-[#150a09] p-7"><span className="text-3xl">🌿</span><h3 className="mt-4 text-xl font-black text-white">زيت التدليك المركز</h3><p className="mt-3 text-sm leading-relaxed text-stone-400">زيت دافئ سريع الامتصاص للاستعمال الموضعي مع تدليك خفيف.</p></article></div></div></section>
      <section id="products" className="mx-auto max-w-7xl px-5 py-20"><div className="mx-auto mb-14 max-w-2xl text-center"><span className="text-xs font-black tracking-[.2em] text-[#ff2e00]">LES FORMULES</span><h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">عروض القوة والنشاط للرجال</h2><p className="mt-3 text-sm text-stone-400">شحن مجاني، تغليف سري، ومعاينة قبل الأداء.</p></div><div className="grid gap-7 md:grid-cols-3">{PRODUCTS.map((product) => <article key={product.slug} className={`flex flex-col justify-between rounded-3xl border p-6 ${product.slug === "pack-royal" ? "border-[#ff2e00]/70 bg-gradient-to-b from-[#220b08] to-[#0e0707] shadow-[0_0_45px_-10px_rgba(255,46,0,.7)] md:-translate-y-5" : "border-red-950 bg-[#0e0707]"}`}><div><span className="inline-flex rounded-md border border-red-900 bg-red-950/50 px-3 py-1 text-[10px] font-black text-amber-300">{product.badge}</span><img src={product.image} alt={product.title} className="mt-4 h-52 w-full rounded-2xl bg-black object-cover p-3" width={360} height={260} /><h3 className="mt-5 text-xl font-black text-white">{product.title}</h3><p className="mt-2 text-sm leading-relaxed text-stone-400">{product.body}</p></div><div className="mt-7 border-t border-red-950 pt-4"><div className="flex items-end justify-between"><div><b className="fire-gradient-text text-2xl">{product.price} درهم</b><del className="mr-2 text-xs text-stone-500">{product.old}</del></div><span className="text-xs font-bold text-emerald-400">شحن مجاني</span></div><Link href={`/products/${product.slug}`} className="fire-button mt-4 block rounded-xl py-3 text-center text-sm font-black text-white">اطلب الآن</Link></div></article>)}</div></section>
      <section id="reviews" className="border-t border-red-950 bg-[#0e0707] py-14"><div className="mx-auto max-w-6xl px-5"><h2 className="text-center text-2xl font-black text-white">ضمانات تريحك فكل طلب</h2><div className="mt-8 grid gap-4 sm:grid-cols-3">{[[ShieldCheck, "قلب بيدك عاد خلص"], [Truck, "توصيل سري ومجاني"], [WalletCards, "الدفع عند الاستلام"]].map(([Icon, text]) => { const Component = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center justify-center gap-3 rounded-2xl border border-red-950 bg-[#150a09] p-5 text-sm font-bold text-stone-200"><Component className="h-5 w-5 text-amber-400" />{String(text)}</div>; })}</div></div></section>
    </div>
      </div>
    </>
  );
}

function MobileHome() {
  const [playing, setPlaying] = useState<number | null>(null);
  const cards = [
    { slug: "pack-royal", title: "الباك الملكي (عسل + زيت)", body: "عرض متكامل من الداخل والخارج.", price: 199, image: "/image/spack-royal/hero.jpg", badge: "العرض الشامل" },
    { slug: "royal-honey", title: "عسل الطاقة والجينسنغ", body: "عسل بالأعشاب لروتين النشاط اليومي.", price: 149, image: "/image/spack-royal/product3asal1.jpg", badge: "من الداخل" },
    { slug: "royal-oil", title: "زيت التدليك المركز", body: "زيت دافئ للاستعمال الموضعي والتدليك.", price: 129, image: "/image/spack-royal/oil.jpg", badge: "موضعي" },
  ] as const;
  return (
    <div className="block min-h-screen bg-[#070404] pb-28 text-[#FEE2E2] md:hidden">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-red-900/60 bg-gradient-to-r from-red-950 via-black to-red-950 px-3 py-2 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-amber-100"><i className="h-2 w-2 animate-ping rounded-full bg-[#FF2E00]" />توصيل سري مجاني · الدفع عند الاستلام</span>
        <span className="rounded-full border border-red-700 bg-red-900/90 px-2 py-0.5 text-[9px] text-white">باقي 7 حبات</span>
      </div>
      <header className="flex items-center justify-between border-b border-red-950/60 bg-[#070404]/95 px-4 py-3">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#FF6A00]/40 bg-gradient-to-br from-[#FF2E00] to-black font-cinzel text-base font-black text-amber-300">C</div><div><b className="font-cinzel block text-base tracking-wider text-white">CHIFAGLOW</b><span className="block text-[8px] font-black tracking-[.25em] text-[#FF6A00]">POUR HOMME</span></div></div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-stone-400">⭐ 4.9 (1.4k تقييم)</span>
      </header>
      <main>
        <section className="relative px-4 pb-2 pt-4 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FF2E00]/40 bg-red-950/80 px-2.5 py-0.5 text-[10px] font-black text-amber-300">🔥 طاقة ودفء طبيعيين</span>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white">روتين قوة ونشاط للرجال<span className="fire-gradient-text mt-0.5 block text-3xl">اختار العرض المناسب لك</span></h1>
          <p className="mt-1.5 px-2 text-[11px] leading-snug text-stone-400">عسل الطاقة بالأعشاب + زيت التدليك المركز. شحن سري ودفع بعد المعاينة.</p>
          <div className="relative mt-4 rounded-2xl border border-[#FF2E00]/40 bg-gradient-to-b from-[#180907] to-[#100707] p-3.5 text-right shadow-xl">
            <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-l from-[#FF2E00] to-[#FF6A00] px-2.5 py-0.5 text-[9px] font-black text-white">الأكثر طلباً وتوفيراً 🔥</span>
            <div className="flex h-44 items-center justify-center rounded-xl border border-red-950 bg-black/80 p-2"><img src="/image/spack-royal/hero.jpg" alt="الباك الملكي المتكامل" className="h-full w-full rounded-2xl object-cover" /></div>
            <div className="mt-3 flex items-center justify-between"><div><h2 className="text-sm font-black text-white">الباك الملكي المتكامل</h2><p className="text-[10px] text-stone-400">عسل الطاقة + زيت التدليك</p></div><div className="text-left"><b className="fire-gradient-text text-2xl">199 د.م</b><del className="mr-1 text-[10px] text-stone-500">450</del><span className="block text-[9px] font-bold text-amber-300">توفير 251 درهم</span></div></div>
            <Link href="/products/pack-royal" className="fire-button mt-3 block rounded-xl py-3 text-center text-sm font-black text-white">اطلب الباك الآن — 199 درهم ⚡</Link>
            <div className="mt-2 flex justify-between px-1 text-[9px] font-bold text-stone-400"><span className="text-emerald-400">● متوفر في المخزون</span><span>📦 المعاينة قبل الأداء</span></div>
          </div>
        </section>
        <section className="mt-6">
          <div className="mb-2.5 flex items-center justify-between px-4"><b className="text-xs text-white">اختر العرض المناسب لك:</b><span className="text-[10px] font-bold text-[#FF6A00]">← مرر لليمين واليسار</span></div>
          <div id="products" className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {cards.map((card) => <article key={card.slug} className={`relative w-[78vw] shrink-0 snap-center rounded-2xl border p-3.5 ${card.slug === "pack-royal" ? "border-2 border-[#FF2E00] bg-gradient-to-b from-[#1c0a07] to-[#100707]" : "border-red-950 bg-[#100707]"}`}><span className="absolute left-2.5 top-2.5 rounded-full bg-stone-800 px-2 py-0.5 text-[8px] font-black text-amber-300">{card.badge}</span><div className="mb-2.5 flex h-32 items-center justify-center rounded-xl bg-black/60 p-2"><img src={card.image} alt="" className="h-full w-full rounded-2xl object-cover" /></div><h3 className="text-xs font-black text-white">{card.title}</h3><p className="mt-0.5 line-clamp-2 text-[10px] text-stone-400">{card.body}</p><div className="mt-2.5 flex items-center justify-between border-t border-red-950 pt-2"><b className={card.slug === "pack-royal" ? "fire-gradient-text text-base" : "text-base text-white"}>{card.price} درهم</b><Link href={`/products/${card.slug}`} className={card.slug === "pack-royal" ? "fire-button rounded-lg px-3.5 py-1.5 text-[10px] font-black text-white" : "rounded-lg bg-stone-800 px-3 py-1.5 text-[10px] font-black text-white"}>اطلب الآن</Link></div></article>)}
          </div>
        </section>
        <section className="mt-7 px-4"><div className="rounded-2xl border border-red-950 bg-[#100707] p-4"><span className="block text-[10px] font-black text-[#FF2E00]">روتين مزدوج</span><h3 className="mt-1 text-sm font-black text-white">العسل للطاقة اليومية والزيت للتدليك الموضعي</h3><div className="mt-3 space-y-2.5 text-xs"><div className="rounded-xl border border-red-950 bg-black/50 p-2.5"><b className="text-[11px] text-white">🍯 طاقة من الداخل</b><p className="mt-0.5 text-[10px] text-stone-400">عسل بالأعشاب والجينسنغ كجزء من روتين النشاط اليومي.</p></div><div className="rounded-xl border border-red-950 bg-black/50 p-2.5"><b className="text-[11px] text-white">🌿 تدليك وراحة موضعية</b><p className="mt-0.5 text-[10px] text-stone-400">زيت مركز للاستعمال الموضعي مع تدليك خفيف.</p></div></div></div></section>
        <section className="mt-7 px-4"><div className="mb-3 flex items-center justify-between"><b className="text-xs text-white">تجارب زبنائنا بالصوت 🇲🇦</b><span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-[9px] font-bold text-emerald-400">زبناء حقيقيون</span></div><div className="space-y-2.5">{["يوسف · كازا", "رشيد · طنجة"].map((name, index) => <div key={name} className="rounded-2xl border border-[#202C33] bg-[#111B21] p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A884] text-xs font-black">{name[0]}</span><span><b className="block text-xs text-white">{name}</b><small className="text-[9px] text-[#8696A0]">الباك الملكي الشامل</small></span></div><small className="text-[9px] font-bold text-[#00A884]">✓ تم الاستلام</small></div><button type="button" onClick={() => setPlaying(playing === index ? null : index)} className="mt-2 flex w-full items-center gap-3 rounded-xl bg-[#202C33] px-3 py-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A884] text-xs text-white">{playing === index ? "❚❚" : "▶"}</span><span className="h-1 flex-1 rounded bg-gradient-to-l from-[#00A884] to-[#8696A0]" /><small className="text-[10px] text-[#8696A0]">0:{index ? "24" : "18"}</small></button></div>)}</div></section>
        <section className="mt-6 grid grid-cols-2 gap-2 px-4 text-center text-[10px] font-bold">{["🔍 قلب بيدك عاد خلص", "🔒 سرية تامة فالكرطونة", "🌿 تركيبة مختارة", "🚚 توصيل 24 إلى 48 ساعة"].map((item) => <div key={item} className="rounded-xl border border-red-950 bg-[#100707] p-2.5 text-white">{item}</div>)}</section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-red-900/80 bg-[#070404]/98 px-4 py-2.5 shadow-2xl backdrop-blur-lg"><div><small className="block text-[10px] font-bold text-stone-400">الباك الملكي الشامل</small><b className="fire-gradient-text text-xl">199 درهم</b><del className="mr-1 text-[10px] text-stone-500">450</del></div><Link href="/products/pack-royal" className="fire-button flex items-center gap-1.5 rounded-xl px-6 py-3 text-xs font-black text-white animate-pulse">اطلب الباك الآن <span>⚡</span></Link></div>
    </div>
  );
}
