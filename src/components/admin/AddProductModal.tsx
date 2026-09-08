"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Package, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  fetchAdminProducts,
  generateProductCode,
  type AdminProduct,
} from "@/lib/admin-products";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onNotice?: (message: string, kind?: "ok" | "warn") => void;
  onChanged?: () => void;
};

const detailMap: Record<string, string> = {
  invalid_name: "اسم المنتج قصير جداً.",
  invalid_price: "السعر غير صالح.",
  product_not_found: "المنتج غير موجود.",
};

export function AddProductModal({ open, onClose, onNotice, onChanged }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useLockBodyScroll(open);

  const title = editingId ? "تعديل المنتج" : "إضافة منتج";

  const sorted = useMemo(
    () => [...rows].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name, "ar")),
    [rows],
  );

  function resetForm() {
    setName("");
    setCode("");
    setPrice("");
    setEditingId(null);
    setError("");
  }

  async function loadProducts() {
    setLoading(true);
    try {
      setRows(await fetchAdminProducts());
    } catch {
      setError("تعذر تحميل المنتجات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      resetForm();
      setRows([]);
      return;
    }
    void loadProducts();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function startEdit(product: AdminProduct) {
    setEditingId(product.id);
    setName(product.name);
    setCode(product.code);
    setPrice(product.default_price ? String(product.default_price) : "");
    setError("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("اسم المنتج قصير جداً.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: trimmed,
        code: code.trim(),
        default_price: price === "" ? 0 : Number(price),
      };
      const res = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(detailMap[body.detail || ""] || "تعذر حفظ المنتج.");
      }
      onNotice?.(editingId ? "تم تحديث المنتج بنجاح." : "تم حفظ المنتج بنجاح.", "ok");
      resetForm();
      await loadProducts();
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر حفظ المنتج.";
      setError(message);
      onNotice?.(message, "warn");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: AdminProduct) {
    if (!window.confirm(`إيقاف المنتج «${product.name}»؟`)) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("تعذر حذف المنتج.");
      onNotice?.("تم إيقاف المنتج.", "ok");
      if (editingId === product.id) resetForm();
      await loadProducts();
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر حذف المنتج.";
      setError(message);
      onNotice?.(message, "warn");
    }
  }

  async function restoreProduct(product: AdminProduct) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error("تعذر تفعيل المنتج.");
      onNotice?.("تم تفعيل المنتج.", "ok");
      await loadProducts();
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر تفعيل المنتج.";
      setError(message);
      onNotice?.(message, "warn");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-violet-500/30 bg-white p-5 shadow-2xl dark:bg-cardDark sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-royal dark:text-white">إدارة المنتجات</h3>
              <p className="text-[11px] text-royal/60 dark:text-slate-400">اسم مخصص ورمز SKU يظهر في إضافة الطلب</p>
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

        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">اسم المنتج *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="مثال: الفلاشة التعليمية الذكية"
              className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-violet-400 focus:outline-none dark:bg-brandDark dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">رمز المنتج / SKU *</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                dir="ltr"
                placeholder="FLASH_EDU_01"
                className="min-w-0 flex-1 rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-left font-mono text-royal placeholder-royal/30 transition focus:border-amber-400 focus:outline-none dark:bg-brandDark dark:text-white"
              />
              <button
                type="button"
                onClick={() => setCode(generateProductCode(name))}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-bold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                توليد تلقائي
              </button>
            </div>
            <p className="mt-1 text-[11px] text-royal/50 dark:text-slate-500">اتركه فارغاً ليُولَّد تلقائياً عند الحفظ</p>
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">السعر الافتراضي (اختياري) — MAD</label>
            <input
              type="number"
              min={0}
              step="0.01"
              dir="ltr"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="199"
              className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-left font-mono text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-600 py-3 text-xs font-black text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="ml-1 inline h-3.5 w-3.5 animate-spin" /> جاري الحفظ…
                </>
              ) : (
                <>
                  {editingId ? <Pencil className="ml-1 inline h-3.5 w-3.5" /> : <Plus className="ml-1 inline h-3.5 w-3.5" />}
                  {editingId ? "حفظ التعديلات" : "حفظ المنتج"}
                </>
              )}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gold/20 bg-cream px-4 py-3 text-xs font-bold text-royal/70 dark:bg-brandDark dark:text-slate-400"
              >
                إلغاء التعديل
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-5 border-t border-gold/10 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black text-royal dark:text-white">{title === "تعديل المنتج" ? "المنتجات الحالية" : "المنتجات الحالية"}</p>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" /> : null}
          </div>
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {sorted.length === 0 && !loading ? (
              <p className="rounded-xl bg-cream px-3 py-3 text-xs text-royal/60 dark:bg-brandDark dark:text-slate-400">لا توجد منتجات بعد.</p>
            ) : null}
            {sorted.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                  product.is_active
                    ? "border-gold/15 bg-cream/70 dark:bg-brandDark/70"
                    : "border-dashed border-slate-300/70 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-white/[0.03]",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-royal dark:text-white">{product.name}</p>
                  <span className="mt-0.5 inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-amber-700 dark:text-amber-300">
                    {product.code}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!product.is_active ? (
                    <button type="button" onClick={() => void restoreProduct(product)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/10">
                      تفعيل
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-royal/50 transition hover:bg-violet-500/10 hover:text-violet-500"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeProduct(product)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-royal/50 transition hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
