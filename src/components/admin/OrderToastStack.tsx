"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, Copy, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/Chrome";
import { copyText } from "@/lib/admin";
import { cn } from "@/lib/cn";
import {
  dismissOrderToast,
  getOrderToasts,
  subscribeOrderToasts,
  whatsappHref,
  type OrderToast,
} from "@/lib/order-toasts";

function OrderToastCard({ toast }: { toast: OrderToast }) {
  const [copied, setCopied] = useState(false);
  const risky = toast.isBlacklisted;

  async function copyPhone() {
    const ok = await copyText(toast.phone);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      dir="rtl"
      data-allow-select="true"
      className={cn(
        "relative w-full shrink-0 overflow-hidden rounded-2xl border bg-[#0c1322]/95 p-2.5 shadow-2xl backdrop-blur-md select-none sm:p-3",
        risky ? "border-rose-500/80 shadow-rose-950/40" : "border-emerald-500/80 shadow-emerald-950/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              risky ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400",
            )}
          >
            {risky ? <Ban className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </span>
          <span className={cn("text-xs font-black", risky ? "text-rose-400" : "text-emerald-400")}>
            {risky ? "تنبيه أمني: زبون محظور!" : "طلبية جديدة"}
          </span>
          <span className="text-[10px] font-medium text-slate-400">• الآن</span>
        </div>
        <button
          type="button"
          aria-label="إغلاق"
          onClick={() => dismissOrderToast(toast.id)}
          className="p-0.5 text-slate-400 transition hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between py-1.5 text-[11px] text-slate-300">
        <div className="max-w-[180px] truncate">
          <strong className="text-white">{toast.name}</strong>{" "}
          {toast.city ? <span className="text-[10px] text-slate-400">({toast.city})</span> : null}
        </div>
        <div className={cn("shrink-0 font-mono text-xs font-bold tracking-tight", risky ? "text-rose-300" : "text-emerald-300")}>
          {toast.phone}
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        <a
          href={`tel:${toast.phone}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-700/80 bg-[#111927] px-1.5 py-1 text-[10px] font-bold text-sky-400 shadow-sm transition hover:text-white"
        >
          <Phone className="h-3 w-3 text-sky-400" />
          اتصال
        </a>
        <a
          href={whatsappHref(toast.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-1 text-[10px] font-bold text-emerald-400 shadow-sm transition hover:text-emerald-300"
        >
          <WhatsAppIcon className="h-3 w-3" />
          واتساب
        </a>
        <button
          type="button"
          onClick={() => void copyPhone()}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-lg border bg-[#111927] px-1.5 py-1 text-[10px] font-bold shadow-sm transition",
            copied
              ? "border-emerald-500/50 text-emerald-400"
              : "border-slate-700/80 text-slate-200 hover:text-white",
          )}
        >
          <Copy className="h-3 w-3 text-amber-400" />
          {copied ? "تم!" : "نسخ"}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-800">
        <div className={cn("h-full animate-toast-progress", risky ? "bg-rose-500" : "bg-emerald-500")} />
      </div>
    </div>
  );
}

export function OrderToastStack() {
  const items = useSyncExternalStore(subscribeOrderToasts, getOrderToasts, getOrderToasts);

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed bottom-6 left-6 z-50 hidden w-[340px] max-h-[380px] flex-col gap-2 overflow-y-auto p-0.5 toast-scroll sm:flex"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-auto shrink-0"
          >
            <OrderToastCard toast={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
