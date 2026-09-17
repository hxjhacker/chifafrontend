import type { Metadata } from "next";
import { RoyalLandingPage } from "@/components/royal/RoyalLandingPage";
import { ROYAL_PACK } from "@/lib/royal-pack";

export const metadata: Metadata = {
  title: `${ROYAL_PACK.title} | شيفا جلو`,
  description: ROYAL_PACK.tagline,
  robots: { index: true, follow: true },
};

export default function PackRoyalLandingRoute() {
  return <RoyalLandingPage />;
}
