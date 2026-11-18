"use client";

import {
  STORE_CONTACT,
  copyablePhone,
  detailedAddress,
  displayTrackingCode,
  orderLineItems,
  shortOrderRef,
  type AdminOrder,
} from "@/lib/admin";
import { LabelBarcode, LabelQr } from "@/components/admin/labels/LabelCodes";
import {
  canOpenParcel,
  labelAmount,
} from "@/lib/label-hub";
import { hair, thick, ticketBox, TICKET_FONT } from "@/components/admin/labels/ticketStyles";

function carrierName(carrier?: string | null) {
  if (carrier === "gooli") return "GOOLI EXPRESS";
  if (carrier === "quick_livraison") return "QUICK LIVRAISON";
  if (carrier === "force_log") return "FORCE LOG";
  return "META LIVRAISON";
}

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

function vendor(order: AdminOrder) {
  const record = order as AdminOrder & { vendor_name?: string | null; vendor_phone?: string | null };
  return {
    name: String(record.vendor_name || STORE_CONTACT.name).trim() || STORE_CONTACT.name,
    phone: String(record.vendor_phone || STORE_CONTACT.phone).trim() || STORE_CONTACT.phone,
  };
}

function CheckBox({ checked }: { checked: boolean }) {
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
        fontSize: "11px",
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      {checked ? "✓" : ""}
    </span>
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
        gridTemplateColumns: "22mm minmax(0, 1fr)",
        gap: "1mm",
        alignItems: "start",
        minWidth: 0,
        lineHeight: 1.15,
      }}
    >
      <span style={{ fontSize: "7.2px", fontWeight: 800, whiteSpace: "nowrap" }}>{label}:</span>
      <strong
        dir={dir}
        style={{
          minWidth: 0,
          fontSize: "8.2px",
          fontWeight: 900,
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
  const seller = vendor(order);
  const canOpen = order.carrier === "gooli" || canOpenParcel(order);

  return (
    <div id="printable-ticket" dir="ltr" style={{ ...ticketBox, border: "1.5px solid #111" }}>
      <section
        style={{
          height: "36mm",
          display: "grid",
          gridTemplateColumns: "68fr 32fr",
          borderBottom: thick,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "2.1mm 2.2mm 1.6mm",
            borderRight: hair,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <Detail label="Nom complet" value={order.full_name || "—"} />
          <Detail label="Téléphone" value={phone} dir="ltr" />
          <Detail label="Ville" value={city} />
          <Detail label="Adresse" value={address} clamp={2} />
          <Detail label="Commentaire" value={note} clamp={2} />
          <Detail label="Date d'envoi" value={shipmentDate(order)} dir="ltr" />
        </div>

        <div
          style={{
            padding: "2mm 1.6mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "19mm",
              height: "12mm",
              border: "2px solid #111",
              borderRadius: "5mm 2mm 5mm 2mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "skew(-7deg)",
              marginBottom: "1.2mm",
            }}
          >
            <span style={{ transform: "skew(7deg)", fontSize: "14px", fontWeight: 950, letterSpacing: "-0.6px" }}>
              CG
            </span>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 950, lineHeight: 1.05, maxWidth: "28mm" }}>
            {carrierName(order.carrier)}
          </div>
          <div style={{ marginTop: "1mm", fontSize: "5.5px", fontWeight: 750, letterSpacing: "0.3px" }}>
            LOGISTICS &amp; SOLUTIONS
          </div>
        </div>
      </section>

      <section
        dir="rtl"
        style={{
          height: "8.5mm",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: thick,
          flexShrink: 0,
          fontFamily: TICKET_FONT,
        }}
      >
        <div style={{ borderLeft: hair, display: "flex", alignItems: "center", justifyContent: "center", gap: "2mm" }}>
          <CheckBox checked={canOpen} />
          <strong style={{ fontSize: "9px" }}>{canOpen ? "يمكن فتح العلبة" : "لا يمكن فتح العلبة"}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2mm" }}>
          <CheckBox checked={false} />
          <strong style={{ fontSize: "9px" }}>استبدال المنتج</strong>
        </div>
      </section>

      <section
        style={{
          minHeight: "10mm",
          display: "grid",
          gridTemplateColumns: "22mm minmax(0, 1fr)",
          alignItems: "center",
          borderBottom: thick,
          padding: "1mm 2.2mm",
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: "9px" }}>Produit:</strong>
        <strong
          dir="auto"
          style={{
            fontSize: "9.5px",
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
          height: "9.5mm",
          display: "grid",
          gridTemplateColumns: "34mm 1fr",
          alignItems: "center",
          borderBottom: thick,
          flexShrink: 0,
        }}
      >
        <strong style={{ paddingLeft: "2.2mm", fontSize: "12px" }}>CRBT:</strong>
        <strong style={{ textAlign: "center", fontSize: "18px", fontWeight: 950, letterSpacing: "0.4px" }}>
          {labelAmount(order)} DH
        </strong>
      </section>

      <section
        style={{
          height: "10.5mm",
          borderBottom: thick,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "1mm 2.2mm",
          lineHeight: 1.15,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: "8.5px" }}>
          <strong>Vendeur:</strong>{" "}
          <strong dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {seller.name} — {seller.phone}
          </strong>
        </div>
        <div style={{ fontSize: "7px", marginTop: "0.8mm" }}>Nous vous remercions pour votre confiance :</div>
      </section>

      <section style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "70fr 30fr" }}>
        <div
          style={{
            borderRight: thick,
            padding: "2mm 2mm 1.3mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <LabelBarcode value={code} height={52} width={1.15} style={{ width: "100%", height: "14mm" }} />
          <strong
            dir="ltr"
            style={{
              marginTop: "1mm",
              fontFamily: "Consolas, 'Courier New', monospace",
              fontSize: "8.5px",
              letterSpacing: "0.4px",
              textAlign: "center",
              overflowWrap: "anywhere",
            }}
          >
            {code || shortOrderRef(order.order_id).replace(/^#/, "")}
          </strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2mm" }}>
          <LabelQr value={qr} size={82} title={code} />
        </div>
      </section>
    </div>
  );
}
