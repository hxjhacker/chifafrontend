import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { Clock3, ShieldCheck, Star, Truck } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <section className="hero-stage relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-24 end-[-4rem] h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-28 start-[-5rem] h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-14 md:py-20">
          <div>
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold-200 bg-white/80 px-4 py-1.5 text-sm font-bold text-gold shadow-sm backdrop-blur">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
              شيفا جلو — محتوى فاخر كيوصل حتى لباب دارك
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.25] text-royal md:text-6xl">
              USB جاهز للتشغيل.
              <span className="mt-2 block text-gold">
                خلص غير ملي توصلك السلعة.
              </span>
            </h1>

            <span className="mt-5 block h-1 w-24 rounded-full bg-gradient-to-l from-gold to-gold-300" />

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-royal/75 md:text-xl">
              القرآن، تعليم الأطفال، والموسيقى — بلا نت وبلا إعلانات. التوصيل مجاني لجميع مدن المغرب.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/products/quran" className="btn-gold px-7 py-3.5 text-base">
                أطلب الآن — الدفع عند الاستلام
              </Link>
              <Link
                href="#catalog"
                className="rounded-2xl border border-gold bg-white/70 px-7 py-3.5 text-center font-bold text-royal backdrop-blur transition hover:bg-gold-200"
              >
                شوف المنتجات
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-gold-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-royal shadow-sm">
                <Star className="h-4 w-4 fill-gold text-gold" />
                4.9/5 من +12.400 طلب
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-gold-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-royal shadow-sm">
                <Truck className="h-4 w-4 text-gold" />
                24–48 ساعة
              </span>
            </div>
          </div>

          <div className="relative pb-6">
            <div className="absolute inset-8 rounded-[2.5rem] bg-gold/25 blur-3xl" aria-hidden />
            <div className="hero-float relative rounded-[2rem] border border-gold-300 bg-royal p-2 shadow-gold ring-1 ring-gold/30">
              <img
                src="/images/hero-home.svg?v=2"
                alt="Chifaglow USB"
                className="w-full rounded-[1.5rem]"
                width={640}
                height={520}
              />
            </div>
            <div className="absolute -bottom-3 start-4 rounded-2xl border border-gold-200 bg-white/95 px-3 py-2 text-sm font-bold text-royal shadow-gold">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-gold" />
                الدفع عند الاستلام
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={p.slug === "kids" ? "/product" : `/products/${p.slug}`}
              className="rounded-3xl border border-gold-200 bg-cream p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-gold"
            >
              <img src={p.image} alt={p.nameAr} className="mx-auto h-40" width={220} height={160} />
              <h2 className="mt-4 text-xl font-bold text-royal">{p.nameAr}</h2>
              <p className="mt-2 text-sm text-royal/70">{p.tagline}</p>
              <p className="mt-4 font-bold text-gold">{p.slug === "kids" ? "من 149 درهم" : "من 199 درهم"}</p>
            </Link>
          ))}
        </div>
      </section>

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
