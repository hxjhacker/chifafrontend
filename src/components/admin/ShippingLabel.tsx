"use client";

import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import {
  copyablePhone,
  DEFAULT_DRIVER_NOTES,
  detailedAddress,
  formatMad,
  orderLineItems,
  shortOrderRef,
  STORE_CONTACT,
  type AdminOrder,
} from "@/lib/admin";
import { regionNameForId } from "@/lib/admin-geo";
import { barcodeValue, encodeCode39 } from "@/lib/barcode";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
};

function Code39({ value }: { value: string }) {
  const { bars, width } = encodeCode39(value);
  return (
    <svg
      role="img"
      aria-label={value}
      viewBox={`0 0 ${width} 48`}
      className="h-12 w-full"
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width={width} height="48" fill="#fff" />
      {bars.map((bar) => (
        <rect key={`${bar.x}-${bar.w}`} x={bar.x} y="4" width={bar.w} height="40" fill="#0b1322" />
      ))}
    </svg>
  );
}

export function ShippingLabel({ order, onClose }: Props) {
  useEffect(() => {
    if (!order) return;
    const timer = window.setTimeout(() => window.print(), 280);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [order?.order_id, onClose]);

  if (!order) return null;

  const ref = shortOrderRef(order.order_id);
  const code = barcodeValue(order.order_id);
  const phone = copyablePhone(order);
  const region = regionNameForId(order.region_id || order.region || "");
  const address = detailedAddress(order) || "العنوان غير مكتمل — أكّد قبل الشحن";
  const extraParts = [order.quartier, order.street, order.building, order.landmark]
    .map((v) => (v || "").trim())
    .filter((part) => part && !address.includes(part));
  const lines = orderLineItems(order);
  const notes = (order.courier_notes || order.driver_comment || "").trim() || DEFAULT_DRIVER_NOTES;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 print:static print:inset-auto print:bg-white print:p-0">
      <div className="shipping-label-chrome no-print absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-[420px] flex-col items-center gap-3 overflow-y-auto print:max-h-none print:w-auto print:max-w-none print:overflow-visible">
        <div className="no-print flex w-full items-center justify-between rounded-2xl border border-[#1e293b] bg-[#0b1322] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">طباعة بوليصة الشحن</p>
            <p className="text-[11px] text-slate-400">ملصق حراري A6 — 100×150 مم</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" /> طباعة
            </button>
            <button
              type="button"
              onClick={onClose}
              title="إغلاق"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e293b] bg-[#0f172a] text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <article id="shipping-label-print" dir="rtl">
          <header className="label-header">
            <p className="store-mark">CHIFAGLOW</p>
            <p className="store-ar">{STORE_CONTACT.nameAr}</p>
            <p className="store-tag">{STORE_CONTACT.tagline}</p>
            <p className="store-contact" dir="ltr">
              {STORE_CONTACT.phone} · {STORE_CONTACT.site}
            </p>
          </header>

          <div className="barcode-block">
            <Code39 value={code} />
            <p className="order-ref">{ref}</p>
          </div>

          <section className="receiver">
            <p className="section-kicker">المرسل إليه</p>
            <p className="receiver-name">{order.full_name}</p>
            <p className="receiver-city">
              {order.city}
              {region ? ` — ${region}` : ""}
            </p>
            <p className="receiver-address">{address}</p>
            {extraParts.length ? <p className="receiver-parts">{extraParts.join(" · ")}</p> : null}
            <p className="receiver-phone" dir="ltr">
              {phone}
            </p>
          </section>

          <section className="cod-box">
            <p>المبلغ المطلوب للتحصيل</p>
            <strong>{formatMad(order.total)}</strong>
          </section>

          <section className="pack-list">
            <p className="section-kicker">محتويات الطرد</p>
            <ul>
              {lines.map((line) => (
                <li key={`${line.label}-${line.qty}`}>
                  <span>{line.label}</span>
                  <b>× {line.qty}</b>
                </li>
              ))}
            </ul>
          </section>

          <footer className="driver-notes">
            <p className="section-kicker">تعليمات السائق</p>
            <p>{notes}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
