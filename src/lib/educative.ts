export const EDUCATIVE_SLUG = "educative" as const;
export const TAALIM_SLUG = "taalim" as const;
export const STOCK_LEFT = 14;
export const STOCK_CAP = 50;

export type BundleId = "family" | "single" | "triple";

export type Bundle = {
  id: BundleId;
  qty: 1 | 2 | 3;
  price: number;
  compareAt: number;
  save: number;
  title: string;
  subtitle: string;
  featured?: boolean;
  badge?: string;
};

export const BUNDLES: Bundle[] = [
  {
    id: "family",
    qty: 2,
    price: 249,
    compareAt: 298,
    save: 49,
    title: "2 فلاشات تعليمية",
    subtitle: "وفر 49 درهم + توصيل مجاني",
    featured: true,
    badge: "عرض العائلة المفضل 🔥",
  },
  {
    id: "single",
    qty: 1,
    price: 149,
    compareAt: 249,
    save: 100,
    title: "1 فلاشة تعليمية",
    subtitle: "توصيل مجاني",
  },
  {
    id: "triple",
    qty: 3,
    price: 329,
    compareAt: 447,
    save: 118,
    title: "3 فلاشات تعليمية",
    subtitle: "وفر 118 درهم + توصيل مجاني",
  },
];

export const DEFAULT_BUNDLE: BundleId = "single";

export function getBundle(id: BundleId) {
  return BUNDLES.find((b) => b.id === id) ?? BUNDLES[0];
}

export const GALLERY_SHOTS = [
  { id: "tv", label: "الفلاشة مع التلفاز", src: "/images/educative/n1.jpg" },
  { id: "phone", label: "عرض خاص", src: "/images/educative/n2.jpg?v=2" },
  { id: "topics", label: "الأقسام التعليمية", src: "/images/educative/n3.jpg" },
  { id: "setup", label: "سهولة التركيب", src: "/images/educative/n4.jpg" },
  { id: "specs", label: "المواصفات التقنية", src: "/images/educative/n5.jpg" },
] as const;

export const FEATURES = [
  {
    id: "quran",
    icon: "book",
    title: "القرآن الكريم والتربية الإسلامية",
    body: "قصار السور، تعليم الوضوء والصلاة، وقصص الأنبياء — بأسلوب واضح يناسب عمر الطفل.",
  },
  {
    id: "langs",
    icon: "languages",
    title: "اللغات الأساسية (عربية، فرنسية، إنجليزية)",
    body: "الحروف، الكلمات، والنطق السليم للأطفال… بلا تطبيقات وبلا إعلانات.",
  },
  {
    id: "math",
    icon: "calc",
    title: "الحساب والرياضيات والذكاء",
    body: "الأرقام، العمليات المبسطة، وتنمية المنطق والتركيز بطريقة ممتعة.",
  },
  {
    id: "stories",
    icon: "drama",
    title: "قصص وحكايات كرتونية هادفة",
    body: "قيم وأخلاق إيجابية خالية تماماً من اللقطات المخلة أو الإعلانات.",
  },
] as const;

export const REVIEWS = [
  {
    name: "نادية أ.",
    city: "فاس",
    stars: 5,
    text: "ولدي كان لاصق فالتيليفون واليوتيوب نهار كامل. دابا كيتفرج فالتعليم فالتلفازة وبدأ كيعاود الحروف وقصار السور. الفلوشة وصلت للدار، فتحناها قدام الموصّل، وصافي خدّامة.",
  },
  {
    name: "كريم ب.",
    city: "الدار البيضاء",
    stars: 5,
    text: "خديت جوج: واحد للدار وواحد لدار الوالدة. الخدمة بلا نت هي اللي عجباتني بزاف — ما بقاتش خصّني واي فاي ولا شريحة. الثمن ديال الباكي معقول.",
  },
  {
    name: "إيمان م.",
    city: "مراكش",
    stars: 5,
    text: "التلفاز ديالنا عادي، ماشي سمارت. حطّينا الفلوشة فالـ USB وخدمات من أول مرة. عجباتني المعاينة قبل الدفع، حسّيت راسي مرتاحة.",
  },
  {
    name: "أمين ت.",
    city: "طنجة",
    stars: 5,
    text: "المحتوى إسلامي، لغات، وحساب. ما كايناش إعلانات وما كايناش مشاهد غريبة. البنات ديالي كيعجبهم القصص، وأنا مرتاح على وقت الشاشة.",
  },
];

export const FAQS = [
  {
    q: "واش بصح كتخدم بلا أنترنت؟",
    a: "آه، 100%. المحتوى كامل داخل الفلوشة. ما خاصّك لا واي فاي، لا شريحة، لا تطبيق. غير تدخليها فالتلفاز أو الحاسوب وكيتشغّل المحتوى التربوي مباشرة.",
  },
  {
    q: "كيفاش كتوصلني الفلاشة وواش نقد نفتحها نشوفها؟",
    a: "التوصيل لجميع المدن المغربية، والدفع نقداً عند الاستلام. تقدر تعاين السلعة قدام الموصّل قبل ما تخلّص. إلا ما عجباتكش، ما كاتخلّصش.",
  },
  {
    q: "واش كتخدم ليا في التلفاز العادي؟",
    a: "كتخدم فجميع شاشات التلفاز اللي عندها منفذ USB — سمارت أو عادية. كتخدم حتى فالحواسيب، اللوحات، وشاشات السيارات. Plug & Play: دخليها وخدمات.",
  },
];
