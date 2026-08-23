"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import { TIERS } from "@/lib/cn";

export function CartDrawer() {
  const cart = useCart();
  const product = cart.productSlug ? getProduct(cart.productSlug) : null;
  const cross = cart.suggestedCross ? getProduct(cart.suggestedCross) : null;
  const tier = TIERS.find((t) => t.qty === cart.tierQty);

  return (
    <AnimatePresence>
      {cart.drawerOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق"
            className="fixed inset-0 z-50 bg-royal/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => cart.setDrawer(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-label="السلة"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-gold-200 px-5 py-4">
              <h2 className="text-lg font-bold text-royal">سلتك</h2>
              <button type="button" onClick={() => cart.setDrawer(false)} aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {product && tier ? (
                <div className="rounded-2xl border border-gold-200 bg-white p-4">
                  <p className="font-bold text-royal">{product.nameAr}</p>
                  <p className="text-sm text-royal/70">
                    {tier.label} — {tier.price} درهم
                  </p>
                  {tier.save > 0 ? (
                    <p className="mt-1 text-sm text-emerald">وفّرتي {tier.save} درهم على الثمن الفردي</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-royal/70">السلة فارغة.</p>
              )}
              {cross ? (
                <div className="rounded-2xl border border-dashed border-gold bg-white p-4">
                  <p className="text-sm font-bold text-royal">زيد USB ثاني بـ 199 درهم (الثمن الأصلي)</p>
                  <p className="mt-1 text-sm text-royal/80">{cross.nameAr}</p>
                  <button
                    type="button"
                    onClick={cart.toggleCrossSell}
                    className="mt-3 w-full rounded-xl border border-gold px-3 py-2 text-sm"
                  >
                    {cart.crossSellSlug ? "إزالة العرض" : "أضيفي للطلب"}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="border-t border-gold-200 p-5">
              <p className="mb-3 text-royal">
                المجموع: <b>{cart.totalPreview} درهم</b>
              </p>
              <button
                type="button"
                disabled={!product}
                onClick={cart.openCheckout}
                className="btn-gold w-full disabled:opacity-50"
              >
                إتمام الطلب — الدفع عند الاستلام
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
