export const ROYAL_PACK_SLUG = "pack-royal-power";
export const ROYAL_PACK_ROUTE_SLUG = "pack-royal";
export const ROYAL_LANDING_PATH = `/lp/${ROYAL_PACK_ROUTE_SLUG}`;
export const ROYAL_STOCK = 18;

export type RoyalTierQty = 1;

export type RoyalTier = {
  qty: RoyalTierQty;
  price: number;
  compareAt: number;
  save: number;
  savePct: number;
  title: string;
  subtitle: string;
  badge: string | null;
  highlight?: string;
  featured?: boolean;
  freeShipping?: boolean;
};

export const ROYAL_PACK = {
  slug: ROYAL_PACK_SLUG,
  routeSlug: ROYAL_PACK_ROUTE_SLUG,
  nameAr: "الباك الملكي المتكامل",
  nameEn: "Royal Dual Pack",
  oilName: "زيت التدليك المركز",
  honeyName: "عسل الطاقة بالأعشاب",
  title: "الباك الملكي المتكامل",
  headline: "استرجع طاقتك، صلابتك وثقتك بنفسك بحل طبيعي 100% بدون أدوية كيميائية",
  tagline: "تركيبة مزدوجة: قوة موضعية بالزيت الملكي المركز، وطاقة داخلية بملعقة يومية من العسل الملكي بالأعشاب.",
  rating: 4.9,
  reviewCountLabel: "أكثر من 420 طلب مؤكد",
};

export const ROYAL_TIERS: [RoyalTier] = [
  {
    qty: 1,
    price: 199,
    compareAt: 450,
    save: 251,
    savePct: 56,
    title: "الباك الملكي المتكامل",
    subtitle: "زيت التدليك + عسل الطاقة بالأعشاب",
    badge: "شحن مجاني",
    highlight: "الأكثر طلباً",
    featured: true,
    freeShipping: true,
  },
];

export const ROYAL_DEFAULT_TIER: RoyalTierQty = 1;

export const ROYAL_TIER_CENTS: Record<RoyalTierQty, number> = {
  1: 19900,
};

export const ROYAL_PACK_TIER_LABELS: Record<RoyalTierQty, string> = {
  1: "الباك الملكي المتكامل (زيت + عسل)",
};

export const ROYAL_GALLERY = [
  { id: "hero", label: "الباك الملكي المتكامل", src: "/image/spack-royal/hero.jpg" },
  { id: "features", label: "مميزات الباك الملكي", src: "/image/spack-royal/features.jpg" },
  { id: "ingredients", label: "تركيبة مزدوجة متكاملة", src: "/image/spack-royal/ingredients.jpg" },
  { id: "honey", label: "عسل الطاقة بالأعشاب", src: "/image/spack-royal/honey.jpg" },
  { id: "oil", label: "زيت التدليك المركز", src: "/image/spack-royal/oil.jpg" },
] as const;

export const ROYAL_FEATURES = [
  {
    title: "زيت التدليك المركز",
    body: "دهن موضعي سريع الامتصاص. كينشّط الدورة الدموية ويعطيك صلابة أقوى ووقت أطول، بلا ملمس دهني مزعج.",
  },
  {
    title: "عسل الطاقة بالأعشاب",
    body: "ملعقة صغيرة يومياً ترفع النشاط والتحمل، وكتحارب العياء والتوتر باش ترجع الثقة بشكل طبيعي.",
  },
  {
    title: "تركيبة طبيعية 100%",
    body: "أعشاب وعسل بلا مواد كيميائية. آمنة على القلب والضغط، بلا إدمان وبلا تأثير مؤقت كيرجعك أضعف.",
  },
  {
    title: "تغليف سري والدفع بعد المعاينة",
    body: "الطلب كيوصل مغلف بشكل محكم، وكاتخلّص غير من بعد ما تشوف السلعة قدام الموزع.",
  },
];

export const ROYAL_REVIEWS = [
  {
    name: "يوسف",
    city: "الدار البيضاء",
    stars: 5,
    text: "خذيت الباك الكامل. الزيت كيحسّس بفرق من أول استعمال، والعسل عطاني نشاط فالنهار. التغليف كان سري والتوصيل حتى للدار.",
  },
  {
    name: "رشيد",
    city: "طنجة",
    stars: 5,
    text: "ما بقيتش كنقلب على منشطات. التركيبة طبيعية والدفع عند الاستلام هنانني. الخدمة محترمة.",
  },
  {
    name: "أمين",
    city: "مراكش",
    stars: 5,
    text: "الباك الكامل ستاهل الثمن. العسل مدّاقو زوين وما فيهش ريحة أدوية.",
  },
  {
    name: "محسن",
    city: "فاس",
    stars: 4,
    text: "عيّطو ليا باش يؤكدوا الطلب، والموصّل خلّاني نشوف السلعة قبل الدفع. مرتاح.",
  },
];

export const ROYAL_FAQS = [
  {
    q: "شنو كاين داخل الباك الملكي المتكامل؟",
    a: "زيت التدليك المركز للاستعمال الموضعي، وعسل الطاقة بالأعشاب كمكمل يومي.",
  },
  {
    q: "واش كيمكن نعاين السلعة قبل ما نخلّص؟",
    a: "آه. التوصيل لجميع المدن المغربية، والدفع نقداً عند الاستلام بعد المعاينة قدام الموزع. إلا ما عجباتكش، ما كاتخلّصش.",
  },
  {
    q: "واش التغليف كيكون سري؟",
    a: "التغليف محكم وما كيبانش محتوى الطلب من برّا. حتى التأكيد كيكون بالهاتف بشكل محترم.",
  },
];

export const ROYAL_SPECS = [
  {
    title: "استعمال موضعي",
    body: "الزيت كيتدهن موضعياً وكيمتص بسرعة، بلا رائحة قوية وبلا ملمس مزعج.",
  },
  {
    title: "مكمل يومي",
    body: "ملعقة صغيرة من العسل يومياً تكفي باش تحافظ على النشاط والتحمل.",
  },
  {
    title: "شحن سري ومجاني",
    body: "التوصيل مجاني لجميع مدن المغرب، والتغليف ما كيكشفش محتوى الطلب.",
  },
  {
    title: "الدفع عند الاستلام",
    body: "كاتخلّص غير من بعد المعاينة قدام الموزع. ما كاينش دفع مسبق.",
  },
];

export const ROYAL_CITIES = [
  "الدار البيضاء",
  "الرباط",
  "سلا",
  "تمارة",
  "فاس",
  "مراكش",
  "طنجة",
  "أكادير",
  "مكناس",
  "وجدة",
  "تطوان",
  "القنيطرة",
  "المحمدية",
  "الجديدة",
  "آسفي",
  "الناظور",
  "بني ملال",
  "خريبكة",
  "تازة",
  "العرائش",
  "القصر الكبير",
  "الحسيمة",
  "بركان",
  "سطات",
  "ورزازات",
  "العيون",
  "الداخلة",
  "كلميم",
  "تارودانت",
  "الصويرة",
];

export function getRoyalTier(qty: RoyalTierQty) {
  return ROYAL_TIERS.find((tier) => tier.qty === qty) ?? ROYAL_TIERS[0];
}

export function isRoyalPackSlug(slug?: string | null) {
  return slug === ROYAL_PACK_SLUG || slug === ROYAL_PACK_ROUTE_SLUG;
}
