"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { copyablePhone, detailedAddress, orderLineItems, type AdminOrder } from "@/lib/admin";
import { destinationHub, labelDate, parcelOrderCode } from "@/lib/label-hub";
import { buildTarifIndex, findCityTarif, hubCode, loadAdminCityTarifs } from "@/lib/city-tarifs";
import { digitsOnly } from "@/lib/phone";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
};

const SENDER_NAME = "CHIFA GLOW (7605)";
const SENDER_PHONE = "06-20-86-38-95";
const DEPART_HUB = "HUB FES";
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

function MetaLogo() {
  return (
    <svg width="34" height="20" viewBox="0 0 40 24" fill="none" aria-hidden="true">
      <path
        d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 13.5 20 12C22 10.5 24.686 6 28 6C31.314 6 34 8.686 34 12C34 15.314 31.314 18 28 18C24.686 18 22 13.5 20 12C18 10.5 15.314 6 12 6Z"
        stroke="#000"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetaLivraisonTicket({ order }: { order: AdminOrder }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const tracking = (order.meta_livraison_code || "").trim();
  const code = parcelOrderCode(order.order_id);
  const isCanOpen = canOpenParcel(order);
  const [tarifHub, setTarifHub] = useState("");
  const fallbackHub = destinationHub(order.city, order.shipping_city, order.region_id || order.region);
  const hubDestination = tarifHub || fallbackHub || (order.shipping_city || order.city || "DESTINATION").toUpperCase();
  const currentDate = labelDate();
  const phone = formatLabelPhone(copyablePhone(order));
  const ville = (order.shipping_city || order.city || "—").trim() || "—";
  const address = detailedAddress(order) || "—";
  const notes = (order.courier_notes || order.driver_comment || "").trim();
  const lines = orderLineItems(order);
  const marchendise = lines.map((line) => `${line.label} × ${line.qty}`).join(" + ") || "—";
  const price = Math.round(Number(order.total ?? order.total_price) || 0);

  useEffect(() => {
    let alive = true;
    void loadAdminCityTarifs().then((rows) => {
      if (!alive) return;
      const hit = findCityTarif(buildTarifIndex(rows), order.shipping_city, order.city);
      const hub = hubCode(hit?.hub_code || hit?.hub_name);
      if (hub) setTarifHub(hub);
    });
    return () => {
      alive = false;
    };
  }, [order.city, order.shipping_city]);

  useEffect(() => {
    const node = barcodeRef.current;
    if (!node || !code) return;
    JsBarcode(node, code, {
      format: "CODE128",
      lineColor: "#000000",
      background: "#ffffff",
      width: 1.15,
      height: 36,
      displayValue: false,
      margin: 0,
    });
  }, [code]);

  return (
    <div
      id="printable-ticket"
      dir="ltr"
      style={{
        width: "380px",
        height: "380px",
        border: "2.5px solid #000",
        fontFamily: "'Segoe UI', Arial, Tahoma, 'Cairo', 'Noto Sans Arabic', sans-serif",
        color: "#000",
        background: "#fff",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        margin: "0 auto",
        userSelect: "none",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div
        style={{
          height: "42px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderBottom: "2px solid #000",
          flexShrink: 0,
        }}
      >
        <MetaLogo />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
          <span style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-0.5px" }}>metalivraison</span>
          <span
            dir="rtl"
            style={{ fontSize: "7.5px", fontWeight: "bold", fontFamily: "Tahoma, Cairo, sans-serif" }}
          >
            بإرادتنا حلمكم يوصل
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          borderBottom: "2.5px solid #000",
          fontSize: "9px",
          minHeight: "36px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "3px 5px",
            borderRight: "2px solid #000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div>
            <strong style={{ fontSize: "9.5px" }}>Expediteur :</strong>{" "}
            <span style={{ fontWeight: 800 }}>{SENDER_NAME}</span>
          </div>
          <div>
            <strong style={{ fontSize: "9.5px" }}>Telephone :</strong> {SENDER_PHONE}
          </div>
        </div>
        <div
          style={{
            padding: "3px 5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 900 }}>Départ :</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", fontWeight: 900 }}>{DEPART_HUB}</div>
            <div style={{ fontSize: "8.5px", fontWeight: "bold" }}>{currentDate}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#000",
          color: "#fff",
          textAlign: "center",
          padding: "3px 0",
          fontSize: "15px",
          fontWeight: 900,
          letterSpacing: "1px",
          flexShrink: 0,
        }}
      >
        HUB {hubDestination}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr",
          flex: 1,
          minHeight: 0,
          borderBottom: "2.5px solid #000",
        }}
      >
        <div
          style={{
            padding: "3px 5px",
            borderRight: "2.5px solid #000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            fontSize: "9px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Destinataire :</span>
            <strong style={{ fontSize: "9.5px" }}>{order.full_name}</strong>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Telephone :</span>
            <span style={{ fontWeight: 800 }} dir="ltr">{phone}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Ville :</span>
            <strong style={{ textTransform: "uppercase" }}>{ville}</strong>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Adresse :</span>
            <span style={{ overflow: "hidden" }}>{address}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Commentaire:</span>
            <span>{notes}</span>
          </div>
          <div style={{ display: "flex", gap: "4px", borderTop: "1px solid #ccc", paddingTop: "2px" }}>
            <span style={{ minWidth: "62px", fontWeight: 700 }}>Marchendise :</span>
            <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>{marchendise}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "4px 2px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "95px",
            }}
          >
            {tracking ? (
              <QRCodeSVG
                value={tracking}
                size={90}
                level="M"
                marginSize={0}
                bgColor="#ffffff"
                fgColor="#000000"
                title={tracking}
              />
            ) : null}
          </div>
          <div style={{ borderTop: "2px solid #000", width: "100%", textAlign: "center", paddingTop: "2px" }}>
            <div style={{ fontSize: "7.5px", fontWeight: 900, letterSpacing: "0.5px" }}>MONTANT</div>
            <div style={{ fontSize: "20px", fontWeight: 900, lineHeight: 1 }}>
              {price} <span style={{ fontSize: "9px" }}>MAD</span>
            </div>
            <div style={{ fontSize: "6.5px", fontWeight: "bold", color: "#444" }}>CRBT / COD</div>
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "10px",
          padding: "1px 0",
          borderBottom: "2px solid #000",
          letterSpacing: "1.5px",
          flexShrink: 0,
        }}
      >
        COLIS NORMAL
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 34px",
          alignItems: "center",
          padding: "2px 4px",
          minHeight: "56px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: "96%",
              height: "36px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <svg ref={barcodeRef} role="img" aria-label={code} style={{ height: "36px", width: "100%", maxWidth: "270px" }} />
          </div>
          <div style={{ fontSize: "7.5px", fontWeight: "bold", letterSpacing: "0.5px", marginTop: "1px" }}>
            {code}
          </div>
        </div>

        <div
          style={{
            border: "1.5px solid #000",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "7.5px",
            fontWeight: 900,
            letterSpacing: "0.5px",
          }}
        >
          {isCanOpen ? "مسموح بالفتح" : "ممنوع فتح الطلبية"}
        </div>
      </div>

      <div
        style={{
          background: "#000",
          color: "#fff",
          textAlign: "center",
          fontSize: "6px",
          fontWeight: "bold",
          padding: "2.5px 0",
          letterSpacing: "0.5px",
          flexShrink: 0,
        }}
      >
        {DISCLAIMER}
      </div>
    </div>
  );
}

export function ShippingLabel({ order, onClose }: Props) {
  useLockBodyScroll(Boolean(order));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

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

        <MetaLivraisonTicket order={order} />
      </div>
    </div>
  );
}
