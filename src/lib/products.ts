export type ProductSlug = "pack-royal" | "royal-honey" | "royal-oil";

export type Product = {
  slug: ProductSlug;
  nameAr: string;
  nameEn: string;
  tagline: string;
  description: string;
  accent: "fire" | "gold" | "ember";
  image: string;
  heroImage: string;
  gallery: string[];
  price: number;
  compareAt: number;
  badge: string;
  bullets: string[];
  features: { title: string; body: string; image: string }[];
  reviews: { name: string; city: string; text: string; stars: number }[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "pack-royal",
    nameAr: "الباك الملكي المتكامل",
    nameEn: "Royal Power Pack",
    tagline: "عسل الطاقة الحار + زيت التدليك الحراري المركز.",
    description:
      "تركيبة متكاملة من عسل الطاقة بالأعشاب وزيت التدليك المركز، مع توصيل سري مجاني والدفع بعد المعاينة.",
    accent: "fire",
    image: "/image/spack-royal/hero.jpg",
    heroImage: "/image/spack-royal/hero.jpg",
    gallery: [
      "/image/spack-royal/ingredients.jpg",
      "/image/spack-royal/productpak1.jpg",
      "/image/spack-royal/productpak2.jpg",
      "/image/spack-royal/productpak3.jpg",
      "/image/spack-royal/productpak4.jpg",
    ],
    price: 199,
    compareAt: 450,
    badge: "الأكثر طلباً",
    bullets: [
      "طاقة يومية طبيعية بالأعشاب",
      "زيت تدليك حراري سريع الامتصاص",
      "شحن سري ومعاينة قبل الأداء",
    ],
    features: [
      {
        title: "طاقة من الداخل",
        body: "عسل الطاقة بالأعشاب مخصص لروتين النشاط اليومي.",
        image: "/image/spack-royal/product3asal1.jpg",
      },
      {
        title: "دفء موضعي مريح",
        body: "زيت تدليك مركز بملمس خفيف واستعمال سهل.",
        image: "/image/spack-royal/oil.jpg",
      },
    ],
    reviews: [
      { name: "يوسف", city: "الدار البيضاء", stars: 5, text: "التغليف كان سري والتأكيد بالهاتف محترم." },
      { name: "رشيد", city: "طنجة", stars: 5, text: "طلب سهل والتوصيل وصلني حتى للدار." },
    ],
  },
  {
    slug: "royal-honey",
    nameAr: "عسل الطاقة والجينسنغ الملكي",
    nameEn: "Royal Energy Honey",
    tagline: "عسل بالأعشاب والجينسنغ لروتين نشاطك اليومي.",
    description:
      "عسل طاقة بالأعشاب الطبيعية والجينسنغ، في تغليف سري وتوصيل مجاني لكل مدن المغرب.",
    accent: "gold",
    image: "/image/spack-royal/product3asal1.jpg",
    heroImage: "/image/spack-royal/product3asal1.jpg",
    gallery: ["/image/spack-royal/product3asal1.jpg", "/image/spack-royal/product3asal2.jpg"],
    price: 149,
    compareAt: 249,
    badge: "طاقة داخلية",
    bullets: [
      "عسل طبيعي بالأعشاب",
      "جينسنغ ضمن التركيبة",
      "توصيل مجاني وسري",
    ],
    features: [
      {
        title: "روتين طاقة بسيط",
        body: "ملعقة يومية ضمن نظام متوازن ونمط حياة صحي.",
        image: "/image/spack-royal/product3asal2.jpg",
      },
      {
        title: "مكونات مختارة",
        body: "عسل وأعشاب بنكهة دافئة ومناسبة للاستعمال اليومي.",
        image: "/image/spack-royal/product3asal1.jpg",
      },
    ],
    reviews: [
      { name: "أمين", city: "مراكش", stars: 5, text: "العسل مداقو زوين والتوصيل كان سريع." },
      { name: "عادل", city: "فاس", stars: 5, text: "الخدمة محترمة والدفع من بعد المعاينة ريحني." },
    ],
  },
  {
    slug: "royal-oil",
    nameAr: "زيت التدليك والنشاط المركز",
    nameEn: "Royal Massage Oil",
    tagline: "زيت تدليك دافئ بملمس خفيف وروتين استعمال بسيط.",
    description:
      "زيت تدليك مركز للاستخدام الموضعي، بتغليف سري وتوصيل مجاني مع إمكانية المعاينة قبل الأداء.",
    accent: "ember",
    image: "/image/spack-royal/oil.jpg",
    heroImage: "/image/spack-royal/oil.jpg",
    gallery: ["/image/spack-royal/oil.jpg", "/image/spack-royal/productoil1.jpg"],
    price: 129,
    compareAt: 199,
    badge: "تنشيط موضعي",
    bullets: [
      "زيت تدليك مركز",
      "استعمال موضعي مريح",
      "شحن مجاني لجميع المدن",
    ],
    features: [
      {
        title: "ملمس خفيف",
        body: "تركيبة سهلة التدليك وسريعة الامتصاص.",
        image: "/image/spack-royal/productoil1.jpg",
      },
      {
        title: "روتين العناية",
        body: "استعمله مع تدليك خفيف كجزء من روتين الراحة.",
        image: "/image/spack-royal/oil.jpg",
      },
    ],
    reviews: [
      { name: "محسن", city: "الرباط", stars: 5, text: "جاني فكرطونة محايدة والمعاينة كانت سهلة." },
      { name: "كريم", city: "وجدة", stars: 4, text: "الطلب تسجل بسرعة وتاصل بيا الفريق للتأكيد." },
    ],
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function otherProducts(slug: string) {
  return PRODUCTS.filter((p) => p.slug !== slug);
}

export function galleryShots(product: Product) {
  return [
    { id: "hero", label: product.nameAr, src: product.heroImage },
    { id: "product", label: product.nameAr, src: product.image },
    ...product.gallery.map((src, i) => ({ id: `gallery-${i}`, label: `صورة ${i + 1}`, src })),
    { id: "use", label: "الاستعمال", src: product.heroImage },
  ];
}

export function productBySlug(slug: string) {
  return getProduct(slug) ?? PRODUCTS[0];
}
