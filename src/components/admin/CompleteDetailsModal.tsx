"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Pencil, X } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { copyablePhone, type AdminOrder, type DeliveryWindow } from "@/lib/admin";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onSaved: (order: AdminOrder) => void;
};

const WINDOWS: { id: DeliveryWindow; label: string }[] = [
  { id: "anytime", label: "أي وقت" },
  { id: "morning", label: "صباحاً" },
  { id: "afternoon", label: "بعد الزوال" },
  { id: "weekend", label: "نهاية الأسبوع" },
];

export function CompleteDetailsModal({ open, order, onClose, onSaved }: Props) {
  const [quartier, setQuartier] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [windowId, setWindowId] = useState<DeliveryWindow>("anytime");
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !order) return;
    setError("");
    setQuartier(order.quartier || "");
    setStreet(order.street || "");
    setBuilding(order.building || "");
    setLandmark(order.landmark || "");
    setCity(order.city || "");
    setWindowId(order.delivery_window || "anytime");
    setPrice(Math.round(order.total));
    setNotes(order.courier_notes || "");
  }, [open, order]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.order_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          quartier,
          street,
          building,
          landmark,
          delivery_window: windowId,
          courier_notes: notes,
          total_mad: Number(price),
          status: "confirmed",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_price: "المبلغ غير صالح.",
          invalid_delivery_window: "وقت التوصيل غير صالح.",
        };
        throw new Error(map[body.detail || ""] || "تعذر حفظ وتأكيد المعلومات.");
      }
      onSaved((await res.json()) as AdminOrder);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ وتأكيد المعلومات.");
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
        className={cn(
          "relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-gold/40 bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-cardDark",
          open ? "scale-100" : "scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-royal dark:text-white">إتمام وتأكيد المعلومات</h3>
              <p className="text-[11px] text-royal/60 dark:text-slate-400">
                {order ? `${order.full_name} · ${copyablePhone(order)}` : "عنوان التوصيل وملاحظات الموزع"}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">الحي / الحي السكني</label>
              <input
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                placeholder="مثال: حي الرياض"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">الشارع</label>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="اسم الشارع"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">العمارة / الشقة</label>
              <input
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="رقم العمارة أو الشقة"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">المدينة</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                list="complete-cities"
                className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
              />
              <datalist id="complete-cities">
                {CITIES.map((c) => (
                  <option key={c.ar} value={c.ar}>
                    {c.fr}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">علامة مميزة / معلم قريب</label>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="قرب المسجد، السوق، محطة…"
              className="w-full rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">وقت التوصيل المفضل</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WINDOWS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWindowId(w.id)}
                  className={cn(
                    "rounded-xl border px-2 py-2 font-bold transition",
                    windowId === w.id
                      ? "border-sky-400 bg-sky-500/15 text-sky-600 dark:text-sky-300"
                      : "border-gold/20 bg-cream text-royal/70 dark:bg-brandDark dark:text-slate-300",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">تعديل السعر / عرض إضافي (درهم)</label>
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

          <div>
            <label className="mb-1 block font-bold text-royal/80 dark:text-slate-200">ملاحظات للمُوزّع</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes pour le livreur"
              className="w-full resize-none rounded-xl border border-gold/20 bg-cream px-3.5 py-2.5 text-royal placeholder-royal/30 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !order}
              className="flex-1 rounded-xl bg-sky-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
            >
              <CheckCircle2 className="ml-1 inline h-3.5 w-3.5" />
              {saving ? "جاري الحفظ…" : "حفظ وتأكيد الطلبية"}
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
