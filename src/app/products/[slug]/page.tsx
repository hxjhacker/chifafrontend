import type { Metadata } from "next";
import { getProduct, PRODUCTS } from "@/lib/products";
import { ProductPage as ProductPageClient } from "@/components/homme/HommeProductPage";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved?.slug || "pack-royal";
  const product = getProduct(slug);
  if (!product) return {};
  const title = product.nameAr;
  const description = product.description;
  const url = `${SITE_URL}/products/${product.slug}`;
  const image = product.heroImage || product.image || OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ar_MA",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export default function ProductPage({ params }: { params: any }) {
  return <ProductPageClient params={params} />;
}
