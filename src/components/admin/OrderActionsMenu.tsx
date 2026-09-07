"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Eye, Loader2, MoreVertical, Pencil, Printer, Repeat2, Trash2, Truck } from "lucide-react";
import { ADMIN_CARRIERS, shortOrderRef, hasTracking, LABEL_PRINT_HINT, type AdminCarrier, type AdminOrder } from "@/lib/admin";
import { cn } from "@/lib/cn";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  order: AdminOrder;
  shipping: boolean;
  duplicating: boolean;
  onSendCarrier: (order: AdminOrder, carrier: AdminCarrier) => void;
  onPrint: (order: AdminOrder) => void;
  onEdit: (order: AdminOrder) => void;
  onView: (order: AdminOrder) => void;
  onDuplicate: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
};

const MENU_WIDTH = 260;
const CARD =
  "w-full py-3.5 px-4 mb-3 rounded-2xl flex items-center justify-between border transition-all text-sm font-semibold disabled:cursor-default disabled:opacity-50";

export function OrderActionsMenu({
  order,
  shipping,
  duplicating,
  onSendCarrier,
  onPrint,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const sent = Boolean(order.meta_livraison_code);
  const canPrint = hasTracking(order);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLockBodyScroll(open && isMobile);

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const estimated = 280;
    const openUp = r.bottom + 8 + estimated > window.innerHeight && r.top > estimated;
    const top = openUp ? r.top - 8 - estimated : r.bottom + 6;
    setPos({ top: Math.max(8, top), left });
  }

  function close() {
    setOpen(false);
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    if (!window.matchMedia("(max-width: 767px)").matches) placeMenu();
    setOpen(true);
  }

  function run(action: () => void) {
    close();
    action();
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onReposition() {
      if (!window.matchMedia("(max-width: 767px)").matches) placeMenu();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    if (!isMobile) window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", close, true);
    };
  }, [open, isMobile]);

  const trigger = (
    <button
      ref={btnRef}
      type="button"
      aria-haspopup={isMobile ? "dialog" : "menu"}
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      title="إجراءات الطلبية"
      onClick={toggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition",
        "hover:bg-gold hover:text-royal",
        open && "bg-gold text-royal",
      )}
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  );

  if (!open || typeof document === "undefined") {
    return <div className="relative">{trigger}</div>;
  }

  if (isMobile) {
    return (
      <div className="relative">
        {trigger}
        {createPortal(
          <div className="fixed inset-0 z-[90]">
            <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/60" onClick={close} />
            <div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-label={`إجراءات لـ ${shortOrderRef(order.order_id)}`}
              dir="rtl"
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-zinc-950 px-4 pb-6 pt-1 shadow-2xl"
            >
              <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-zinc-600" />
              <h3 className="mb-4 text-center text-base font-black text-white">
                إجراءات لـ {shortOrderRef(order.order_id)}
              </h3>
              {ADMIN_CARRIERS.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  disabled={!row.enabled || sent || shipping || order.status === "cancelled" || order.status === "returned"}
                  onClick={() => run(() => onSendCarrier(order, row.id))}
                  className={cn(
                    CARD,
                    row.id === "quick_livraison"
                      ? "border-sky-500/30 bg-sky-950/20 text-sky-300 hover:bg-sky-900/30"
                      : "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30",
                  )}
                >
                  <span className="min-w-0 flex-1 text-right">
                    {sent && (order.carrier || "meta_livraison") === row.id
                      ? `تم الإرسال إلى ${row.label}`
                      : `إرسال إلى ${row.label}`}
                    {sent && (order.carrier || "meta_livraison") === row.id && order.meta_livraison_code ? (
                      <span className="mt-0.5 block truncate font-mono text-[10px] font-bold">{order.meta_livraison_code}</span>
                    ) : null}
                    {!row.enabled ? <span className="mt-0.5 block text-[10px] font-bold text-amber-300">قريباً</span> : null}
                  </span>
                  {shipping ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : sent && (order.carrier || "meta_livraison") === row.id ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <Truck className="h-5 w-5 shrink-0" />
                  )}
                </button>
              ))}
              <button
                type="button"
                disabled={!canPrint}
                title={canPrint ? "طباعة البوليصة الحرارية" : LABEL_PRINT_HINT}
                onClick={() => {
                  if (!canPrint) return;
                  run(() => onPrint(order));
                }}
                className={cn(CARD, "border-teal-500/30 bg-teal-950/20 text-teal-400 hover:bg-teal-900/30")}
              >
                <span className="min-w-0 flex-1 text-right">
                  طباعة التذكرة / الملصق
                  {!canPrint ? (
                    <span className="mt-0.5 block text-[10px] font-bold text-amber-300">{LABEL_PRINT_HINT}</span>
                  ) : null}
                </span>
                <Printer className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => run(() => onEdit(order))}
                className={cn(CARD, "border-blue-500/30 bg-blue-950/20 text-blue-400 hover:bg-blue-900/30")}
              >
                <span>تعديل الطلبية</span>
                <Pencil className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => run(() => onView(order))}
                className={cn(CARD, "border-sky-500/30 bg-sky-950/20 text-sky-400 hover:bg-sky-900/30")}
              >
                <span>عرض التفاصيل</span>
                <Eye className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                disabled={duplicating}
                onClick={() => run(() => onDuplicate(order))}
                className={cn(CARD, "border-indigo-500/30 bg-indigo-950/20 text-indigo-400 hover:bg-indigo-900/30")}
              >
                <span>تكرار الطلبية</span>
                {duplicating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Repeat2 className="h-5 w-5 shrink-0" />}
              </button>
              <button
                type="button"
                onClick={() => run(() => onDelete(order))}
                className={cn(CARD, "border-rose-500/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/30")}
              >
                <span>حذف الطلبية</span>
                <Trash2 className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={close}
                className="mx-auto mt-2 block rounded-2xl border border-zinc-700 bg-zinc-900 px-8 py-2 text-sm text-zinc-300"
              >
                إغلاق
              </button>
            </div>
          </div>,
          document.body,
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {trigger}
      {createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          dir="ltr"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-[90] overflow-hidden rounded-2xl border border-gold/25 bg-white py-1.5 shadow-luxury dark:border-gold/20 dark:bg-cardDark"
        >
          {ADMIN_CARRIERS.map((row) => (
            <MenuItem
              key={row.id}
              disabled={!row.enabled || sent || shipping || order.status === "cancelled" || order.status === "returned"}
              onSelect={() => run(() => onSendCarrier(order, row.id))}
            >
              {shipping ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
              ) : sent && (order.carrier || "meta_livraison") === row.id ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Truck className="h-4 w-4 shrink-0 text-gold" />
              )}
              <span className="min-w-0 flex-1 text-left">
                {sent && (order.carrier || "meta_livraison") === row.id
                  ? `Envoyé à ${row.label}`
                  : `Envoyer à ${row.label}`}
                {sent && (order.carrier || "meta_livraison") === row.id && order.meta_livraison_code ? (
                  <span className="mt-0.5 block truncate font-mono text-[10px] font-bold text-sky-600 dark:text-sky-300">
                    {order.meta_livraison_code}
                  </span>
                ) : null}
                {!row.enabled ? <span className="mt-0.5 block text-[10px] font-bold text-amber-500">Bientôt</span> : null}
              </span>
            </MenuItem>
          ))}
          <MenuItem
            disabled={!canPrint}
            title={canPrint ? "طباعة التذكرة / الملصق" : LABEL_PRINT_HINT}
            onSelect={() => {
              if (!canPrint) return;
              run(() => onPrint(order));
            }}
          >
            <Printer className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="min-w-0 flex-1 text-left">
              Imprimer le ticket / Étiquette
              {!canPrint ? (
                <span className="mt-0.5 block text-[10px] font-bold leading-4 text-amber-600 dark:text-amber-300">
                  {LABEL_PRINT_HINT}
                </span>
              ) : null}
            </span>
          </MenuItem>
          <MenuItem onSelect={() => run(() => onEdit(order))}>
            <Pencil className="h-4 w-4 shrink-0 text-gold" />
            Modifier la commande
          </MenuItem>
          <MenuItem onSelect={() => run(() => onView(order))}>
            <Eye className="h-4 w-4 shrink-0 text-sky-500" />
            Afficher les détails
          </MenuItem>
          <MenuItem disabled={duplicating} onSelect={() => run(() => onDuplicate(order))}>
            {duplicating ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
            ) : (
              <Repeat2 className="h-4 w-4 shrink-0 text-violet-500" />
            )}
            Dupliquer la commande
          </MenuItem>
          <div className="my-1 border-t border-gold/15" />
          <MenuItem danger onSelect={() => run(() => onDelete(order))}>
            <Trash2 className="h-4 w-4 shrink-0" />
            Supprimer la commande
          </MenuItem>
        </div>,
        document.body,
      )}
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  disabled,
  danger,
  title,
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-[13px] font-bold transition",
        danger
          ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          : "text-royal hover:bg-gold/10 dark:text-slate-100",
        disabled && "cursor-not-allowed opacity-55 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
