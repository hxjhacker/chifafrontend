"use client";

import { useEffect } from "react";
import { sendPageView } from "@/lib/api";

const sent = new Set<string>();

function visitKey(kind: "store" | "product", slug?: string) {
  return `${kind}:${slug || "home"}`;
}

export function TrackPageView({
  kind,
  productSlug,
}: {
  kind: "store" | "product";
  productSlug?: string;
}) {
  useEffect(() => {
    const slug = productSlug === "educative" ? "kids" : productSlug;
    const key = visitKey(kind, slug);
    if (sent.has(key)) return;
    sent.add(key);
    void sendPageView(kind, slug);
  }, [kind, productSlug]);

  return null;
}
