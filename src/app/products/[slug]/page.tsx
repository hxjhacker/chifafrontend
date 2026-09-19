import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import { HommeProductPage } from "@/components/homme/HommeProductPage";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return { title: `${product.nameAr} | CHIFAGLOW HOMME`, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (["quran", "kids", "music", "pack-royal-power"].includes(slug)) redirect("/");
  const product = getProduct(slug);
  if (!product) notFound();
  return <HommeProductPage slug={slug} />;
}
