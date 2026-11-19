"use client";

import {
  copyablePhone,
  detailedAddress,
  displayTrackingCode,
  orderLineItems,
  shortOrderRef,
  type AdminOrder,
} from "@/lib/admin";
import { LabelBarcode, LabelQr } from "@/components/admin/labels/LabelCodes";
import { labelAmount } from "@/lib/label-hub";
import { thick, ticketBox, TICKET_FONT } from "@/components/admin/labels/ticketStyles";

const VENDOR_PHONE = "0640108706";

function shipmentDate(order: AdminOrder) {
  const raw = order.meta_livraison_sent_at || order.created_at || new Date().toISOString();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function CheckBox() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: "4.2mm",
        height: "4.2mm",
        border: "1.5px solid #111",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    />
  );
}

function LivmaxLogo() {
  return (
    <svg width="92" height="34" viewBox="0 0 184 68" role="img" aria-label="livmax Logistics Solutions">
      <g fill="#111">
        <rect x="4" y="11" width="26" height="31" rx="7" />
        <path d="M11 17h7v14h9v6H11z" fill="#fff" />
      </g>
      <text x="36" y="40" fontFamily="Arial, Helvetica, sans-serif" fontSize="35" fontWeight="800" letterSpacing="-2">
        livmax
      </text>
      <text x="102" y="57" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="8" fontWeight="700" letterSpacing="1.5">
        LOGISTICS SOLUTIONS
      </text>
    </svg>
  );
}

function Detail({
  label,
  value,
  dir = "auto",
  clamp = 1,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl" | "auto";
  clamp?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "19mm minmax(0, 1fr)",
        gap: "0.7mm",
        alignItems: "start",
        minWidth: 0,
        lineHeight: 1.15,
      }}
    >
      <span style={{ fontSize: "7.5px", fontWeight: 900, whiteSpace: "nowrap" }}>{label}:</span>
      <strong
        dir={dir}
        style={{
          minWidth: 0,
          fontSize: "7.8px",
          fontWeight: 750,
          unicodeBidi: "isolate",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: clamp,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

export function ReferenceShippingLabel({ order }: { order: AdminOrder }) {
  const code = displayTrackingCode(order) || shortOrderRef(order.order_id).replace(/^#/, "");
  const qr = String(order.meta_livraison_ticket_url || "").trim() || code;
  const phone = copyablePhone(order) || "—";
  const city = String(order.shipping_city || order.city || "—").trim() || "—";
  const address = detailedAddress(order).trim() || city;
  const note = String(order.courier_notes || order.driver_comment || "").trim() || "—";
  const products = orderLineItems(order)
    .map((line) => `${line.label} × ${Math.max(1, Number(line.qty) || 1)}`)
    .join(" + ");

  return (
    <div
      id="printable-ticket"
      dir="ltr"
      style={{
        ...ticketBox,
        border: "0",
        padding: "1mm",
      }}
    >
      <div
        style={{
          height: "100%",
          border: "1.5px solid #111",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
      <section
        style={{
          height: "32.5mm",
          position: "relative",
          borderBottom: thick,
          flexShrink: 0,
          padding: "2mm 2.2mm 1.4mm",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minWidth: 0,
          }}
        >
          <div style={{ width: "66mm" }}>
            <Detail label="Nom complet" value={order.full_name || "—"} />
          </div>
          <div style={{ width: "66mm" }}>
            <Detail label="Téléphone" value={phone} dir="ltr" />
          </div>
          <div style={{ width: "66mm" }}>
            <Detail label="Ville" value={city} />
          </div>
          <Detail label="Adresse" value={address} clamp={2} />
          <Detail label="Commentaire" value={note} clamp={2} />
          <Detail label="Date d'envoi" value={shipmentDate(order)} dir="ltr" />
        </div>

        <div
          style={{
            position: "absolute",
            right: "2mm",
            top: "2.2mm",
            width: "25mm",
            height: "12mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LivmaxLogo />
        </div>
      </section>

      <section
        dir="rtl"
        style={{
          height: "8.5mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          borderBottom: thick,
          flexShrink: 0,
          fontFamily: TICKET_FONT,
          padding: "0 3mm",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.8mm" }}>
          <CheckBox />
          <strong style={{ fontSize: "8px" }}>لا يمكنك فتح الطلبية</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.8mm" }}>
          <CheckBox />
          <strong style={{ fontSize: "8px" }}>إستبدال المنتوج</strong>
        </div>
      </section>

      <section
        style={{
          height: "10mm",
          display: "grid",
          gridTemplateColumns: "16mm minmax(0, 1fr)",
          alignItems: "center",
          borderBottom: thick,
          padding: "1mm 2mm",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: "7.5px" }}>Produit:</strong>
        <strong
          dir="auto"
          style={{
            fontSize: "8px",
            lineHeight: 1.15,
            textAlign: "center",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {products || order.pack_label || "—"}
        </strong>
      </section>

      <section
        style={{
          height: "10mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: thick,
          flexShrink: 0,
          gap: "1.5mm",
        }}
      >
        <strong style={{ fontSize: "11px", fontWeight: 950 }}>CRBT: {labelAmount(order)} DH</strong>
      </section>

      <section
        style={{
          height: "11mm",
          borderBottom: thick,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1mm 2mm",
          lineHeight: 1.15,
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        <strong dir="ltr" style={{ unicodeBidi: "isolate", fontSize: "7.5px" }}>
          Vendeur : &lt;-- glow --&gt; - {VENDOR_PHONE}
        </strong>
        <strong style={{ fontSize: "6.2px", marginTop: "1mm" }}>Nous vous remercions pour votre confiance:</strong>
      </section>

      <section style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "68fr 32fr" }}>
        <div
          style={{
            borderRight: thick,
            padding: "2.2mm 2mm 1.5mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <LabelBarcode value={code} height={52} width={1.15} style={{ width: "100%", height: "13mm" }} />
          <strong
            dir="ltr"
            style={{
              marginTop: "1mm",
              fontFamily: "Consolas, 'Courier New', monospace",
              fontSize: "7.5px",
              letterSpacing: "0.4px",
              textAlign: "center",
              overflowWrap: "anywhere",
            }}
          >
            {code || shortOrderRef(order.order_id).replace(/^#/, "")}
          </strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5mm" }}>
          <LabelQr value={qr} size={80} title={code} />
        </div>
      </section>
      </div>
    </div>
  );
}
