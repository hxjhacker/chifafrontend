"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, Loader2, Pencil, Save, Search, X } from "lucide-react";
import { DashboardBanner, notifyDashboard } from "@/components/admin/DashboardAlert";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export type CityTarifLookup = {
  id: number;
  pricing_city_id?: string | null;
  meta_city_id?: string | null;
  city_name: string;
  city_name_ar?: string;
  hub_name: string;
  region?: string;
  region_id?: string | null;
  delivery_fee: number;
  refusal_fee: number;
  return_fee: number;
  quick_delivery_price?: number | null;
  meta_delivery_fee?: number | null;
  competitor_delivery_price?: number | null;
  quick_covered?: boolean;
  meta_covered?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

type EditDraft = {
  quick_delivery_price: string;
  meta_delivery_fee: string;
};

function madLabel(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const amount = Math.round(value * 100) / 100;
  const shown = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const abs = Math.abs(Math.round(amount));
  const word = abs >= 3 && abs <= 10 ? "دراهم" : "درهم";
  return `${shown} ${word}`;
}

function coverageBadge(covered: boolean | undefined) {
  if (covered) {
    return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300";
  }
  return "bg-slate-400/10 text-slate-500 border-slate-400/20 dark:text-slate-400";
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
      const quickRaw = item.quick_delivery_price;
      const metaRaw = item.meta_delivery_fee ?? item.competitor_delivery_price ?? item.delivery_fee;
      const quickCovered = item.quick_covered == null ? quickRaw != null && Number(quickRaw) >= 0 : Boolean(item.quick_covered);
      const metaCovered = item.meta_covered == null ? metaRaw != null : Boolean(item.meta_covered);
      return {
        id: Number(item.id) || 0,
        pricing_city_id: item.pricing_city_id ? String(item.pricing_city_id) : null,
        meta_city_id: item.meta_city_id ? String(item.meta_city_id) : null,
        city_name: name,
        city_name_ar: String(item.city_name_ar || "").trim(),
        hub_name: String(item.hub_name || item.region || "").trim(),
        region: String(item.region || "").trim(),
        region_id: item.region_id ? String(item.region_id) : null,
        delivery_fee: Number(item.delivery_fee) || 0,
        refusal_fee: Number(item.refusal_fee) || 0,
        return_fee: Number(item.return_fee) || 0,
        quick_delivery_price: quickRaw == null || quickRaw === "" ? null : Number(quickRaw),
        meta_delivery_fee: metaRaw == null || metaRaw === "" ? null : Number(metaRaw),
        competitor_delivery_price: item.competitor_delivery_price == null ? null : Number(item.competitor_delivery_price),
        quick_covered: quickCovered,
        meta_covered: metaCovered,
      };
    })
    .filter((row): row is CityTarifLookup => Boolean(row));
}

export function CityTarifsModal({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CityTarifLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) {
      setQ("");
      setRows([]);
      setError("");
      setLoading(false);
      setEditingKey(null);
      setDraft(null);
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
        params.set("limit", "800");
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
        const msg = "تعذر تحميل جدول الأسعار.";
        setError(msg);
        notifyDashboard(msg, "error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, q]);

  function rowKey(row: CityTarifLookup) {
    return row.pricing_city_id || row.meta_city_id || `${row.id}-${row.city_name}`;
  }

  function startEdit(row: CityTarifLookup) {
    setEditingKey(rowKey(row));
    setDraft({
      quick_delivery_price: row.quick_delivery_price == null ? "" : String(row.quick_delivery_price),
      meta_delivery_fee: row.meta_delivery_fee == null ? "" : String(row.meta_delivery_fee),
    });
  }

  async function saveEdit(row: CityTarifLookup) {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { city_name: row.city_name };
      if (row.pricing_city_id) body.pricing_city_id = row.pricing_city_id;
      if (row.meta_city_id) body.meta_city_id = row.meta_city_id;
      if (draft.quick_delivery_price.trim() !== "") body.quick_delivery_price = Number(draft.quick_delivery_price);
      if (draft.meta_delivery_fee.trim() !== "") body.meta_delivery_fee = Number(draft.meta_delivery_fee);
      const res = await fetch("/api/admin/tarifs", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = (await res.json().catch(() => ({}))) as Record<string, unknown> & { detail?: string };
      if (!res.ok) throw new Error(updated.detail || "update_failed");
      const next = parseRows([updated])[0];
      if (next) {
        setRows((list) => list.map((item) => (rowKey(item) === rowKey(row) ? { ...item, ...next } : item)));
      }
      setEditingKey(null);
      setDraft(null);
      notifyDashboard("تم حفظ تعريفة المدينة", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ التعديل";
      setError(msg);
      notifyDashboard(msg, "error");
    } finally {
      setSaving(false);
    }
  }

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
        className="relative my-auto flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-2 border-gold/40 bg-white shadow-2xl dark:bg-cardDark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 id="city-tarifs-title" className="text-sm font-black text-royal dark:text-white sm:text-base">
                مقارنة أسعار المدن
              </h3>
              <p className="text-[11px] font-bold text-royal/55 dark:text-slate-400">
                سعر كويك مقابل سعر ميتا حسب المدينة والجهة — يمكن تعديل التعريفة مباشرة
              </p>
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
            <DashboardBanner tone="error" className="mb-3" title={error} onClose={() => setError("")} />
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
              <table className="w-full min-w-[920px] border-collapse text-right text-sm">
                <thead className="sticky top-0 bg-cream/95 text-[11px] font-black tracking-wide text-royal/70 dark:bg-[#0F1E33] dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2.5">اسم المدينة</th>
                    <th className="px-3 py-2.5">الجهة</th>
                    <th className="px-3 py-2.5">سعر كويك</th>
                    <th className="px-3 py-2.5">سعر ميتا</th>
                    <th className="px-3 py-2.5">تغطية كويك</th>
                    <th className="px-3 py-2.5">تغطية ميتا</th>
                    <th className="px-3 py-2.5">تعديل</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const key = rowKey(row);
                    const editing = editingKey === key;
                    return (
                      <tr
                        key={key}
                        className="border-t border-gold/10 bg-white text-royal transition hover:bg-gold/5 dark:bg-cardDark dark:text-slate-100"
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-black">{row.city_name}</div>
                          {row.city_name_ar ? <div className="text-[11px] font-bold text-royal/45 dark:text-slate-400">{row.city_name_ar}</div> : null}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-gold-600 dark:text-gold">{row.region || row.hub_name || "—"}</td>
                        <td className="px-3 py-2.5 font-black tabular-nums text-sky-700 dark:text-sky-300">
                          {editing && draft ? (
                            <input
                              type="number"
                              min={0}
                              value={draft.quick_delivery_price}
                              onChange={(e) => setDraft({ ...draft, quick_delivery_price: e.target.value })}
                              className="h-8 w-24 rounded-lg border border-gold/30 bg-cream px-2 text-xs font-black dark:bg-brandDark"
                            />
                          ) : row.quick_covered ? (
                            madLabel(row.quick_delivery_price)
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-black tabular-nums text-violet-700 dark:text-violet-300">
                          {editing && draft ? (
                            <input
                              type="number"
                              min={0}
                              value={draft.meta_delivery_fee}
                              onChange={(e) => setDraft({ ...draft, meta_delivery_fee: e.target.value })}
                              className="h-8 w-24 rounded-lg border border-gold/30 bg-cream px-2 text-xs font-black dark:bg-brandDark"
                            />
                          ) : row.meta_covered ? (
                            madLabel(row.meta_delivery_fee)
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${coverageBadge(row.quick_covered)}`}>
                            {row.quick_covered ? "مغطاة" : "غير مغطاة"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${coverageBadge(row.meta_covered)}`}>
                            {row.meta_covered ? "مغطاة" : "غير مغطاة"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void saveEdit(row)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-xs font-bold text-slate-950 disabled:opacity-60"
                              >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(null);
                                  setDraft(null);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 text-royal/60 dark:text-slate-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gold/20 px-2.5 text-xs font-semibold text-royal/80 dark:text-slate-200"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
