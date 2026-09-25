"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { dispatchDashboardSound } from "@/components/admin/DashboardSoundEngine";
import { regionIdForCity } from "@/lib/admin-geo";
import { fetchAdminProducts, type AdminProduct } from "@/lib/admin-products";
import type { AdminOrder } from "@/lib/admin";
import {
  parseWhatsAppOrderText,
  whatsappCatalog,
  whatsappPlaceholder,
  type WhatsAppCatalogProduct,
  type WhatsAppStockTone,
} from "@/lib/whatsapp-order";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (order: AdminOrder) => void;
  onWarning: (message: string) => void;
};

const TONE_CLASS: Record<WhatsAppStockTone, string> = {
  green: "border-emerald-500/25 bg-emerald-500/15 text-emerald-400",
  amber: "border-amber-500/25 bg-amber-500/15 text-amber-400",
  blue: "border-blue-500/25 bg-blue-500/15 text-blue-400",
};

function WhatsAppBadge() {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-[#25D366]/25 bg-[#25D366]/10 shadow-[0_4px_14px_rgba(37,211,102,0.08)]"
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width="23" height="23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.65 6.3L3.15 29l6.86-1.8A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Z"
          fill="#25D366"
        />
        <path
          d="M22.6 18.76c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.61-.81-.62h-.69c-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3s1.29 3.48 1.47 3.72c.18.24 2.53 3.86 6.13 5.41.86.37 1.53.59 2.05.76.86.27 1.64.23 2.26.14.69-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42Z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}

function ProductRow({ product }: { product: WhatsAppCatalogProduct }) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[0.88rem] font-semibold text-white">{product.name}</span>
        <span className="shrink-0 rounded bg-white/[0.04] px-1.5 py-px font-mono text-[0.75rem] text-slate-500">
          {product.code}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("rounded-md border px-1.5 py-0.5 text-[0.72rem] font-bold", TONE_CLASS[product.stockTone])}>
          {product.stockLabel}
        </span>
        <span className="text-[0.82rem] font-bold text-slate-50">{product.price} MAD</span>
      </div>
    </>
  );
}

export function QuickWhatsAppOrderModal({ open, onClose, onCreated, onWarning }: Props) {
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [quickStock, setQuickStock] = useState(true);
  const [productSlug, setProductSlug] = useState("");
  const [productError, setProductError] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLockBodyScroll(open);

  const catalog = useMemo(() => whatsappCatalog(products, quickStock), [products, quickStock]);
  const selected = catalog.find((row) => row.slug === productSlug) || null;

  useEffect(() => {
    if (!open) {
      setProductSlug("");
      setProductError(false);
      setSelectOpen(false);
      return;
    }
    setRaw("");
    setError("");
    setSaving(false);
    setProductSlug("");
    setProductError(false);
    setQuickStock(true);
    setSelectOpen(false);
    void fetchAdminProducts()
      .then((rows) => setProducts(rows.filter((row) => row.is_active)))
      .catch(() => setProducts([]));
    const id = window.setTimeout(() => textareaRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (productSlug && !catalog.some((row) => row.slug === productSlug)) {
      setProductSlug("");
    }
  }, [catalog, productSlug]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (selectRef.current?.contains(e.target as Node)) return;
      setSelectOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (selectOpen) {
        setSelectOpen(false);
        return;
      }
      onClose();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, selectOpen]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const parsed = parseWhatsAppOrderText(raw);
    if (!selected) {
      const message = "يرجى تحديد المنتج أولاً قبل المتابعة";
      setError(message);
      setProductError(true);
      dispatchDashboardSound("error");
      return;
    }
    if (parsed.missing.length) {
      const labels: Record<(typeof parsed.missing)[number], string> = {
        name: "الاسم",
        city: "المدينة",
        address: "العنوان",
        phone: "رقم الهاتف",
      };
      const message =
        parsed.missing.includes("name") && parsed.missing.includes("phone")
          ? "الاسم ورقم الهاتف مطلوبان. الصق النص بالترتيب الصحيح."
          : `الحقول الناقصة: ${parsed.missing.map((key) => labels[key]).join("، ")}`;
      setError(message);
      onWarning(message);
      return;
    }

    const price = parsed.price ?? selected.price;
    if (!price || price < 1) {
      const message = "الثمن غير صالح.";
      setError(message);
      onWarning(message);
      return;
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
          total_mad: price,
          product_slug: selected.slug,
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
      setProductSlug("");
      setProductError(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الطلبية.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        dir="rtl"
        className="relative my-auto w-full max-w-[500px] rounded-2xl border border-[#1e2d4a] bg-[#0b1324] px-6 py-[22px] text-slate-50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          title="إغلاق"
          className="absolute left-[18px] top-[18px] flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-red-500/35 hover:bg-red-500/12 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-[18px] flex items-center justify-start gap-3 pe-10">
          <WhatsAppBadge />
          <div className="text-right">
            <h2 className="text-[1.15rem] font-extrabold leading-snug text-white">إضافة سريعة من الواتساب</h2>
            <p className="mt-0.5 text-[0.8rem] text-slate-400">سطر لكل معلومة، بالترتيب المحدد</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3.5 rounded-xl border border-[#1e2d4a] bg-[#060a14] px-3.5 py-2.5">
          <div className="min-w-0 flex-1 text-right">
            <span className={cn("block text-[0.88rem] font-bold leading-snug", quickStock ? "text-blue-400" : "text-emerald-400")}>
              {quickStock ? "مخزون مستودع Quick (Stock)" : "منتجات المتجر (شحن عادي)"}
            </span>
            <span className="mt-0.5 block text-[0.74rem] text-slate-400">
              {quickStock ? "خصم وشحن تلقائي من ستوك QuickLivraison" : "شحن عادي ومحلي"}
            </span>
          </div>
          <label className="relative h-[25px] w-12 shrink-0 cursor-pointer" dir="ltr">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={quickStock}
              aria-label="مخزون مستودع Quick"
              onChange={(e) => {
                setQuickStock(e.target.checked);
                setSelectOpen(false);
                setError("");
              }}
            />
            <span className="absolute inset-0 rounded-full bg-slate-600 transition peer-checked:bg-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400/40" />
            <span className="absolute bottom-1 left-1 h-[17px] w-[17px] rounded-full bg-white transition peer-checked:translate-x-[23px]" />
          </label>
        </div>

        <form onSubmit={(e) => void onSubmit(e)}>
          <label className="mb-1.5 block text-right text-[0.85rem] font-bold text-slate-100" htmlFor="whatsapp-quick-input">
            الصق نص الزبون هنا
          </label>
          <textarea
            id="whatsapp-quick-input"
            ref={textareaRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            required
            spellCheck={false}
            dir="rtl"
            placeholder={whatsappPlaceholder(quickStock)}
            className="mb-4 h-[200px] w-full resize-none rounded-xl border border-[#1e2d4a] bg-[#050a14] px-[18px] py-4 text-right text-[0.96rem] leading-[1.85] text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          />

          <div className="mb-4 rounded-[10px] border border-[#1e2d4a] bg-[#060a14] px-4 py-3">
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-[7px] text-right text-[0.82rem] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">1.</span> الاسم الكامل
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">2.</span> المدينة
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">3.</span> العنوان بالتفصيل
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">4.</span> رقم الهاتف
              </div>
              <div className="col-span-2 flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">5.</span>
                الثمن{selected ? ` — إن نُقص يُؤخذ ${selected.price} MAD` : ""}
              </div>
              <div className="col-span-2 flex items-center gap-1.5">
                <span className="shrink-0 font-bold text-slate-400">6.</span> الكمية (اختياري - الافتراضي 1)
              </div>
            </div>
            <p className="mt-2 text-right text-[0.74rem] text-slate-500">
              {quickStock
                ? "المنتج يُختار من القائمة — خصم من ستوك QuickLivraison"
                : "المنتج يُختار من القائمة — شحن عادي ومحلي"}
            </p>
          </div>

          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[0.85rem] font-bold text-slate-100">
              {quickStock ? "المنتج (مخزون Quick)" : "المنتج (شحن محلي)"}
            </label>
            <span className="text-[0.74rem] text-slate-400">(اختر المنتج المطلوب)</span>
          </div>

          <div ref={selectRef} className="relative mb-4 select-none">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={selectOpen}
              onClick={() => setSelectOpen((openNow) => !openNow)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-2.5 rounded-[10px] border bg-[#050a14] px-3.5 py-2.5 text-white",
                productError
                  ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)] [animation:quick-product-shake_350ms_ease-in-out]"
                  : selectOpen
                    ? "border-blue-500"
                    : "border-[#1e2d4a]",
              )}
            >
              {selected ? (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2.5">
                  <ProductRow product={selected} />
                </div>
              ) : (
                <span className="text-slate-500">-- اختر المنتج المطلوب --</span>
              )}
              <span className={cn("text-[0.7rem] text-slate-400 transition", selectOpen && "rotate-180")}>▼</span>
            </button>
            {selectOpen ? (
              <div
                role="listbox"
                className="absolute inset-x-0 bottom-[calc(100%+6px)] z-50 flex max-h-[260px] flex-col gap-1 overflow-y-auto rounded-xl border border-[#1e2d4a] bg-[#0d1527] p-1.5 shadow-[0_16px_32px_rgba(0,0,0,0.6)]"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!selected}
                  onClick={() => {
                    setProductSlug("");
                    setProductError(false);
                    setError("");
                    setSelectOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-right text-sm text-slate-400",
                    !selected ? "border border-blue-500/30 bg-blue-500/18" : "hover:bg-blue-500/12",
                  )}
                >
                  -- اختر المنتج المطلوب --
                </button>
                {catalog.map((product) => {
                  const active = product.slug === selected?.slug;
                  return (
                    <button
                      key={product.slug}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setProductSlug(product.slug);
                        setProductError(false);
                        setError("");
                        setSelectOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-right",
                        active ? "border border-blue-500/30 bg-blue-500/18" : "hover:bg-blue-500/12",
                      )}
                    >
                      <ProductRow product={product} />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              className={cn(
                "mb-3 rounded-xl px-3 py-2 text-xs font-bold",
                productError
                  ? "border border-red-500/40 bg-red-500/10 text-red-200"
                  : "border border-amber-500/30 bg-amber-500/10 text-amber-200",
              )}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || !selected}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] bg-emerald-500 py-3 text-[0.95rem] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? "جاري التحليل والإضافة…" : "تحليل وإضافة الطلبية"}
          </button>
        </form>
      </div>
      <style jsx global>{`
        @keyframes quick-product-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
