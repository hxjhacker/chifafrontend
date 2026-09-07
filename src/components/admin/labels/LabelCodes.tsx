"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";

type BarcodeOpts = {
  value: string;
  height?: number;
  width?: number;
  style?: CSSProperties;
};

export function LabelBarcode({ value, height = 38, width = 1.1, style }: BarcodeOpts) {
  const ref = useRef<SVGSVGElement>(null);
  const payload = (value || "").trim();

  useEffect(() => {
    const node = ref.current;
    if (!node || !payload || typeof window === "undefined") return;
    let cancelled = false;
    void import("jsbarcode")
      .then((mod) => {
        if (cancelled || !ref.current) return;
        const loaded = mod as { default?: unknown };
        const JsBarcode = (typeof loaded.default === "function" ? loaded.default : (mod as unknown)) as
          | ((el: unknown, data: string, opts: object) => void)
          | { default?: (el: unknown, data: string, opts: object) => void };
        const draw = typeof JsBarcode === "function" ? JsBarcode : JsBarcode.default;
        if (typeof draw !== "function") return;
        try {
          draw(ref.current, payload, {
            format: "CODE128",
            lineColor: "#000000",
            background: "#ffffff",
            width,
            height,
            displayValue: false,
            margin: 0,
          });
        } catch {
          /* invalid barcode payload */
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [payload, height, width]);

  return <svg ref={ref} role="img" aria-label={payload || "barcode"} style={style} />;
}

export function LabelQr({ value, size, title }: { value: string; size: number; title?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const payload = (value || "").trim();
  if (!mounted || !payload) {
    return <div style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <QRCodeSVG
      value={payload}
      size={size}
      level="M"
      marginSize={0}
      bgColor="#ffffff"
      fgColor="#000000"
      title={title || payload}
    />
  );
}
