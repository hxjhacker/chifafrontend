import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { Clock3, ShieldCheck, Star, Truck } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <p className="text-sm font-bold text-gold">شيفا جلو — محتوى فاخر كيوصل حتى لباب دارك</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-snug text-royal md:text-5xl">
            USB جاهز للتشغيل.
            <span className="block text-gold">خلص غير ملي توصلك السلعة.</span>
          </h1>
          <p className="mt-4 text-lg text-royal/75">
            القرآن، تعليم الأطفال، والموسيقى — بلا نت وبلا إعلانات. التوصيل مجاني لجميع مدن المغرب.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products/quran" className="btn-gold">
              أطلب الآن — الدفع عند الاستلام
            </Link>
            <Link href="#catalog" className="rounded-2xl border border-gold px-5 py-3 font-bold text-royal">
              شوف المنتجات
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-royal/80">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-gold" /> 4.9/5 من +12.400 طلب</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-4 w-4 text-gold" /> 24–48 ساعة</span>
          </div>
        </div>
        <img src="/images/hero-home.svg" alt="Chifaglow USB" className="w-full" width={640} height={480} />
      </section>

      <section id="catalog" className="bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="rounded-3xl border border-gold-200 bg-cream p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-gold"
            >
              <img src={p.image} alt={p.nameAr} className="mx-auto h-40" width={220} height={160} />
              <h2 className="mt-4 text-xl font-bold text-royal">{p.nameAr}</h2>
              <p className="mt-2 text-sm text-royal/70">{p.tagline}</p>
              <p className="mt-4 font-bold text-gold">من 199 درهم</p>
            </Link>
          ))}
        </div>
      </section>

      {PRODUCTS.map((p, i) => (
        <section
          key={p.slug}
          className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 ${i % 2 ? "md:[&>img]:order-first" : ""}`}
        >
          <div>
            <h3 className="text-2xl font-bold text-royal">{p.nameAr}</h3>
            <p className="mt-3 text-royal/75">{p.description}</p>
            <Link href={`/products/${p.slug}`} className="btn-gold mt-5 inline-block">
              أطلب {p.nameAr}
            </Link>
          </div>
          <img src={p.heroImage} alt="" className="w-full" width={560} height={380} />
        </section>
      ))}

      <section className="bg-royal py-10 text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8 px-4 text-center">
          <div><ShieldCheck className="mx-auto mb-2 h-6 w-6 text-gold" />الدفع عند الاستلام</div>
          <div><Truck className="mx-auto mb-2 h-6 w-6 text-gold" />توصيل مجاني</div>
          <div><Clock3 className="mx-auto mb-2 h-6 w-6 text-gold" />24–48 ساعة</div>
        </div>
      </section>
    </main>
  );
}
