"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, ShoppingCart, X } from "lucide-react";
import { MetaCityCombobox } from "@/components/admin/MetaCityCombobox";
import { isOfficialMetaCity } from "@/lib/meta-livraison-cities";
import { matchOfficialMetaCity } from "@/lib/match-meta-city";
import { MANUAL_PRODUCTS } from "@/lib/admin-geo";
import { allowedNextStatuses, canTransitionStatus, copyablePhone, needsConfirmModal, type AdminOrder, type AdminStatus } from "@/lib/admin";
import { digitsOnly, isTenDigitMaPhone } from "@/lib/phone";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

type ProductId = (typeof MANUAL_PRODUCTS)[number]["id"] | string;

type Props = {
  open: boolean;
  editing?: AdminOrder | null;
  onClose: () => void;
  onCreated: (order: AdminOrder) => void;
  onUpdated?: (order: AdminOrder) => void;
};

const ALL_STATUSES: { id: AdminStatus; label: string }[] = [
  { id: "confirmed", label: "🔵 تم التأكيد (Confirmed)" },
  { id: "new", label: "🟡 جديدة (New)" },
  { id: "shipped", label: "🟣 قيد الشحن (Shipped)" },
  { id: "delivered", label: "🟢 تم التسليم (Delivered)" },
  { id: "cancelled", label: "🔴 ملغاة (Cancelled)" },
];

function productFromOrder(order: AdminOrder | null | undefined) {
  if (!order) return MANUAL_PRODUCTS[0];
  if (order.tier_qty >= 2) return MANUAL_PRODUCTS.find((p) => p.id === "bundle") || MANUAL_PRODUCTS[0];
  return MANUAL_PRODUCTS.find((p) => p.slug === order.product_slug) || MANUAL_PRODUCTS[0];
}

function nationalTenDigits(raw: string) {
  let digits = digitsOnly(raw);
  if (digits.startsWith("00212")) digits = digits.slice(2);
  if (digits.startsWith("212") && digits.length >= 12) digits = `0${digits.slice(3)}`;
  return digits;
}

export function AddOrderModal({ open, editing, onClose, onCreated, onUpdated }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [productId, setProductId] = useState<ProductId>("quran");
  const [price, setPrice] = useState(199);
  const [status, setStatus] = useState<AdminStatus>("confirmed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  useLockBodyScroll(open);

  const isEdit = Boolean(editing);
  const product = MANUAL_PRODUCTS.find((p) => p.id === productId) || productFromOrder(editing);
  const phoneDigits = digitsOnly(phone);
  const phoneLengthError = phoneTouched && phoneDigits.length !== 10;
  const phoneError = phoneLengthError
    ? "رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط"
    : phoneTouched && phoneDigits.length === 10 && !isTenDigitMaPhone(phone)
      ? "رقم الهاتف المغربي غير صالح."
      : "";

  useEffect(() => {
    if (!open) return;
    setError("");
    setPhoneTouched(false);
    if (editing) {
      const matched = productFromOrder(editing);
      setName(editing.full_name);
      setPhone(nationalTenDigits(copyablePhone(editing)));
      setCity(editing.city);
      const saved = (editing.shipping_city || "").trim();
      setShippingCity(isOfficialMetaCity(saved) ? saved : matchOfficialMetaCity(editing.city));
      setProductId(matched.id);
      setPrice(Math.round(editing.total));
      setStatus(editing.status);
    } else {
      setName("");
      setPhone("");
      setCity("");
      setShippingCity("");
      setProductId("quran");
      setPrice(199);
      setStatus("confirmed");
    }
  }, [open, editing]);

  function changeProduct(id: ProductId) {
    const next = MANUAL_PRODUCTS.find((p) => p.id === id) || MANUAL_PRODUCTS[0];
    setProductId(next.id);
    setPrice(next.price);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneTouched(true);
    if (phoneDigits.length !== 10) {
      setError("رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط");
      return;
    }
    if (!isTenDigitMaPhone(phone)) {
      setError("رقم الهاتف المغربي غير صالح.");
      return;
    }
    if (!isOfficialMetaCity(shippingCity)) {
      setError("اختَر مدينة التوصيل الرسمية من قائمة Meta Livraison.");
      return;
    }
    if (isEdit && !canTransitionStatus(editing!.status, status)) {
      setError("لا يمكن القفز في حالة الطلب. اتبع المسار بالترتيب.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        full_name: name,
        phone,
        city,
        shipping_city: shippingCity,
        product_slug: product.slug,
        tier_qty: product.qty,
        total_mad: Number(price),
        status,
      };
      const res = await fetch(isEdit ? `/api/admin/orders/${editing!.order_id}` : "/api/admin/orders", {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_name: "الاسم قصير جداً.",
          invalid_ma_phone: "رقم الهاتف المغربي غير صالح.",
          invalid_price: "المبلغ غير صالح.",
          invalid_status: "حالة الطلب غير صالحة.",
          invalid_status_transition: "لا يمكن القفز في حالة الطلب.",
          confirmation_details_required: "لازم تكمل معلومات التوصيل قبل التأكيد.",
          invalid_city: "المدينة غير صالحة.",
        };
        throw new Error(map[body.detail || ""] || (isEdit ? "تعذر تعديل الطلب." : "تعذر حفظ الطلب."));
      }
      const order = (await res.json()) as AdminOrder;
      if (isEdit) onUpdated?.(order);
      else onCreated(order);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الطلب.");
    } finally {
      setSaving(false);
    }
  }

  const statuses = isEdit
    ? ALL_STATUSES.filter((s) => {
        if (s.id === editing!.status) return true;
        if (!allowedNextStatuses(editing!.status).includes(s.id)) return false;
        if (needsConfirmModal(editing!, s.id)) return false;
        return true;
      })
    : ALL_STATUSES.filter((s) => s.id === "new" || s.id === "confirmed");

  return (
    <div
      id="add-order-modal"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm transition-all duration-300 sm:p-4",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative my-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-gold/40 bg-white p-5 shadow-2xl transition-all duration-300 dark:bg-cardDark sm:p-6",
          open ? "scale-100" : "scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-sm text-gold">
              {isEdit ? <Pencil className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-royal dark:text-white">إضافة طلبية جديدة</h3>
              <p className="text-[11px] text-royal/60 dark:text-slate-400">
                {isEdit ? "تحديث بيانات الزبون والمنتج والحالة" : "إدخال طلب يدوي وتحديث الجدول والإحصائيات مباشرة"}
              </p>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              placeholder="مثال: عبد الرحيم التازي"
              className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">رقم الهاتف *</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => {
                  setPhone(nationalTenDigits(e.target.value));
                  setPhoneTouched(true);
                }}
                onBlur={() => setPhoneTouched(true)}
                required
                maxLength={15}
                dir="ltr"
                placeholder="06XXXXXXXX"
                aria-invalid={Boolean(phoneError)}
                className={cn(
                  "w-full rounded-xl border bg-cream px-3.5 py-2.5 text-left font-mono text-royal placeholder-royal/30 transition focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500",
                  phoneError ? "border-rose-400 focus:border-rose-500" : "border-gold/20 focus:border-gold",
                )}
              />
              {phoneError ? <p className="mt-1 font-bold text-rose-500">{phoneError}</p> : null}
            </div>
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المدينة كما كتبها الزبون *</label>
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (!isOfficialMetaCity(shippingCity)) setShippingCity(matchOfficialMetaCity(e.target.value));
                }}
                required
                placeholder="مثال: الدار البيضاء"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">مدينة التوصيل Meta Livraison *</label>
            <MetaCityCombobox
              value={shippingCity}
              onChange={setShippingCity}
              tone="light"
              placeholder="Imouzzer-Kandar - FES, RABAT, Casablanca…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المنتج المختارة *</label>
              <select
                value={product.id}
                onChange={(e) => changeProduct(e.target.value)}
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
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">
              {isEdit ? "حالة الطلبية" : "حالة الطلبية الأولية"}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminStatus)}
              className="w-full rounded-xl border border-gold/20 bg-cream px-3 py-2.5 font-bold text-royal transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
            >
              {statuses.map((s) => (
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
              {isEdit ? (
                <>
                  <Pencil className="ml-1 inline h-3.5 w-3.5" /> {saving ? "جاري الحفظ…" : "حفظ التعديلات"}
                </>
              ) : (
                <>
                  <Plus className="ml-1 inline h-3.5 w-3.5" /> {saving ? "جاري الحفظ…" : "حفظ وإضافة الطلب"}
                </>
              )}
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
