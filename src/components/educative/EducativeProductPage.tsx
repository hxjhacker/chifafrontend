"use client";

import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_BUNDLE, EDUCATIVE_SLUG, getBundle } from "@/lib/educative";
import { TrackPageView } from "@/components/TrackPageView";
import { trackFunnel } from "@/lib/tracking";
import { scrollToOrderFields } from "@/lib/scroll";
import { Faq } from "./Faq";
import { FeatureGrid } from "./FeatureGrid";
import { HeroGallery } from "./HeroGallery";
import { PainSolution } from "./PainSolution";
import { Reviews } from "./Reviews";
import { Specs } from "./Specs";
import { StickyCta } from "./StickyCta";

export function EducativeProductPage() {
  const initiated = useRef(false);
  const bundle = getBundle(DEFAULT_BUNDLE);

  const markCheckout = useCallback(() => {
    if (initiated.current) return;
    initiated.current = true;
    trackFunnel("InitiateCheckout", {
      value: bundle.price,
      contentIds: [EDUCATIVE_SLUG],
    });
  }, [bundle.price]);

  const scrollToForm = useCallback(() => {
    markCheckout();
    scrollToOrderFields();
  }, [markCheckout]);

  useEffect(() => {
    trackFunnel("ViewContent", { value: bundle.price, contentIds: [EDUCATIVE_SLUG] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing
  }, []);

  return (
    <div className="bg-cream pb-28 transition-colors duration-300 dark:bg-brandDark" dir="rtl">
      <TrackPageView kind="product" productSlug="kids" />
      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:py-12">
        <HeroGallery bundle={bundle} onFocusCheckout={markCheckout} />
        <PainSolution />
        <FeatureGrid />
        <Specs />
        <Reviews />
        <Faq />
      </main>
      <StickyCta bundle={bundle} onOrder={scrollToForm} />
    </div>
  );
}
