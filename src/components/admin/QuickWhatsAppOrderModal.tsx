"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { regionIdForCity } from "@/lib/admin-geo";
import { fetchAdminProducts, productOptionLabel, type AdminProduct } from "@/lib/admin-products";
import type { AdminOrder } from "@/lib/admin";
import { parseWhatsAppOrderText, WHATSAPP_ORDER_PLACEHOLDER } from "@/lib/whatsapp-order";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (order: AdminOrder) => void;
  onWarning: (message: string) => void;
};

export function QuickWhatsAppOrderModal({ open, onClose, onCreated, onWarning }: Props) {
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSlug, setProductSlug] = useState("");
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    setRaw("");
    setError("");
    setSaving(false);
    setProductSlug("");
    void fetchAdminProducts()
      .then((rows) => setProducts(rows.filter((p) => p.is_active)))
      .catch(() => setProducts([]));
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const parsed = parseWhatsAppOrderText(raw);
    const chosenSlug = productSlug || parsed.productSlug;
    if (parsed.missing.includes("name") || parsed.missing.includes("phone")) {
      const message = parsed.missing.includes("name") && parsed.missing.includes("phone")
        ? "الاسم ورقم الهاتف مطلوبان. الصق النص بالترتيب الصحيح."
        : parsed.missing.includes("name")
          ? "الاسم الكامل ناقص. يجب أن يكون في السطر الأول."
          : "رقم الهاتف ناقص أو غير صالح. يجب أن يكون 10 أرقام في السطر الرابع.";
      setError(message);
      onWarning(message);
      return;
    }
    if (parsed.missing.length) {
      const missing = productSlug ? parsed.missing.filter((key) => key !== "product") : parsed.missing;
      if (missing.length) {
      const labels: Record<(typeof parsed.missing)[number], string> = {
        name: "الاسم",
        city: "المدينة",
        address: "العنوان",
        phone: "رقم الهاتف",
        price: "الثمن",
        product: "المنتج (1 أو 2 أو 3)",
      };
      const message = `الحقول الناقصة: ${missing.map((key) => labels[key]).join("، ")}`;
      setError(message);
      onWarning(message);
      return;
      }
    }

    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: parsed.customerName,
          city: parsed.city,
          address: parsed.address,
          phone: parsed.phone,
          total_mad: parsed.price,
          product_slug: chosenSlug,
          tier_qty: parsed.qty,
          status: "new",
          region_id: regionIdForCity(parsed.city),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_name: "الاسم قصير جداً.",
          invalid_ma_phone: "رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط.",
          invalid_city: "المدينة غير صالحة.",
          invalid_price: "الثمن غير صالح.",
        };
        throw new Error(map[body.detail || ""] || "تعذر حفظ الطلبية.");
      }
      onCreated((await res.json()) as AdminOrder);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الطلبية.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-emerald-500/30 bg-white p-5 shadow-2xl dark:bg-cardDark sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emeraldCustom">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-royal dark:text-white">إضافة سريعة من الواتساب</h3>
              <p className="text-[11px] text-royal/60 dark:text-slate-400">سطر لكل معلومة، بالترتيب المحدد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream text-royal/50 transition hover:text-rose-500 dark:bg-brandDark dark:text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3.5">
          <label className="block text-xs font-bold text-royal/80 dark:text-slate-200">
            الصق نص الزبون هنا
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              required
              rows={9}
              dir="rtl"
              placeholder={WHATSAPP_ORDER_PLACEHOLDER}
              className="mt-1.5 w-full resize-y rounded-2xl border border-gold/20 bg-cream px-3.5 py-3 font-mono text-xs leading-6 text-royal placeholder-royal/35 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </label>
          <ol className="grid grid-cols-1 gap-1 rounded-2xl border border-gold/10 bg-cream/60 p-3 text-[11px] font-bold text-royal/70 dark:bg-brandDark/60 dark:text-slate-300 sm:grid-cols-2">
            <li>1. الاسم الكامل</li>
            <li>2. المدينة</li>
            <li>3. العنوان بالتفصيل</li>
            <li>4. رقم الهاتف</li>
            <li>5. الثمن</li>
            <li>6. المنتج: 1 قرآن · 2 أطفال · 3 موسيقى — أو اختر من القائمة</li>
            <li>7. الكمية (اختياري — الافتراضي 1)</li>
          </ol>

          {products.length ? (
            <label className="block text-xs font-bold text-royal/80 dark:text-slate-200">
              المنتج (يمكن تجاوز سطر الواتساب)
              <select
                value={productSlug || parseWhatsAppOrderText(raw).productSlug}
                onChange={(e) => setProductSlug(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gold/20 bg-cream px-3 py-2.5 font-bold text-royal transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {productOptionLabel(p)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldCustom py-3 text-xs font-black text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-60",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {saving ? "جاري التحليل والإضافة…" : "تحليل وإضافة الطلبية"}
          </button>
        </form>
      </div>
    </div>
  );
}
