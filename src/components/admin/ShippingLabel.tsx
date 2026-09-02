"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X } from "lucide-react";
import {
  copyablePhone,
  orderLineItems,
  STORE_CONTACT,
  type AdminOrder,
} from "@/lib/admin";
import { expeditionZone } from "@/lib/admin-geo";
import { barcodeValue, parcelTrackingUrl } from "@/lib/barcode";
import { digitsOnly } from "@/lib/phone";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
};

function formatLabelPhone(raw: string) {
  const digits = digitsOnly(raw);
  const national =
    digits.startsWith("212") && digits.length >= 12
      ? `0${digits.slice(3, 12)}`
      : digits.startsWith("0")
        ? digits.slice(0, 10)
        : digits;
  if (national.length === 10) {
    return `${national.slice(0, 2)}-${national.slice(2, 5)}-${national.slice(5, 8)}-${national.slice(8)}`;
  }
  return raw || "—";
}

export function ShippingLabel({ order, onClose }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  useLockBodyScroll(Boolean(order));

  useEffect(() => {
    if (!order) return;
    const code = barcodeValue(order.order_id);
    const node = barcodeRef.current;
    if (node) {
      JsBarcode(node, code, {
        format: "CODE128",
        lineColor: "#000000",
        background: "#ffffff",
        width: 1.7,
        height: 42,
        displayValue: true,
        font: "Tajawal",
        fontSize: 11,
        textMargin: 2,
        margin: 0,
      });
    }
    const timer = window.setTimeout(() => window.print(), 400);
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

  const code = barcodeValue(order.order_id);
  const trackUrl = parcelTrackingUrl(order.order_id);
  const phone = formatLabelPhone(copyablePhone(order));
  const zone = expeditionZone(order.city, order.region_id || order.region);
  const address = [order.address || order.full_address, order.quartier, order.street, order.building, order.landmark]
    .map((part) => (part || "").trim())
    .filter((part, index, all) => part && all.indexOf(part) === index)
    .join("، ") || "العنوان غير مكتمل";
  const lines = orderLineItems(order);
  const crbt = Math.round(Number(order.total ?? order.total_price) || 0);
  const stockId = code.slice(-4);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 print:static print:inset-auto print:bg-white print:p-0">
      <div className="shipping-label-chrome no-print absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-[450px] flex-col items-center gap-3 overflow-y-auto print:max-h-none print:w-auto print:max-w-none print:overflow-visible">
        <div className="no-print flex w-full items-center justify-between rounded-2xl border border-[#1e293b] bg-[#0b1322] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">بوليصة الشحن بباركود و QR حقيقيين</p>
            <p className="text-[11px] text-slate-400">قابلة للـ Scan — A6 / Thermal 100×150 مم</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" /> طباعة الآن
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

        <article id="shipping-label-print" className="shipping-label">
          <header className="label-top">
            <div className="label-brand">
              <span className="brand-mark">CG</span>
              <div>
                <p className="brand-name">{STORE_CONTACT.name}</p>
                <p className="brand-tag">We Are Every Where</p>
              </div>
            </div>
            <div className="label-zone">
              <span>Zone Expedition:</span>
              <strong>{zone}</strong>
            </div>
          </header>

          <section className="label-parties">
            <div className="label-qr">
              <span>Scan Track:</span>
              <QRCodeSVG
                value={trackUrl}
                size={70}
                level="H"
                marginSize={0}
                bgColor="#ffffff"
                fgColor="#000000"
                title={`تتبع ${code}`}
              />
            </div>
            <div className="label-sender">
              <p className="party-kicker">Expediteur:</p>
              <p className="party-line">
                {STORE_CONTACT.name.toLowerCase()} — ({stockId})
              </p>
              <p className="party-line" dir="ltr">
                {STORE_CONTACT.phone.replace(/\s/g, "")}
              </p>
              <p className="stock-pill">STOCK</p>
            </div>
            <div className="label-receiver" dir="rtl">
              <p className="party-kicker" dir="ltr">
                Destinataire:
              </p>
              <p className="party-name">{order.full_name}</p>
              <p className="party-phone" dir="ltr">
                {phone}
              </p>
              <p className="party-city">{(order.city || "").toUpperCase()}</p>
              <p className="party-address">{address}</p>
            </div>
          </section>

          <div className="label-bans">
            <span>Interdit d&apos;ouvrir</span>
            <span>Interdit d&apos;essayer</span>
          </div>

          <section className="label-goods">
            <div className="goods-list" dir="rtl">
              <p className="party-kicker">Marchandise:</p>
              <div className="goods-chips">
                {lines.map((line) => (
                  <span key={`${line.label}-${line.qty}`}>
                    {line.qty} : {line.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="goods-crbt">
              <span>Crbt:</span>
              <strong>{crbt} DH</strong>
            </div>
          </section>

          <footer className="label-barcode">
            <svg ref={barcodeRef} role="img" aria-label={code} />
            <p>
              {STORE_CONTACT.site} | {STORE_CONTACT.phone.replace(/\s/g, "")} | {STORE_CONTACT.name} n&apos;est pas
              responsable de vos achats.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
