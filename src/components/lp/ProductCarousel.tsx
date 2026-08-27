"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryShot = { id: string; label: string; src: string };

export function ProductCarousel({ shots }: { shots: readonly GalleryShot[] }) {
  const [index, setIndex] = useState(0);
  const shot = shots[index] ?? shots[0];
  const cols = Math.min(5, Math.max(2, shots.length));

  const goTo = useCallback(
    (next: number) => {
      if (!shots.length) return;
      setIndex((next + shots.length) % shots.length);
    },
    [shots.length],
  );

  useEffect(() => {
    if (shots.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % shots.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [index, shots.length]);

  if (!shot) return null;

  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.src} alt={shot.label} className="aspect-square w-full object-contain" />
        </div>
        {shots.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              onClick={() => goTo(index - 1)}
              className="absolute start-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-royal shadow-md ring-1 ring-slate-200 hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              onClick={() => goTo(index + 1)}
              className="absolute end-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-royal shadow-md ring-1 ring-slate-200 hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
      {shots.length > 1 ? (
        <div className={`mt-3 grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="tablist" aria-label="صور المنتج">
          {shots.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-label={item.label}
                aria-selected={active}
                onClick={() => goTo(i)}
                className={`overflow-hidden rounded-2xl p-0.5 transition ${active ? "ring-2 ring-emerald" : "opacity-80 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" className="aspect-square w-full rounded-xl object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
