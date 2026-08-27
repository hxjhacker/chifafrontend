import { notFound, redirect } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import { ProductLanding } from "@/components/ProductLanding";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "kids") redirect("/product");
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductLanding slug={slug} />;
}
