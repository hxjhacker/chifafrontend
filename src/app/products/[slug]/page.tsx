import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import { ProductLanding } from "@/components/ProductLanding";
import { RoyalProductPage } from "@/components/royal/RoyalProductPage";
import { ROYAL_PACK, ROYAL_PACK_ROUTE_SLUG, ROYAL_PACK_SLUG } from "@/lib/royal-pack";

export function generateStaticParams() {
  return [...PRODUCTS.map((p) => ({ slug: p.slug })), { slug: ROYAL_PACK_ROUTE_SLUG }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === ROYAL_PACK_ROUTE_SLUG || slug === ROYAL_PACK_SLUG) {
    return {
      title: `${ROYAL_PACK.title} | شيفا جلو`,
      description:
        "الباك الملكي المتكامل: زيت التدليك المركز + عسل الطاقة بالأعشاب. شحن سري مجاني والدفع عند الاستلام في جميع مدن المغرب.",
    };
  }
  const product = getProduct(slug);
  if (!product) return {};
  return { title: `${product.nameAr} | شيفا جلو`, description: product.tagline };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "kids") redirect("/product");
  if (slug === ROYAL_PACK_SLUG) redirect(`/products/${ROYAL_PACK_ROUTE_SLUG}`);
  if (slug === ROYAL_PACK_ROUTE_SLUG) return <RoyalProductPage />;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductLanding slug={slug} />;
}
