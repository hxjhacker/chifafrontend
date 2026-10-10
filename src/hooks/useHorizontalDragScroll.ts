"use client";

import { useEffect, useRef } from "react";

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current as T | null;
    if (element === null) return;
    const scrollElement: T = element;

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
      startScroll = scrollElement.scrollLeft;
      scrollElement.classList.add("cursor-grabbing");
      scrollElement.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      e.preventDefault();
      scrollElement.scrollLeft = startScroll - (e.pageX - startX) * 1.5;
    }

    function onPointerUp(e: PointerEvent) {
      dragging = false;
      scrollElement.classList.remove("cursor-grabbing");
      if (scrollElement.hasPointerCapture(e.pointerId)) scrollElement.releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      if (e.deltaY === 0) return;
      e.preventDefault();
      scrollElement.scrollLeft += e.deltaY;
    }

    scrollElement.addEventListener("pointerdown", onPointerDown);
    scrollElement.addEventListener("pointermove", onPointerMove);
    scrollElement.addEventListener("pointerup", onPointerUp);
    scrollElement.addEventListener("pointercancel", onPointerUp);
    scrollElement.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollElement.removeEventListener("pointerdown", onPointerDown);
      scrollElement.removeEventListener("pointermove", onPointerMove);
      scrollElement.removeEventListener("pointerup", onPointerUp);
      scrollElement.removeEventListener("pointercancel", onPointerUp);
      scrollElement.removeEventListener("wheel", onWheel);
    };
  }, []);

  return ref;
}
