"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { copyablePhone, detailedAddress, type AdminOrder } from "@/lib/admin";
import {
  META_SENDER,
  canOpenParcel,
  destinationHub,
  formatMetaPhone,
  labelAmount,
  labelDate,
  labelQrValue,
  metaMerchandise,
  parcelOrderCode,
} from "@/lib/label-hub";
import { buildTarifIndex, findCityTarif, hubCode, loadAdminCityTarifs } from "@/lib/city-tarifs";
import { hair, thick, ticketBox } from "@/components/admin/labels/ticketStyles";

function MetaLogo() {
  return (
    <svg width="28" height="18" viewBox="0 0 48 28" fill="none" aria-hidden="true">
      <path
        d="M8 22C8 12 14 4 20 4c4.2 0 6.8 4.6 8 8 1.2-3.4 3.8-8 8-8 6 0 12 8 12 18"
        stroke="#000"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M36 16l8 6-9 1.5" fill="#000" />
    </svg>
  );
}

export function MetaLivraisonLabel({ order }: { order: AdminOrder }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const tracking = (order.meta_livraison_code || order.tracking_number || "").trim();
  const code = parcelOrderCode(order.order_id);
  const allowed = canOpenParcel(order);
  const [tarifHub, setTarifHub] = useState("");
  const fallbackHub = destinationHub(order.city, order.shipping_city, order.region_id || order.region);
  const hub = hubCode(tarifHub || fallbackHub) || (order.shipping_city || order.city || "DESTINATION").toUpperCase();
  const phone = formatMetaPhone(copyablePhone(order));
  const ville = (order.shipping_city || order.city || "—").trim().toUpperCase() || "—";
  const address = detailedAddress(order) || "—";
  const notes = (order.courier_notes || order.driver_comment || "").trim();
  const marchendise = metaMerchandise(order);
  const price = labelAmount(order);
  const qr = labelQrValue(order);

  useEffect(() => {
    let alive = true;
    void loadAdminCityTarifs().then((rows) => {
      if (!alive) return;
      const hit = findCityTarif(buildTarifIndex(rows), order.shipping_city, order.city);
      const resolved = hubCode(hit?.hub_code || hit?.hub_name);
      if (resolved) setTarifHub(resolved);
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
      width: 1.05,
      height: 38,
      displayValue: false,
      margin: 0,
    });
  }, [code]);

  const rows: { label: string; value: string; dir?: "ltr" | "rtl" | "auto" }[] = [
    { label: "Destinataire", value: order.full_name || "—", dir: "auto" },
    { label: "Telephone", value: phone, dir: "ltr" },
    { label: "Ville", value: ville, dir: "ltr" },
    { label: "Adresse :", value: address, dir: "auto" },
    { label: "Commentaire:", value: notes, dir: "auto" },
    { label: "Marchendise", value: marchendise, dir: "ltr" },
  ];

  return (
    <div id="printable-ticket" dir="ltr" style={ticketBox}>
      <div
        style={{
          height: "11mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          borderBottom: thick,
          flexShrink: 0,
        }}
      >
        <MetaLogo />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span style={{ fontSize: "13px", fontWeight: 900, letterSpacing: "-0.4px" }}>metalivraison</span>
          <span dir="rtl" style={{ fontSize: "7px", fontWeight: 700, fontFamily: "Tahoma, Arial, sans-serif" }}>
            بإرادتنا حلمكم يوصل
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.45fr 1fr",
          borderBottom: thick,
          minHeight: "10mm",
          flexShrink: 0,
          fontSize: "8px",
        }}
      >
        <div style={{ padding: "1.5mm 1.8mm", borderRight: hair, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1px" }}>
          <div>
            <span>Expediteur : </span>
            <strong>
              {META_SENDER.name} ({META_SENDER.account})
            </strong>
          </div>
          <div>
            <span>Telephone : </span>
            <strong>{META_SENDER.phone}</strong>
          </div>
        </div>
        <div style={{ padding: "1.5mm 1.8mm", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 900 }}>Départ :</span>
          <div style={{ textAlign: "right", lineHeight: 1.15 }}>
            <div style={{ fontSize: "9.5px", fontWeight: 900 }}>HUB {META_SENDER.hub}</div>
            <div style={{ fontSize: "8px", fontWeight: 700 }}>{labelDate()}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#000",
          color: "#fff",
          textAlign: "center",
          padding: "1.4mm 0",
          fontSize: "13px",
          fontWeight: 900,
          letterSpacing: "0.8px",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        HUB {hub}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 0.95fr", flex: 1, minHeight: 0, borderBottom: thick }}>
        <div style={{ borderRight: thick, display: "flex", flexDirection: "column" }}>
          {rows.map((row, index) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                gap: "3px",
                padding: "0.7mm 1.6mm",
                fontSize: "7.5px",
                flex: 1,
                alignItems: "center",
                borderBottom: index === rows.length - 1 ? "none" : hair,
                minHeight: 0,
              }}
            >
              <span style={{ minWidth: "58px", fontWeight: 700, flexShrink: 0 }}>{row.label}</span>
              <strong
                dir={row.dir}
                style={{
                  fontWeight: 800,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: row.label.startsWith("Adresse") ? 2 : 1,
                  WebkitBoxOrient: "vertical",
                  unicodeBidi: "isolate",
                }}
              >
                {row.value}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5mm" }}>
            <QRCodeSVG value={qr} size={78} level="M" marginSize={0} bgColor="#ffffff" fgColor="#000000" title={tracking || code} />
          </div>
          <div style={{ borderTop: thick, textAlign: "center", padding: "1.2mm 1mm 1.6mm" }}>
            <div style={{ fontSize: "7px", fontWeight: 900, letterSpacing: "0.6px" }}>MONTANT</div>
            <div style={{ fontSize: "18px", fontWeight: 900, lineHeight: 1.05 }}>
              {price} MAD
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "9px",
          padding: "0.9mm 0",
          borderBottom: thick,
          letterSpacing: "1.4px",
          flexShrink: 0,
        }}
      >
        COLIS NORMAL
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 9.5mm",
          alignItems: "stretch",
          minHeight: "16mm",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1mm 1.5mm 0.6mm" }}>
          <svg ref={barcodeRef} role="img" aria-label={code} style={{ height: "10mm", width: "100%", maxWidth: "72mm" }} />
          <div style={{ fontSize: "6.5px", fontWeight: 700, letterSpacing: "0.2px", marginTop: "0.4mm", wordBreak: "break-all", textAlign: "center" }}>
            {code}
          </div>
        </div>
        <div
          style={{
            borderLeft: thick,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "6.5px",
            fontWeight: 900,
            letterSpacing: "0.3px",
            padding: "1.2mm 0.6mm",
            fontFamily: "Tahoma, Arial, sans-serif",
          }}
        >
          {allowed ? "مسموح فتح الطلبية" : "ممنوع فتح الطلبية"}
        </div>
      </div>

      <div
        style={{
          background: "#000",
          color: "#fff",
          textAlign: "center",
          fontSize: "5.2px",
          fontWeight: 700,
          padding: "1.1mm 1mm",
          letterSpacing: "0.25px",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        META LIVRAISON EST UNIQUEMENT UNE ENTREPRISE DE LIVRAISON.
      </div>
    </div>
  );
}
