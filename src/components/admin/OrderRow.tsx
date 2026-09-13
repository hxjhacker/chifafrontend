"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Phone, Printer } from "lucide-react";
import { WhatsAppIcon } from "@/components/Chrome";
import { OrderActionsMenu } from "@/components/admin/OrderActionsMenu";
import { useLongPress } from "@/hooks/useLongPress";
import {
  allowedNextStatuses,
  canTransitionStatus,
  copyablePhone,
  formatMad,
  shortOrderRef,
  statusMeta,
  telHref,
  waHref,
  carrierTrackingUrl,
  type AdminCarrier,
  type AdminOrder,
  type AdminStatus,
} from "@/lib/admin";
import { cn } from "@/lib/cn";

export type OrderRowStatusOption = { id: AdminStatus; label: string };

export type OrderRowProps = {
  order: AdminOrder;
  selected: boolean;
  onToggleSelected: (on: boolean) => void;
  shipping: boolean;
  duplicating: boolean;
  saving: boolean;
  copiedId: string | null;
  copiedTrackingId: string | null;
  hideNums: boolean;
  statusOptions: OrderRowStatusOption[];
  onCopyPhone: () => void;
  onCopyTracking: () => void;
  onStatusSelect: (next: AdminStatus, el: HTMLSelectElement) => void;
  onSendCarrier: (order: AdminOrder, carrier: AdminCarrier) => void;
  onSendQuickStock?: (order: AdminOrder) => void;
  onPrint: (order: AdminOrder) => void;
  onEdit: (order: AdminOrder) => void;
  onView: (order: AdminOrder) => void;
  onDuplicate: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
};

function StatusSelect({
  order,
  saving,
  statusOptions,
  onStatusSelect,
}: Pick<OrderRowProps, "order" | "saving" | "statusOptions" | "onStatusSelect">) {
  const meta = statusMeta(order.status);
  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        value={order.status}
        disabled={saving || allowedNextStatuses(order.status).length === 0}
        onChange={(e) => onStatusSelect(e.target.value as AdminStatus, e.currentTarget)}
        className={cn("rounded-lg border px-2.5 py-1.5 text-sm font-bold focus:outline-none", meta.selectClass)}
      >
        {statusOptions.map((s) => (
          <option key={s.id} value={s.id} disabled={s.id !== order.status && !canTransitionStatus(order.status, s.id)}>
            {s.label}
          </option>
        ))}
      </select>
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" /> : null}
    </div>
  );
}

function CarrierBadge({ carrier }: { carrier?: string | null }) {
  const quick = carrier === "quick_livraison";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-px text-[9px] font-black",
        quick
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-sky-500/15 text-sky-600 dark:text-sky-300",
      )}
    >
      {quick ? "كويك" : "ميتا"}
    </span>
  );
}

function TrackingChip({
  order,
  copied,
  onCopy,
  onPrint,
}: {
  order: AdminOrder;
  copied: boolean;
  onCopy: () => void;
  onPrint?: (order: AdminOrder) => void;
}) {
  if (!order.meta_livraison_code) return null;
  const quick = (order.carrier || "meta_livraison") === "quick_livraison";
  const trackUrl = carrierTrackingUrl(order);
  return (
    <div className="mt-1 flex max-w-[14rem] flex-wrap items-center gap-1">
      <button
        type="button"
        title="نسخ كود التتبع"
        onClick={onCopy}
        className={cn(
          "inline-flex max-w-[11.5rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition",
          quick
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
            : "border-sky-500/40 bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-300",
        )}
      >
        {copied ? <Check className="h-3 w-3 shrink-0 text-emeraldCustom" /> : <Copy className="h-3 w-3 shrink-0" />}
        <span className="truncate">{order.meta_livraison_code}</span>
        <CarrierBadge carrier={order.carrier} />
      </button>
      {onPrint ? (
        <button
          type="button"
          title="طباعة البوليصة الحرارية A6"
          onClick={() => onPrint(order)}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 dark:text-teal-300"
        >
          <Printer className="h-3 w-3" />
        </button>
      ) : null}
      {trackUrl ? (
        <a
          href={trackUrl}
          target="_blank"
          rel="noreferrer"
          title="تتبع Quick"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

function PhoneActions({
  order,
  copied,
  hideNums,
  onCopyPhone,
}: {
  order: AdminOrder;
  copied: boolean;
  hideNums: boolean;
  onCopyPhone: () => void;
}) {
  const phone = copyablePhone(order);
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        title="انقر لنسخ الرقم"
        onClick={onCopyPhone}
        className={cn(
          "ml-1 rounded-md px-1.5 py-0.5 text-left font-mono text-sm font-medium transition hover:bg-gold/15 hover:text-gold",
          hideNums && "blurred-number",
          copied && "text-emeraldCustom",
        )}
        dir="ltr"
      >
        {copied ? "تم النسخ" : phone}
      </button>
      <button
        type="button"
        onClick={onCopyPhone}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold/10 text-gold transition hover:bg-gold hover:text-royal"
        title="نسخ رقم الهاتف"
      >
        {copied ? <Check className="h-3 w-3 text-emeraldCustom" /> : <Copy className="h-3 w-3" />}
      </button>
      <a
        href={telHref(order.phone || order.phone_national)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500 transition hover:bg-blue-500 hover:text-white"
        title="اتصال"
      >
        <Phone className="h-3 w-3" />
      </a>
      <a
        href={waHref(order.phone || order.phone_national, order.full_name, order.pack_label, order.city)}
        target="_blank"
        rel="noreferrer"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emeraldCustom/10 text-emeraldCustom transition hover:bg-emeraldCustom hover:text-white"
        title="واتساب"
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function Menu({ props, open, onOpenChange }: { props: OrderRowProps; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <OrderActionsMenu
      order={props.order}
      shipping={props.shipping}
      duplicating={props.duplicating}
      onSendCarrier={props.onSendCarrier}
      onSendQuickStock={props.onSendQuickStock}
      onPrint={props.onPrint}
      onEdit={props.onEdit}
      onView={props.onView}
      onDuplicate={props.onDuplicate}
      onDelete={props.onDelete}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

export function OrderDesktopRow(props: OrderRowProps) {
  const { order, selected, onToggleSelected, copiedId, copiedTrackingId, hideNums, onCopyPhone, onCopyTracking } = props;
  return (
    <tr className="transition hover:bg-cream/50 dark:hover:bg-brandDark/50">
      <td className="p-4 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelected(e.target.checked)}
          className="h-4 w-4 accent-gold"
          aria-label={`تحديد طلبية ${order.full_name}`}
        />
      </td>
      <td className="p-4">
        <Menu props={props} />
      </td>
      <td className="p-4 font-mono text-xs text-royal/60 dark:text-slate-400" title={order.order_id}>
        <div>{shortOrderRef(order.order_id)}</div>
        <TrackingChip
          order={order}
          copied={copiedTrackingId === order.order_id}
          onCopy={onCopyTracking}
          onPrint={props.onPrint}
        />
      </td>
      <td className="p-4 font-bold">{order.full_name}</td>
      <td className="p-4">
        <div className="flex flex-col items-start gap-0.5">
          <span className="rounded-md bg-gold/10 px-2 py-1 text-gold-600 dark:text-gold">{order.city}</span>
          {order.shipping_city ? (
            <span dir="ltr" className="px-1 text-[10px] font-bold text-royal/45 dark:text-slate-400">
              {order.shipping_city}
            </span>
          ) : null}
        </div>
      </td>
      <td className="p-4">
        <PhoneActions order={order} copied={copiedId === order.order_id} hideNums={hideNums} onCopyPhone={onCopyPhone} />
      </td>
      <td className="p-4">{order.pack_label}</td>
      <td className={cn("p-4 font-bold text-emeraldCustom", hideNums && "blurred-number")}>{formatMad(order.total)}</td>
      <td className="p-4 text-center">
        <StatusSelect
          order={order}
          saving={props.saving}
          statusOptions={props.statusOptions}
          onStatusSelect={props.onStatusSelect}
        />
      </td>
    </tr>
  );
}

export function OrderMobileCard(props: OrderRowProps) {
  const { order, selected, onToggleSelected, copiedId, copiedTrackingId, hideNums, onCopyPhone, onCopyTracking } = props;
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPress = useLongPress(() => setSheetOpen(true), { delay: 500 });
  return (
    <article
      {...longPress}
      className="select-none rounded-2xl border border-gold/25 bg-white p-3 shadow-sm touch-manipulation [-webkit-touch-callout:none] dark:bg-brandDark"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelected(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-gold"
            aria-label={`تحديد طلبية ${order.full_name}`}
          />
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold text-royal/70 dark:text-slate-300">{shortOrderRef(order.order_id)}</p>
            <p className="mt-0.5 text-xs font-black leading-5 text-royal dark:text-white">{order.pack_label}</p>
            <TrackingChip
              order={order}
              copied={copiedTrackingId === order.order_id}
              onCopy={onCopyTracking}
              onPrint={props.onPrint}
            />
          </div>
        </div>
        <StatusSelect
          order={order}
          saving={props.saving}
          statusOptions={props.statusOptions}
          onStatusSelect={props.onStatusSelect}
        />
      </div>

      <div className="mt-3 space-y-1.5 border-t border-gold/15 pt-3">
        <p className="text-sm font-black text-royal dark:text-white">{order.full_name}</p>
        <div className="flex flex-col items-start gap-0.5">
          <span className="rounded-md bg-gold/10 px-2 py-1 text-xs text-gold-600 dark:text-gold">{order.city}</span>
          {order.shipping_city ? (
            <span dir="ltr" className="px-1 text-[10px] font-bold text-royal/45 dark:text-slate-400">
              {order.shipping_city}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-2 inline-flex rounded-xl border border-gold/30 bg-gold/15 px-3 py-1.5 text-sm font-black text-royal dark:text-gold",
            hideNums && "blurred-number",
          )}
        >
          {formatMad(order.total)}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gold/15 pt-3">
        <PhoneActions order={order} copied={copiedId === order.order_id} hideNums={hideNums} onCopyPhone={onCopyPhone} />
        <Menu props={props} open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    </article>
  );
}
