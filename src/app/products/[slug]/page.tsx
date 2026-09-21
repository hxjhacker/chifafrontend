import type { Metadata } from "next";
import { getProduct, PRODUCTS } from "@/lib/products";
import { ProductPage as ProductPageClient } from "@/components/homme/HommeProductPage";

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
  return { title: `${product.nameAr} | CHIFAGLOW HOMME`, description: product.description };
}

export default function ProductPage({ params }: { params: any }) {
  return <ProductPageClient params={params} />;
}
