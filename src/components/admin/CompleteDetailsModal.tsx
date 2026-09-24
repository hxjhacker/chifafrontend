"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers, MessageCircle, Pencil, X } from "lucide-react";
import { dispatchDashboardSound } from "@/components/admin/DashboardSoundEngine";
import { MetaCityCombobox } from "@/components/admin/MetaCityCombobox";
import { isOfficialMetaCity } from "@/lib/meta-livraison-cities";
import { matchOfficialMetaCity } from "@/lib/match-meta-city";
import { copyablePhone, shortOrderRef, type AdminOrder } from "@/lib/admin";
import { regionIdForCity } from "@/lib/admin-geo";
import { IosSwitch } from "@/components/admin/IosSwitch";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onSaved: (order: AdminOrder) => void;
};

const PRIMARY_PRODUCTS = [
  { slug: "quran", label: "USB القرآن (199 درهم)", price: 199 },
  { slug: "taalim", label: "USB التعليمي (199 درهم)", price: 199 },
  { slug: "music", label: "USB الموسيقى (199 درهم)", price: 199 },
  { slug: "zit_alfasokh", label: "زيت الفسوخ (249 درهم)", price: 249 },
  { slug: "alkhatm_alrijali", label: "الخاتم الرجالي (299 درهم)", price: 299 },
  { slug: "almisk_alabyad", label: "المسك الأبيض (199 درهم)", price: 199 },
  { slug: "pack-royal-power", label: "الباك الملكي المتكامل (199 درهم)", price: 199 },
] as const;

const SECONDARY_PRODUCTS = [
  { slug: "extra", label: "مفتاح إضافي بسعر العرض (+100 درهم)", price: 100 },
  { slug: "quran", label: "USB القرآن (+199 درهم)", price: 199 },
  { slug: "taalim", label: "USB التعليمي (+199 درهم)", price: 199 },
  { slug: "music", label: "USB الموسيقى (+199 درهم)", price: 199 },
] as const;

const fieldClass =
  "w-full rounded-xl border border-[#1e293b] bg-[#060b14] px-3.5 py-2.5 font-bold text-white transition placeholder:font-normal placeholder:text-slate-600 focus:border-[#0284c7] focus:outline-none";

export function CompleteDetailsModal({ open, order, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [address, setAddress] = useState("");
  const [primarySlug, setPrimarySlug] = useState("quran");
  const [primaryQty, setPrimaryQty] = useState(1);
  const [bundleOn, setBundleOn] = useState(false);
  const [secondarySlug, setSecondarySlug] = useState("extra");
  const [secondaryQty, setSecondaryQty] = useState(1);
  const [price, setPrice] = useState(199);
  const [priceDirty, setPriceDirty] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useLockBodyScroll(open);

  const primary = PRIMARY_PRODUCTS.find((p) => p.slug === primarySlug) || PRIMARY_PRODUCTS[0];
  const secondary = SECONDARY_PRODUCTS.find((p) => p.slug === secondarySlug) || SECONDARY_PRODUCTS[0];

  const computedTotal = useMemo(() => {
    let total = primary.price * Math.max(1, primaryQty);
    if (bundleOn) total += secondary.price * Math.max(1, secondaryQty);
    return total;
  }, [primary.price, primaryQty, bundleOn, secondary.price, secondaryQty]);

  useEffect(() => {
    if (!priceDirty) setPrice(computedTotal);
  }, [computedTotal, priceDirty]);

  useEffect(() => {
    if (!open || !order) return;
    setError("");
    setName(order.full_name);
    setCity(order.city);
    const saved = (order.shipping_city || "").trim();
    setShippingCity(isOfficialMetaCity(saved) ? saved : matchOfficialMetaCity(order.city));
    setAddress(order.address || order.full_address || "");
    setNotes(order.courier_notes || order.driver_comment || "");
    setPrimarySlug(
      PRIMARY_PRODUCTS.some((p) => p.slug === (order.product_slug || order.primary_product))
        ? order.product_slug || order.primary_product
        : "quran",
    );
    setPrimaryQty(Math.max(1, order.tier_qty || order.primary_qty || 1));
    const hasBundle = Boolean(order.bundle_enabled || order.cross_sell_slug || order.secondary_product);
    setBundleOn(hasBundle);
    const secondary = order.cross_sell_slug || order.secondary_product || "extra";
    setSecondarySlug(SECONDARY_PRODUCTS.some((p) => p.slug === secondary) ? secondary : "extra");
    setSecondaryQty(Math.max(1, order.secondary_qty || 1));
    setPrice(Math.round(order.total ?? order.total_price) || 199);
    setPriceDirty(true);
  }, [open, order]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    if (!isOfficialMetaCity(shippingCity)) {
      setError("اختَر مدينة التوصيل الرسمية من قائمة Meta Livraison.");
      return;
    }
    const regionId = regionIdForCity(shippingCity);
    setError("");
    setSaving(true);
    try {
      const orderId = encodeURIComponent(String(order.order_id || "").trim());
      const qty = Math.round(Math.max(1, Number(primaryQty) || 1));
      const extraQty = Math.round(Math.max(1, Number(secondaryQty) || 1));
      const total = Math.round(Number(price)) || 0;
      const nextStatus = order.status === "new" || order.status === "cancelled" ? "confirmed" : order.status;
      const fullPayload = {
        full_name: name.trim(),
        customer_name: name.trim(),
        city: city.trim(),
        shipping_city: shippingCity.trim(),
        region_id: regionId,
        region: regionId,
        address: address.trim(),
        full_address: address.trim(),
        product_slug: primary.slug,
        primary_product: primary.slug,
        tier_qty: qty,
        primary_qty: qty,
        bundle_enabled: bundleOn,
        cross_sell_slug: bundleOn ? secondary.slug : null,
        secondary_product: bundleOn ? secondary.slug : null,
        secondary_qty: bundleOn ? extraQty : 1,
        cross_sell_price_mad: bundleOn ? secondary.price * extraQty : 0,
        courier_notes: notes,
        driver_comment: notes,
        total_mad: total,
        total_price: total,
        status: nextStatus,
      };
      const minimalPayload = {
        full_name: name.trim(),
        city: city.trim(),
        shipping_city: shippingCity.trim(),
        region_id: regionId,
        region: regionId,
        address: address.trim(),
        product_slug: primary.slug,
        tier_qty: qty,
        total_mad: total,
        status: nextStatus,
      };

      async function send(body: Record<string, unknown>) {
        return fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      let res = await send(fullPayload);
      if (!res.ok) res = await send(minimalPayload);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: unknown; error?: unknown; message?: unknown };
        const detail = body.detail ?? body.error ?? body.message;
        const raw = Array.isArray(detail)
          ? String((detail[0] as { msg?: string; type?: string } | undefined)?.msg || (detail[0] as { type?: string } | undefined)?.type || "")
          : typeof detail === "string"
            ? detail
            : "";
        const map: Record<string, string> = {
          invalid_name: "الاسم قصير جداً.",
          invalid_price: "المبلغ غير صالح.",
          invalid_qty: "الكمية غير صالحة.",
          invalid_status: "حالة الطلب غير صالحة.",
          invalid_status_transition: "لا يمكن القفز في حالة الطلب.",
          confirmation_details_required: "لازم تكمل العنوان قبل التأكيد.",
          invalid_ma_phone: "رقم الهاتف غير صالح.",
          order_not_found: "الطلبية غير موجودة.",
          update_failed: "تعذر حفظ وتأكيد المعلومات.",
        };
        const hint = raw && !map[raw] ? ` (${res.status}: ${raw.slice(0, 80)})` : "";
        throw new Error((map[raw] || "تعذر حفظ وتأكيد المعلومات.") + hint);
      }
      onSaved((await res.json()) as AdminOrder);
      dispatchDashboardSound("success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ وتأكيد المعلومات.");
    } finally {
      setSaving(false);
    }
  }

  const phone = order ? copyablePhone(order) : "";

  return (
    <div
      id="order-confirm-modal"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm transition-all duration-300 sm:p-4",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        className={cn(
          "custom-scrollbar relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#1e293b] bg-[#0b1322] p-5 text-white shadow-2xl transition-all duration-300 sm:p-6",
          open ? "scale-100" : "scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#1e293b]/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0284c7]/30 bg-[#0369a1]/20 text-[#0284c7]">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">إتمام وتأكيد المعلومات</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {order ? (
                  <>
                    {shortOrderRef(order.order_id)} · {order.full_name} ·{" "}
                    <span dir="ltr" className="font-mono">
                      {phone}
                    </span>
                  </>
                ) : (
                  "عنوان التوصيل وملاحظات الموزع"
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#1e293b] bg-[#0f172a] text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-right font-bold text-slate-300">اسم الزبون الكامل *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} className={fieldClass} />
          </div>

          <div>
            <label className="mb-1 block text-right font-bold text-slate-400">المدينة كما كتبها الزبون</label>
            <div className="rounded-xl border border-[#1e293b] bg-[#060b14] px-3.5 py-2.5 font-bold text-slate-300">
              {city || "—"}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-right font-bold text-slate-300">مدينة التوصيل الرسمية *</label>
            <MetaCityCombobox value={shippingCity} onChange={setShippingCity} placeholder="بحث: FES, Casablanca, Imouzzer Kandar…" />
          </div>

          <div>
            <label className="mb-1 block text-right font-bold text-slate-300">العنوان الكامل *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={2}
              placeholder="الحي، الشارع، رقم المنزل…"
              className={`${fieldClass} resize-none p-3 font-normal`}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-[#1e293b]/70 bg-[#060b14] p-3.5">
            <span className="block text-[11px] font-bold text-[#38bdf8]">المنتج الأساسي للطلبية</span>
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <select
                  value={primarySlug}
                  onChange={(e) => {
                    setPrimarySlug(e.target.value);
                    setPriceDirty(false);
                  }}
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b1322] px-3 py-2 font-bold text-white focus:border-[#0284c7] focus:outline-none"
                >
                  {PRIMARY_PRODUCTS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-4">
                <span className="whitespace-nowrap font-bold text-slate-400">الكمية:</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={primaryQty}
                  onChange={(e) => {
                    setPrimaryQty(Number(e.target.value) || 1);
                    setPriceDirty(false);
                  }}
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b1322] px-3 py-2 text-center font-mono font-bold text-white focus:border-[#0284c7] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#1e293b] bg-[#060b14] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold text-slate-200">ازدواجية المنتج / إضافة منتج آخر (Upsell)</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bundleOn}
                onClick={() => {
                  setBundleOn((v) => !v);
                  setPriceDirty(false);
                }}
              >
                <IosSwitch checked={bundleOn} className={bundleOn ? undefined : "border border-white/10 bg-slate-800"} />
              </button>
            </div>

            {bundleOn ? (
              <div className="space-y-3 border-t border-[#1e293b] pt-3">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-8">
                    <label className="mb-1 block font-semibold text-slate-400">المنتج الإضافي:</label>
                    <select
                      value={secondarySlug}
                      onChange={(e) => {
                        setSecondarySlug(e.target.value);
                        setPriceDirty(false);
                      }}
                      className="w-full rounded-xl border border-[#1e293b] bg-[#0b1322] px-3 py-2 font-bold text-white focus:border-[#0284c7] focus:outline-none"
                    >
                      {SECONDARY_PRODUCTS.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="mb-1 block font-semibold text-slate-400">الكمية الإضافية:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={secondaryQty}
                      onChange={(e) => {
                        setSecondaryQty(Number(e.target.value) || 1);
                        setPriceDirty(false);
                      }}
                      className="w-full rounded-xl border border-[#1e293b] bg-[#0b1322] px-3 py-2 text-center font-mono font-bold text-white focus:border-[#0284c7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#1e293b] bg-[#060b14] p-3.5">
            <label className="font-bold text-slate-300">المبلغ النهائي للتحصيل عند التسليم:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                dir="ltr"
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value));
                  setPriceDirty(true);
                }}
                className="w-24 rounded-xl border border-[#0284c7] bg-[#0b1322] px-3 py-2 text-left font-mono text-sm font-black text-emerald-400 focus:outline-none"
              />
              <span className="font-bold text-slate-400">درهم</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-right font-bold text-slate-300">
              <MessageCircle className="ml-1 inline h-3.5 w-3.5 text-[#38bdf8]" />
              ملاحظات خاصة بالطلبية / تعليمات للموزّع
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: الزبون يطلب الاتصال قبل الوصول بنصف ساعة / التسليم بعد الساعة 5 مساءً..."
              className={`${fieldClass} resize-none p-3 font-normal`}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-bold text-red-200">{error}</p>
          ) : null}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-24 rounded-xl border border-[#1e293b] bg-[#0f172a] py-3 font-bold text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || !order}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0284c7] py-3 text-xs font-black text-white shadow-lg shadow-[#0284c7]/25 transition hover:bg-[#0369a1] active:scale-95 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "جاري الحفظ…" : "حفظ وتأكيد الطلبية (Confirmed 🔵)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
