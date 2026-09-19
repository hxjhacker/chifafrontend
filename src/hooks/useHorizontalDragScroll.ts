"use client";

import { useEffect, useRef } from "react";

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    function isInteractive(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea"));
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isInteractive(e.target)) return;
      dragging = true;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add("cursor-grabbing");
      el.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      e.preventDefault();
      el.scrollLeft = startScroll - (e.pageX - startX) * 1.5;
    }

    function onPointerUp(e: PointerEvent) {
      dragging = false;
      el.classList.remove("cursor-grabbing");
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return ref;
}
