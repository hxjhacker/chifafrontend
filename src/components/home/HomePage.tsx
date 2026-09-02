import Link from "next/link";
import {
  Award,
  Crown,
  HandCoins,
  Headphones,
  ShieldHalf,
  Truck,
} from "lucide-react";
import { ReviewGrid, Stars } from "@/components/reviews/ReviewCard";
import { TrackPageView } from "@/components/TrackPageView";

const PRODUCTS = [
  {
    href: "/products/quran",
    badge: "الأكثر مبيعاً ⭐",
    badgeClass: "bg-emeraldCustom text-white",
    image: "/images/usb-quran.svg",
    alt: "USB القرآن الكريم",
    title: "USB القرآن الكريم كاملاً",
    body: "المصحف كاملاً بصوت أشهر القراء، أدعية وأذكار الصباح والمساء، والرقية الشرعية جاهزة للاستماع في السيارة والمنزل بجودة عالية.",
    price: "199 درهم",
    oldPrice: "299 درهم",
  },
  {
    href: "/product",
    badge: "تربوي وتعليمي 📚",
    badgeClass: "border border-gold/30 bg-royal text-gold dark:bg-brandDark",
    image: "/images/usb-kids.svg",
    alt: "USB تعليم الأطفال",
    title: "USB تعليم وترفيه الأطفال",
    body: "قصص الأنبياء المصورة، الحروف والأرقام، أناشيد هادفة لحماية أطفالك من إدمان شاشات الهواتف ومحتوى الإنترنت العشوائي.",
    price: "149 درهم",
    oldPrice: "249 درهم",
  },
  {
    href: "/products/music",
    badge: "صوت ستوديو HD 🎵",
    badgeClass: "bg-gold-600 text-white",
    image: "/images/usb-music.svg",
    alt: "USB الأغاني والموسيقى",
    title: "USB الموسيقى والأغاني",
    body: "أفضل المقاطع الموسيقية المغربية والشرقية المختارة للسفر والسيارة، جاهزة بصيغة MP3 عالية النقاء وبدون انقطاع.",
    price: "199 درهم",
    oldPrice: "299 درهم",
  },
] as const;

const FEATURES = [
  {
    icon: HandCoins,
    title: "الدفع عند الاستلام",
    body: "ما تخلص والو حتى توصلك الأمانة وتقلبها بيدك",
  },
  {
    icon: Truck,
    title: "توصيل مجاني وسريع",
    body: "إلى باب دارك فجميع مدن المغرب (24–48 ساعة)",
  },
  {
    icon: ShieldHalf,
    title: "ضمان الاستبدال",
    body: "ضمان استبدال فوري للمنتج في حال وجود أي مشكل",
  },
  {
    icon: Headphones,
    title: "دعم متواصل",
    body: "فريقنا متواجد على الواتساب للإجابة على جميع تساؤلاتكم",
  },
] as const;

const REVIEWS = [
  {
    name: "عثمان",
    city: "الدار البيضاء",
    text: "وصلني الـ USB ديال القرآن في الدار البيضاء فنفس اليوم تقريباً، الصوت نقي بزااف وكيخدم فالطوموبيل بسلاسة وبلا تعقاد.",
    stars: 5,
  },
  {
    name: "مريم",
    city: "مراكش",
    text: "صراحة USB ديال الأطفال عتقني، ولادي ملهيين مع الرسوم التعليمية والقصص بلا دوخة ديال الإعلانات فاليوتيوب.",
    stars: 5,
  },
] as const;

export function HomePage() {
  return (
    <>
      <TrackPageView kind="store" />
      <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white px-3.5 py-1.5 text-xs font-extrabold text-gold-600 shadow-sm dark:bg-cardDark dark:text-gold md:text-sm">
              <Crown className="h-4 w-4 text-gold" /> الجودة الأصلية مضمونة 100%
            </div>

            <h1 className="text-3xl font-black leading-[1.25] text-royal dark:text-white sm:text-5xl">
              محتوى فاخر فـ USB واحد.
              <span className="mt-2 block text-gold-600 dark:text-gold">بلا نت وبلا إعلانات مزعجة!</span>
            </h1>

            <p className="mt-4 text-sm font-medium leading-relaxed text-royal/75 dark:text-slate-300 sm:text-base">
              القرآن الكريم كاملاً بأصوات أشهر القراء، برامج تعليمية للأطفال، أو روائع الموسيقى. جاهز للتشغيل مباشرة في
              السيارة، التلفاز، والمكبرات.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-white px-3.5 py-2 shadow-sm dark:bg-cardDark">
                <Stars />
                <span className="text-xs font-bold text-royal dark:text-slate-200">4.9/5 (+12,400 زبون)</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-white px-3.5 py-2 text-xs font-bold text-royal shadow-sm dark:bg-cardDark dark:text-slate-200">
                <Truck className="h-4 w-4 text-emeraldCustom" /> توصيل في 24–48 ساعة
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
              <a
                href="#catalog"
                className="gold-gradient rounded-2xl px-8 py-4 text-center text-base font-black text-royal shadow-luxury transition hover:brightness-105 active:scale-95"
              >
                اختر باقتك الآن
              </a>
              <a
                href="#features"
                className="rounded-2xl border border-royal/20 bg-white px-6 py-4 text-center text-base font-bold text-royal transition hover:bg-gold-50 dark:border-white/10 dark:bg-cardDark dark:text-white dark:hover:bg-slate-800"
              >
                علاش شيفا جلو؟
              </a>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl border-2 border-gold/30 bg-white p-5 shadow-luxury dark:bg-cardDark">
              <div className="absolute -right-3 -top-3 rounded-full bg-moroccoRed px-3.5 py-1.5 text-xs font-black text-white shadow-md">
                الأكثر طلباً فالمغرب 🔥
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-royal p-4">
                <img
                  src="/images/hero-home.svg?v=2"
                  alt="Chifaglow USB"
                  className="h-auto w-full rounded-xl object-cover"
                  width={700}
                  height={520}
                />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gold/20 bg-cream p-3.5 dark:bg-brandDark">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal text-lg text-gold dark:bg-cardDark">
                    <ShieldHalf className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-royal dark:text-white">ضمان المعاينة قبل الأداء</h4>
                    <p className="text-[11px] text-royal/60 dark:text-slate-400">قلب سلعتك عاد خلص</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emeraldCustom">100% مضمون</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gold/20 bg-white py-4 transition-colors duration-300 dark:bg-cardDark">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-royal dark:text-slate-200">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emeraldCustom" />
            <span>
              طلب مؤكد للتو: <strong>USB القرآن الكريم</strong> من <strong>الرباط</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-royal/70 dark:text-slate-400">
            <span>
              <Award className="ml-1 inline h-3.5 w-3.5 text-gold" /> مفاتيح USB معدنية 3.0 أصلية
            </span>
            <span>
              <Headphones className="ml-1 inline h-3.5 w-3.5 text-gold" /> دعم مستمر
            </span>
          </div>
        </div>
      </section>

      <section id="catalog" className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-black text-royal dark:text-white sm:text-4xl">اختر الباقة المناسبة لك</h2>
            <p className="mt-2 text-sm font-medium text-royal/70 dark:text-slate-400 md:text-base">
              كل منتج مجهز بعناية وبأعلى نقاء صوتي ومرئي
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {PRODUCTS.map((p) => (
              <div
                key={p.href}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-gold/30 bg-white p-6 shadow-luxury transition-all duration-300 hover:-translate-y-1.5 hover:border-gold dark:bg-cardDark"
              >
                <div className={`absolute -top-3.5 right-6 rounded-full px-3 py-1 text-xs font-black shadow-sm ${p.badgeClass}`}>
                  {p.badge}
                </div>
                <div>
                  <div className="flex h-44 items-center justify-center rounded-2xl border border-gold/10 bg-cream p-4 dark:bg-brandDark">
                    <img
                      src={p.image}
                      alt={p.alt}
                      className="max-h-full object-contain transition group-hover:scale-105"
                      width={240}
                      height={160}
                    />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-royal dark:text-white">{p.title}</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-royal/70 dark:text-slate-400">{p.body}</p>
                </div>
                <div className="mt-6 border-t border-gold/10 pt-4">
                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-royal dark:text-gold">{p.price}</span>
                      <span className="mr-2 text-xs font-bold text-royal/40 line-through dark:text-slate-500">
                        {p.oldPrice}
                      </span>
                    </div>
                    <span className="rounded bg-emeraldCustom/10 px-2 py-0.5 text-xs font-bold text-emeraldCustom">
                      توفير 100 درهم
                    </span>
                  </div>
                  <Link
                    href={p.href}
                    className="block w-full rounded-xl border border-gold/40 bg-royal py-3.5 text-center text-sm font-extrabold text-gold shadow-sm transition hover:brightness-110 dark:bg-gold dark:text-brandDark"
                  >
                    عرض التفاصيل والطلب
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-gold/20 bg-white py-14 transition-colors duration-300 dark:bg-cardDark">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gold/20 bg-cream p-6 dark:bg-brandDark">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-royal text-xl text-gold dark:bg-cardDark">
                  <f.icon className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-base font-extrabold text-royal dark:text-white">{f.title}</h4>
                <p className="text-xs leading-relaxed text-royal/70 dark:text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[950px] px-4 py-12 md:py-16">
        <ReviewGrid
          title="تجارب حقيقية لزبنائنا فالمغرب 🇲🇦"
          subtitle="ثقتكم هي سر نجاحنا واستمراريتنا"
          reviews={[...REVIEWS]}
        />
      </div>
    </>
  );
}
