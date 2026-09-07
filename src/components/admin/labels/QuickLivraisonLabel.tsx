"use client";

import { copyablePhone, detailedAddress, type AdminOrder } from "@/lib/admin";
import { LabelBarcode, LabelQr } from "@/components/admin/labels/LabelCodes";
import {
  QUICK_SENDER,
  canOpenParcel,
  formatQuickPhone,
  labelAmount,
  labelQrValue,
  quickMerchandise,
  spacedTracking,
  trackingCode,
} from "@/lib/label-hub";
import { hair, thick, ticketBox } from "@/components/admin/labels/ticketStyles";

function QuickLogo() {
  return (
    <svg width="86" height="28" viewBox="0 0 172 56" aria-hidden="true">
      <polygon points="22,6 42,16 22,26 2,16" fill="#1E4B8E" />
      <polygon points="2,16 22,26 22,42 2,32" fill="#163A6E" />
      <polygon points="22,26 42,16 42,32 22,42" fill="#2E9B4A" />
      <text x="50" y="24" fill="#163A6E" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700">
        Quick Livraison
      </text>
      <text x="50" y="42" fill="#2E9B4A" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="700">
        We Are Every Where
      </text>
    </svg>
  );
}

export function QuickLivraisonLabel({ order }: { order: AdminOrder }) {
  const tracking = trackingCode(order || { order_id: "" });
  const allowed = canOpenParcel(order || {});
  const phone = formatQuickPhone(copyablePhone(order || { phone: "", phone_national: "" }));
  const ville = (order?.shipping_city || order?.city || "—").trim().toUpperCase() || "—";
  const address = detailedAddress(order || {}) || "—";
  const goods = quickMerchandise(order || {});
  const price = labelAmount(order || {});
  const qr = labelQrValue(order || { order_id: "" });

  return (
    <div id="printable-ticket" dir="ltr" style={ticketBox}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 0.85fr",
          borderBottom: thick,
          minHeight: "12mm",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "1.2mm 2mm", borderRight: hair }}>
          <QuickLogo />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "1.2mm 1.6mm", gap: "1.2mm" }}>
          <div style={{ fontSize: "7.5px", fontWeight: 800 }}>Zone Expedition:</div>
          <div
            style={{
              background: "#000",
              color: "#fff",
              textAlign: "center",
              fontWeight: 900,
              fontSize: "13px",
              letterSpacing: "1px",
              padding: "1.4mm 0",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            {QUICK_SENDER.hub}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.95fr 1fr 1.15fr",
          borderBottom: thick,
          minHeight: "28mm",
          flexShrink: 0,
        }}
      >
        <div style={{ borderRight: hair, padding: "1.2mm", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "7.5px", fontWeight: 800, alignSelf: "flex-start", marginBottom: "1mm" }}>Zone Reception:</div>
          <LabelQr value={qr} size={86} title={tracking} />
        </div>
        <div
          style={{
            borderRight: hair,
            padding: "1.2mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1.4mm",
          }}
        >
          <div style={{ fontSize: "7.5px", fontWeight: 800, alignSelf: "flex-start" }}>Expediteur:</div>
          <div style={{ fontSize: "8.5px", fontWeight: 800, marginTop: "2mm" }}>
            {QUICK_SENDER.name} - ({QUICK_SENDER.account})
          </div>
          <div style={{ fontSize: "8px", fontWeight: 700 }}>{QUICK_SENDER.phone}</div>
          <div style={{ fontSize: "10px", fontWeight: 900 }}>{QUICK_SENDER.stock}</div>
        </div>
        <div style={{ padding: "1.2mm 1.6mm", display: "flex", flexDirection: "column", gap: "1.1mm", fontSize: "8px" }}>
          <div style={{ fontWeight: 800 }}>Destinataire:</div>
          <strong dir="auto" style={{ fontSize: "9px", unicodeBidi: "isolate" }}>
            {order.full_name || "—"}
          </strong>
          <div dir="ltr" style={{ fontWeight: 800 }}>
            {phone}
          </div>
          <div style={{ fontWeight: 900, textTransform: "uppercase" }}>{ville}</div>
          <div dir="auto" style={{ fontWeight: 700, lineHeight: 1.2, unicodeBidi: "isolate" }}>
            {address}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: thick,
          minHeight: "7.2mm",
          flexShrink: 0,
          fontSize: "9px",
          fontWeight: 900,
        }}
      >
        <div style={{ borderRight: hair, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {allowed ? "Autorisé à ouvrir" : "Interdit d'ouvrir"}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>Interdit d&apos;essayer</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 1fr",
          borderBottom: thick,
          minHeight: "16mm",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ borderRight: hair, padding: "1.2mm 1.6mm", display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontSize: "7.5px", fontWeight: 800, marginBottom: "1mm" }}>Marchandise:</div>
          <div
            style={{
              fontSize: "7px",
              fontWeight: 700,
              lineHeight: 1.35,
              wordBreak: "break-word",
              direction: "ltr",
              unicodeBidi: "isolate",
            }}
          >
            {goods}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1mm" }}>
          <div style={{ fontSize: "7.5px", fontWeight: 800 }}>Crbt:</div>
          <div style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1.1, marginTop: "1.5mm" }}>{price} DH</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.4mm 2mm 1.8mm",
          flexShrink: 0,
          minHeight: "18mm",
        }}
      >
        <LabelBarcode value={tracking} height={42} width={1.2} style={{ height: "12mm", width: "100%" }} />
        <div
          style={{
            marginTop: "1mm",
            fontFamily: "Consolas, 'Courier New', monospace",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.6px",
            textAlign: "center",
          }}
        >
          {spacedTracking(tracking)}
        </div>
      </div>
    </div>
  );
}
