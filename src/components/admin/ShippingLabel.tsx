"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { copyablePhone, detailedAddress, orderLineItems, type AdminOrder } from "@/lib/admin";
import { destinationHub, labelDate, parcelOrderCode } from "@/lib/label-hub";
import { digitsOnly } from "@/lib/phone";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
};

const SENDER_NAME = "CHIFA GLOW";
const SENDER_CODE = "7605";
const SENDER_PHONE = "06-20-86-38-95";
const DEPART_HUB = "FES";
const DISCLAIMER = "META LIVRAISON EST UNIQUEMENT UNE ENTREPRISE DE LIVRAISON.";

function formatLabelPhone(raw: string) {
  const digits = digitsOnly(raw);
  let national = digits;
  if (digits.startsWith("212") && digits.length >= 12) national = `0${digits.slice(3, 12)}`;
  else if (digits.startsWith("0") && digits.length >= 10) national = digits.slice(0, 10);
  else if (digits.length === 9) national = `0${digits}`;
  if (national.length === 10) {
    return `${national.slice(0, 2)}-${national.slice(2, 4)}-${national.slice(4, 6)}-${national.slice(6, 8)}-${national.slice(8)}`;
  }
  return raw || "—";
}

function canOpenParcel(order: AdminOrder) {
  const raw = (order as AdminOrder & { can_open?: boolean; canOpen?: boolean }).can_open
    ?? (order as AdminOrder & { canOpen?: boolean }).canOpen;
  return raw !== false;
}

export function ShippingLabel({ order, onClose }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  useLockBodyScroll(Boolean(order));

  const tracking = (order?.meta_livraison_code || "").trim();
  const code = order ? parcelOrderCode(order.order_id) : "";

  useEffect(() => {
    if (!order || !code) return;
    const node = barcodeRef.current;
    if (node) {
      JsBarcode(node, code, {
        format: "CODE128",
        lineColor: "#000000",
        background: "#ffffff",
        width: 1.05,
        height: 36,
        displayValue: false,
        margin: 0,
      });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [order?.order_id, code, onClose]);

  if (!order) return null;

  const phone = formatLabelPhone(copyablePhone(order));
  const hub = destinationHub(order.city, order.shipping_city, order.region_id || order.region);
  const ville = (order.shipping_city || order.city || "—").trim() || "—";
  const address = detailedAddress(order) || "—";
  const notes = (order.courier_notes || order.driver_comment || "").trim() || "-";
  const lines = orderLineItems(order);
  const marchendise = lines.map((line) => `${line.label} x ${line.qty}`).join(" + ") || "—";
  const price = Math.round(Number(order.total ?? order.total_price) || 0);
  const openLabel = canOpenParcel(order) ? "مسموح بالفتح" : "ممنوع فتح الطلبية";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 print:static print:inset-auto print:bg-white print:p-0">
      <div className="shipping-label-chrome no-print absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-[420px] flex-col items-center gap-3 overflow-y-auto print:max-h-none print:w-auto print:max-w-none print:overflow-visible">
        <div className="no-print flex w-full items-center justify-between rounded-2xl border border-[#1e293b] bg-[#0b1322] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">معاينة بوليصة الشحن</p>
            <p className="text-[11px] text-slate-400">حراري مربع 100×100 مم — Meta Livraison</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة التذكرة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              إغلاق
            </button>
          </div>
        </div>

        <article id="thermal-label-container" dir="ltr">
          <header className="tl-header">
            <div className="tl-expediteur">
              <p>
                <span>Expediteur :</span> {SENDER_NAME} ({SENDER_CODE})
              </p>
              <p>Tel : {SENDER_PHONE}</p>
            </div>
            <div className="tl-depart">
              <p>
                <span>Départ :</span> HUB {DEPART_HUB}
              </p>
              <p>{labelDate()}</p>
            </div>
          </header>

          <div className="tl-hub">HUB {hub}</div>

          <section className="tl-body">
            <div className="tl-details">
              <p>
                <span>Destinataire :</span> {order.full_name}
              </p>
              <p dir="ltr">
                <span>Telephone :</span> {phone}
              </p>
              <p>
                <span>Ville :</span> {ville}
              </p>
              <p className="tl-address">
                <span>Adresse :</span> {address}
              </p>
              <p>
                <span>Commentaire :</span> {notes}
              </p>
              <p className="tl-goods">
                <span>Marchendise :</span> {marchendise}
              </p>
            </div>
            <div className="tl-track">
              {tracking ? (
                <QRCodeSVG
                  value={tracking}
                  size={86}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  title={tracking}
                />
              ) : null}
              <p className="tl-montant-kicker">MONTANT</p>
              <p className="tl-price">{price} MAD</p>
              <p className="tl-cod">CRBT / COD</p>
            </div>
          </section>

          <div className="tl-colis">COLIS NORMAL</div>

          <footer className="tl-footer">
            <div className="tl-barcode">
              <svg ref={barcodeRef} role="img" aria-label={code} />
              <p className="tl-ord">{code}</p>
            </div>
            <div className="tl-badge">{openLabel}</div>
          </footer>

          <p className="tl-disclaimer">{DISCLAIMER}</p>
        </article>
      </div>
    </div>
  );
}
