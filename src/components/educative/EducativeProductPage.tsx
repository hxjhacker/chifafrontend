"use client";

import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_BUNDLE, EDUCATIVE_SLUG, getBundle } from "@/lib/educative";
import { trackFunnel } from "@/lib/tracking";
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
    document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [markCheckout]);

  useEffect(() => {
    trackFunnel("ViewContent", { value: bundle.price, contentIds: [EDUCATIVE_SLUG] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing
  }, []);

  return (
    <div className="bg-gradient-to-b from-sky-50 via-cream to-emerald/5 pb-28" dir="rtl">
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
