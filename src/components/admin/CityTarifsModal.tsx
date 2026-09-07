"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, Loader2, Search, X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export type CityTarifLookup = {
  id: number;
  city_name: string;
  hub_name: string;
  delivery_fee: number;
  refusal_fee: number;
  return_fee: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function madLabel(value: number) {
  const amount = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  const shown = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const abs = Math.abs(Math.round(amount));
  const word = abs >= 3 && abs <= 10 ? "دراهم" : "درهم";
  return `${shown} ${word}`;
}

function parseRows(payload: unknown): CityTarifLookup[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { tarifs?: unknown }).tarifs)
      ? (payload as { tarifs: unknown[] }).tarifs
      : [];
  return list
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const name = String(item.city_name || "").trim();
      if (!name) return null;
      return {
        id: Number(item.id) || 0,
        city_name: name,
        hub_name: String(item.hub_name || "").trim(),
        delivery_fee: Number(item.delivery_fee) || 0,
        refusal_fee: Number(item.refusal_fee) || 0,
        return_fee: Number(item.return_fee) || 0,
      };
    })
    .filter((row): row is CityTarifLookup => Boolean(row));
}

export function CityTarifsModal({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CityTarifLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) {
      setQ("");
      setRows([]);
      setError("");
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const needle = q.trim();
        if (needle) params.set("search", needle);
        params.set("limit", needle ? "200" : "50");
        const res = await fetch(`/api/admin/tarifs?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(String((body as { detail?: string; message?: string }).message || (body as { detail?: string }).detail || "tarifs_failed"));
        }
        setRows(parseRows(body));
        setError("");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
        setError("تعذر تحميل جدول الأسعار.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-tarifs-title"
      onClick={onClose}
    >
      <div
        className="relative my-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-2 border-gold/40 bg-white shadow-2xl dark:bg-cardDark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 id="city-tarifs-title" className="text-sm font-black text-royal dark:text-white sm:text-base">
                جدول تسعيرة الشحن للمدن
              </h3>
              <p className="text-[11px] font-bold text-royal/55 dark:text-slate-400">أسعار التوصيل والرفض والإرجاع حسب المدينة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-royal/50 transition hover:text-rose-500 dark:bg-brandDark dark:text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم المدينة بالعربية أو اللاتينية…"
              className="w-full rounded-2xl border border-gold/25 bg-cream py-2.5 pr-10 pl-4 text-sm font-bold text-royal placeholder-royal/35 outline-none transition focus:border-gold dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}
          {loading && !rows.length ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-royal/60 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              جاري التحميل…
            </div>
          ) : !rows.length ? (
            <p className="py-16 text-center text-sm font-bold text-royal/55 dark:text-slate-400">لم يتم العثور على مدينة بهذا الاسم</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gold/20">
              <table className="w-full min-w-[640px] border-collapse text-right text-sm">
                <thead className="sticky top-0 bg-cream/95 text-[11px] font-black tracking-wide text-royal/70 dark:bg-[#0F1E33] dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2.5">المدينة</th>
                    <th className="px-3 py-2.5">مركز التوزيع (HUB)</th>
                    <th className="px-3 py-2.5">تكلفة التوصيل</th>
                    <th className="px-3 py-2.5">رسوم الرفض</th>
                    <th className="px-3 py-2.5">رسوم الإرجاع</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.id}-${row.city_name}`}
                      className="border-t border-gold/10 bg-white text-royal transition hover:bg-gold/5 dark:bg-cardDark dark:text-slate-100"
                    >
                      <td className="px-3 py-2.5 font-black">{row.city_name}</td>
                      <td className="px-3 py-2.5 font-bold text-gold-600 dark:text-gold">{row.hub_name || "—"}</td>
                      <td className="px-3 py-2.5 font-black tabular-nums">{madLabel(row.delivery_fee)}</td>
                      <td className="px-3 py-2.5 font-bold tabular-nums text-amber-700 dark:text-amber-300">{madLabel(row.refusal_fee)}</td>
                      <td className="px-3 py-2.5 font-bold tabular-nums text-royal/70 dark:text-slate-300">{madLabel(row.return_fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {loading && rows.length ? (
          <div className="absolute left-5 top-[5.5rem]">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
