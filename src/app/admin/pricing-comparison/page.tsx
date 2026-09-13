import type { Metadata } from "next";
import { PricingComparisonPage } from "@/components/admin/PricingComparisonPage";

export const metadata: Metadata = {
  title: "مقارنة أسعار Quick",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminPricingComparisonPage() {
  return <PricingComparisonPage />;
}
