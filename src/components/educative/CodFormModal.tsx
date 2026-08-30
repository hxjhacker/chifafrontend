"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Bundle } from "@/lib/educative";
import type { Offer } from "@/lib/offer";
import { CodForm } from "./CodForm";

export function CodFormModal({
  open,
  onClose,
  offer,
  bundle,
  onFocusCheckout,
}: {
  open: boolean;
  onClose: () => void;
  offer?: Offer;
  bundle?: Bundle;
  onFocusCheckout: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[id^="full-name-modal-"]');
      input?.focus();
    }, 80);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[35] overflow-y-auto bg-brandDark"
          style={{ paddingBottom: "max(6.5rem, calc(5.5rem + env(safe-area-inset-bottom)))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal
          aria-labelledby="cod-modal-title"
          onClick={onClose}
        >
          <div
            className="relative mx-auto max-w-lg px-4 pb-4 pt-32"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="mb-3 grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-cardDark text-gold shadow-lg transition hover:bg-gold hover:text-royal"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 id="cod-modal-title" className="sr-only">
              أكّدي الطلب دابا — الدفع عند الاستلام
            </h2>
            <CodForm instanceId="modal" offer={offer} bundle={bundle} onFocusCheckout={onFocusCheckout} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
