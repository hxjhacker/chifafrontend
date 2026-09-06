"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Eye, Loader2, MoreVertical, Pencil, Printer, Repeat2, Trash2, Truck } from "lucide-react";
import type { AdminOrder } from "@/lib/admin";
import { cn } from "@/lib/cn";

type Props = {
  order: AdminOrder;
  shipping: boolean;
  duplicating: boolean;
  onSendMeta: (order: AdminOrder) => void;
  onPrint: (order: AdminOrder) => void;
  onEdit: (order: AdminOrder) => void;
  onView: (order: AdminOrder) => void;
  onDuplicate: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
};

const MENU_WIDTH = 260;

export function OrderActionsMenu({
  order,
  shipping,
  duplicating,
  onSendMeta,
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
  const [pos, setPos] = useState({ top: 0, left: 0 });

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
    placeMenu();
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
      placeMenu();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const sent = Boolean(order.meta_livraison_code);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
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
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              dir="ltr"
              style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
              className="fixed z-[90] overflow-hidden rounded-2xl border border-gold/25 bg-white py-1.5 shadow-luxury dark:border-gold/20 dark:bg-cardDark"
            >
              <MenuItem
                disabled={sent || shipping || order.status === "cancelled"}
                onSelect={() => run(() => onSendMeta(order))}
              >
                {shipping ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
                ) : sent ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Truck className="h-4 w-4 shrink-0 text-gold" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  {sent ? `Envoyé à Meta Livraison` : "Envoyer à Meta Livraison"}
                  {sent && order.meta_livraison_code ? (
                    <span className="mt-0.5 block truncate font-mono text-[10px] font-bold text-sky-600 dark:text-sky-300">
                      {order.meta_livraison_code}
                    </span>
                  ) : null}
                </span>
              </MenuItem>
              <MenuItem onSelect={() => run(() => onPrint(order))}>
                <Printer className="h-4 w-4 shrink-0 text-emerald-500" />
                Imprimer le ticket / Étiquette Meta
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
          )
        : null}
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  disabled,
  danger,
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-[13px] font-bold transition",
        danger
          ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          : "text-royal hover:bg-gold/10 dark:text-slate-100",
        disabled && "cursor-default opacity-55 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
