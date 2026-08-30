"use client";

import { FormEvent, useState } from "react";
import { Plus, ShoppingCart, X } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { MANUAL_PRODUCTS } from "@/lib/admin-geo";
import type { AdminOrder, AdminStatus } from "@/lib/admin";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (order: AdminOrder) => void;
};

const INITIAL_STATUSES: { id: AdminStatus; label: string }[] = [
  { id: "confirmed", label: "🔵 تم التأكيد (Confirmed)" },
  { id: "new", label: "🟡 جديدة (New)" },
  { id: "shipped", label: "🟣 قيد الشحن (Shipped)" },
];

export function AddOrderModal({ open, onClose, onCreated }: Props) {
  const [productId, setProductId] = useState<(typeof MANUAL_PRODUCTS)[number]["id"]>("quran");
  const [price, setPrice] = useState(199);
  const [status, setStatus] = useState<AdminStatus>("confirmed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const product = MANUAL_PRODUCTS.find((p) => p.id === productId) || MANUAL_PRODUCTS[0];

  function changeProduct(id: (typeof MANUAL_PRODUCTS)[number]["id"]) {
    const next = MANUAL_PRODUCTS.find((p) => p.id === id) || MANUAL_PRODUCTS[0];
    setProductId(next.id);
    setPrice(next.price);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(data.get("full_name") || ""),
          phone: String(data.get("phone") || ""),
          city: String(data.get("city") || ""),
          product_slug: product.slug,
          tier_qty: product.qty,
          total_mad: Number(price),
          status,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_name: "الاسم قصير جداً.",
          invalid_ma_phone: "رقم الهاتف المغربي غير صالح.",
          invalid_price: "المبلغ غير صالح.",
          invalid_status: "حالة الطلب غير صالحة.",
        };
        throw new Error(map[payload.detail || ""] || "تعذر حفظ الطلب.");
      }
      const order = (await res.json()) as AdminOrder;
      onCreated(order);
      form.reset();
      setProductId("quran");
      setPrice(199);
      setStatus("confirmed");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الطلب.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        id="modal-container"
        className={cn(
          "relative w-full max-w-lg rounded-3xl border-2 border-gold/40 bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-cardDark",
          open ? "scale-100" : "scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-sm text-gold">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-royal dark:text-white">إضافة طلبية جديدة (واتساب / هاتف)</h3>
              <p className="text-[11px] text-royal/60 dark:text-slate-400">إدخال طلب يدوي وتحديث الجدول والإحصائيات مباشرة</p>
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

        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">الاسم والنسب الكامل *</label>
            <input
              name="full_name"
              required
              minLength={3}
              placeholder="مثال: عبد الرحيم التازي"
              className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">رقم الهاتف *</label>
              <input
                name="phone"
                type="tel"
                required
                dir="ltr"
                placeholder="06XXXXXXXX"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-left font-mono text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المدينة *</label>
              <input
                name="city"
                required
                list="admin-cities"
                placeholder="مثال: الدار البيضاء"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
              <datalist id="admin-cities">
                {CITIES.map((c) => (
                  <option key={c.ar} value={c.ar}>
                    {c.fr}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المنتج المختارة *</label>
              <select
                value={productId}
                onChange={(e) => changeProduct(e.target.value as (typeof MANUAL_PRODUCTS)[number]["id"])}
                className="w-full rounded-xl border border-gold/20 bg-cream px-3 py-2.5 font-bold text-royal transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
              >
                {MANUAL_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المبلغ (درهم) *</label>
              <input
                type="number"
                required
                min={1}
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-left font-mono font-bold text-royal transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">حالة الطلبية الأولية</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminStatus)}
              className="w-full rounded-xl border border-gold/20 bg-cream px-3 py-2.5 font-bold text-royal transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
            >
              {INITIAL_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-royal py-3 text-xs font-black text-gold shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-60 dark:bg-gold dark:text-brandDark"
            >
              <Plus className="ml-1 inline h-3.5 w-3.5" /> {saving ? "جاري الحفظ…" : "حفظ وإضافة الطلب"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gold/20 bg-cream px-4 py-3 text-xs font-bold text-royal/70 transition hover:text-rose-500 dark:bg-brandDark dark:text-slate-400"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
