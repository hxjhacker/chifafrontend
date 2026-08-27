"use client";

import { useEffect, useState } from "react";

const OFFER_MS = 3 * 60 * 60 * 1000 + 47 * 60 * 1000;

function splitTime(ms: number) {
  const safe = Math.max(0, ms);
  return {
    h: Math.floor(safe / 3_600_000),
    m: Math.floor((safe % 3_600_000) / 60_000),
    s: Math.floor((safe % 60_000) / 1000),
  };
}

export function useOfferCountdown(storageKey: string) {
  const [left, setLeft] = useState(() => splitTime(OFFER_MS));

  useEffect(() => {
    let end = Number(sessionStorage.getItem(storageKey) || 0);
    if (!end || end < Date.now()) {
      end = Date.now() + OFFER_MS;
      sessionStorage.setItem(storageKey, String(end));
    }
    const tick = () => setLeft(splitTime(end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [storageKey]);

  return left;
}

export function padTime(n: number) {
  return String(n).padStart(2, "0");
}
