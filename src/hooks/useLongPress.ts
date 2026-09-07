"use client";

import { useCallback, useRef, type MouseEvent, type TouchEvent } from "react";

const INTERACTIVE = "a, button, input, select, textarea, label, [role='button'], [role='menuitem']";

function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE));
}

type Options = {
  delay?: number;
  moveThreshold?: number;
  enabled?: boolean;
};

export function useLongPress(onLongPress: () => void, options: Options = {}) {
  const { delay = 500, moveThreshold = 10, enabled = true } = options;
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    startPoint.current = null;
  }, []);

  const start = useCallback(
    (x: number, y: number, target: EventTarget | null) => {
      if (!enabled || isInteractive(target)) return;
      clear();
      fired.current = false;
      startPoint.current = { x, y };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        fired.current = true;
        try {
          navigator.vibrate?.(50);
        } catch {
          /* ignore */
        }
        onLongPress();
      }, delay);
    },
    [clear, delay, enabled, onLongPress],
  );

  const move = useCallback(
    (x: number, y: number) => {
      const origin = startPoint.current;
      if (!origin || timer.current == null) return;
      if (Math.hypot(x - origin.x, y - origin.y) > moveThreshold) clear();
    },
    [clear, moveThreshold],
  );

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      start(t.clientX, t.clientY, e.target);
    },
    onTouchMove: (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      move(t.clientX, t.clientY);
    },
    onTouchEnd: clear,
    onTouchCancel: clear,
    onContextMenu: (e: MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
    },
    onClickCapture: (e: MouseEvent) => {
      if (!fired.current) return;
      e.preventDefault();
      e.stopPropagation();
      fired.current = false;
    },
  };
}
