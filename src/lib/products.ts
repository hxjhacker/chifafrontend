export type ProductSlug = "quran" | "kids" | "music";

export type Product = {
  slug: ProductSlug;
  nameAr: string;
  nameEn: string;
  tagline: string;
  description: string;
  accent: "gold" | "emerald" | "bronze";
  image: string;
  heroImage: string;
  bullets: string[];
  features: { title: string; body: string; image: string }[];
  reviews: { name: string; city: string; text: string; stars: number }[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "quran",
    nameAr: "USB القرآن الكريم",
    nameEn: "Holy Quran USB",
    tagline: "القرآن كامل بجودة عالية… يتسمع في الدار والسيارة.",
    description:
      "مكتبة قرآنية فاخرة على USB جاهز للتشغيل. مناسب للإهداء، للوالدين، وللإستماع اليومي بلا نت وبلا إعلانات.",
    accent: "gold",
    image: "/images/usb-quran.svg",
    heroImage: "/images/hero-quran.svg",
    bullets: [
      "تلاوات واضحة بجودة استوديو",
      "تشغيل مباشر — بلا نت وبلا تطبيقات",
      "هدية محترمة للوالدين وفي رمضان",
    ],
    features: [
      {
        title: "البركة في الدار",
        body: "حطّيه فالسيارة، فالمطبخ، أو فالليل. القرآن حاضر بلا تقطيع وبلا إعلانات.",
        image: "/images/feature-home.svg",
      },
      {
        title: "هدية ما كتخيبش",
        body: "للوالدين، للعمرة، ولرمضان. محتوى يستاهل، ماشي غير بلاستيك رخيص.",
        image: "/images/feature-gift.svg",
      },
    ],
    reviews: [
      { name: "فاطمة", city: "مراكش", stars: 5, text: "الصوت نقي بزاف. خديت جوج: واحد للدار وواحد للواليدة." },
      { name: "يوسف", city: "طنجة", stars: 5, text: "تسنايت غير نهارين وتوصل. الدفع عند الاستلام مرتاح." },
      { name: "سارة", city: "الرباط", stars: 5, text: "هدية للعمرة كانت في المستوى. التغليف زوين." },
      { name: "حسن", city: "أكادير", stars: 4, text: "كيخدم فالسيارة بلا مشاكل. جودة أحسن مما توقعت." },
    ],
  },
  {
    slug: "kids",
    nameAr: "USB تعليم الأطفال",
    nameEn: "Children Learning USB",
    tagline: "محتوى تربوي جاهز… ولادك يتعلمو وأنت مرتاح.",
    description:
      "تجميعة تعليمية للأطفال: حروف، أرقام، أناشيد وألعاب تعلم. بلا إعلانات وبلا نت — للدار وللسيارة.",
    accent: "emerald",
    image: "/images/usb-kids.svg",
    heroImage: "/images/hero-kids.svg",
    bullets: [
      "حروف وأرقام وأناشيد تربوية",
      "بلا إعلانات وبدون إنترنت",
      "مناسب من 3 سنين وفوق",
    ],
    features: [
      {
        title: "وقت الشاشة يولي تعلم",
        body: "بدل ما غير يتفرجو، كيتعلمو حروف وأرقام وأناشيد مفيدة.",
        image: "/images/feature-learn.svg",
      },
      {
        title: "للدار وللجدة وللسيارة",
        body: "باكيت جوج أو ثلاثة قطع كيحلّو المشكل ديال كل بيت.",
        image: "/images/feature-family.svg",
      },
    ],
    reviews: [
      { name: "نادية", city: "فاس", stars: 5, text: "ولدي بدا كيعاود الحروف. بستاهل الثمن." },
      { name: "كريم", city: "الدار البيضاء", stars: 5, text: "خديت 3 قطع: الدار، الكرانما، ودار الوالدة." },
      { name: "إيمان", city: "وجدة", stars: 5, text: "التوصيل سريع والسلعة أصلية. شكرا شيفا جلو." },
      { name: "أمين", city: "المحمدية", stars: 4, text: "المحتوى منظم وما فيهش إعلانات. عجبني." },
    ],
  },
  {
    slug: "music",
    nameAr: "USB الأغاني والموسيقى",
    nameEn: "Music & Songs USB",
    tagline: "موسيقى جاهزة، بلا نت وبلا تقطيعة.",
    description:
      "مكتبة أغاني مرتبة للسيارة، المحل، والتجمعات العائلية. تشغيل مباشر من الـ USB — بلا نت وبلا إعلانات.",
    accent: "bronze",
    image: "/images/usb-music.svg",
    heroImage: "/images/hero-music.svg",
    bullets: [
      "تجميعة مرتبة للسيارة والمحل",
      "بلا نت وبلا تقطيع",
      "جاهزة للحفلات والتجمعات",
    ],
    features: [
      {
        title: "للطاكسي والمحل والدار",
        body: "حطّيه وكمل خدمتك. الموسيقى كتسولّي بلا ما تدور فالتيليفون.",
        image: "/images/feature-car.svg",
      },
      {
        title: "نوستالجيا مرتبة",
        body: "أغاني كتعرفها، تجميعة نظيفة، ماشي فولدر عشوائي.",
        image: "/images/feature-party.svg",
      },
    ],
    reviews: [
      { name: "رشيد", city: "سلا", stars: 5, text: "فالسيارة واعر. ما بقاتش خصني نت." },
      { name: "ليلى", city: "تطوان", stars: 5, text: "خديت جوج: واحد ليا وواحد لخويا. التوصيل حتى للباب." },
      { name: "محسن", city: "الجديدة", stars: 4, text: "الجودة مزيانة والتجميعة متنوعة." },
      { name: "حنان", city: "مكناس", stars: 5, text: "طلبت بالليل، عيّطو ليا الصباح. محترفين." },
    ],
  },
];

export function getProduct(slug: string) {
  if (slug === "educative" || slug === "taalim") {
    const kids = PRODUCTS.find((p) => p.slug === "kids");
    if (!kids) return undefined;
    return {
      ...kids,
      nameAr: slug === "taalim" ? "فلاشة Taalim Kids التعليمية" : "الفلاشة التعليمية الذكية للأطفال",
      tagline: slug === "taalim" ? "حوّل التلفاز إلى مدرسة ذكية لطفلك." : "100% بدون إنترنت — رفيق التفوق المدرسي.",
    };
  }
  return PRODUCTS.find((p) => p.slug === slug);
}

export function otherProducts(slug: string) {
  return PRODUCTS.filter((p) => p.slug !== slug);
}

export function galleryShots(product: Product) {
  return [
    { id: "hero", label: product.nameAr, src: product.heroImage },
    { id: "usb", label: "الفلاشة", src: product.image },
    ...product.features.map((f, i) => ({ id: `feature-${i}`, label: f.title, src: f.image })),
    { id: "use", label: "الاستعمال", src: product.heroImage },
  ];
}

export function productBySlug(slug: string) {
  return getProduct(slug) ?? PRODUCTS[0];
}
