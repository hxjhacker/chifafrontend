"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Star, Truck } from "lucide-react";
import { useCart, type TierQty } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import { PricingSelector } from "./PricingSelector";

export function ProductLanding({ slug }: { slug: string }) {
  const product = getProduct(slug);
  const cart = useCart();
  const [qty, setQty] = useState<TierQty>(2);
  const stock = useMemo(() => 18 + (slug.length % 7), [slug]);

  if (!product) return <p className="p-8">المنتج غير موجود.</p>;

  return (
    <main>
      <div className="bg-royal py-2 text-center text-sm text-gold-300">
        الكمية محدودة اليوم — باقي غير {stock} قطعة · التوصيل مجاني لجميع مدن المغرب
      </div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-8 md:grid-cols-2">
        <img src={product.heroImage} alt={product.nameAr} className="w-full" width={640} height={480} />
        <div>
          <div className="mb-3 inline-flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-gold text-gold" /> 4.9/5 · +1.200 تقييم من المغرب
          </div>
          <h1 className="text-3xl font-extrabold text-royal md:text-4xl">{product.nameAr}</h1>
          <p className="mt-3 text-lg text-royal/75">{product.tagline}</p>
          <ul className="mt-4 space-y-2">
            {product.bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
          <div className="mt-6">
            <PricingSelector value={qty} onChange={setQty} />
          </div>
          <button type="button" className="btn-gold mt-5 w-full md:w-auto" onClick={() => cart.addAndOpen(product.slug, qty)}>
            أطلب الآن — الدفع عند الاستلام
          </button>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-royal/70">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-gold" /> COD</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-4 w-4 text-gold" /> 24–48 ساعة</span>
          </div>
        </div>
      </section>
      {product.features.map((f, i) => (
        <section key={f.title} className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 ${i % 2 ? "md:[&>img]:order-2" : ""}`}>
          <img src={f.image} alt="" className="w-full" width={520} height={340} />
          <div>
            <h2 className="text-2xl font-bold">{f.title}</h2>
            <p className="mt-3 text-royal/75">{f.body}</p>
          </div>
        </section>
      ))}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">آراء الزبناء من المغرب</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.reviews.map((r) => (
              <blockquote key={r.name} className="rounded-2xl border border-gold-200 bg-cream p-4">
                <p>“{r.text}”</p>
                <footer className="mt-2 text-sm text-royal/60">
                  {r.name} · {r.city} · {"★".repeat(r.stars)}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
      <div className="sticky bottom-0 z-30 border-t border-gold-200 bg-cream/95 p-3 backdrop-blur md:hidden">
        <button type="button" className="btn-gold w-full" onClick={() => cart.addAndOpen(product.slug, qty)}>
          أطلب الآن — الدفع عند الاستلام
        </button>
      </div>
    </main>
  );
}
