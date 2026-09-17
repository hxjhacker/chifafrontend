"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Pencil, RefreshCw, Save, Search, X } from "lucide-react";
import { DashboardBanner, notifyDashboard } from "@/components/admin/DashboardAlert";
import { DASHBOARD_HOME } from "@/lib/admin-paths";

type PricingCity = {
  id: string;
  city_name: string;
  city_name_ar: string;
  region?: string;
  delivery_delay: string | null;
  quick_delivery_price: number;
  competitor_name: string;
  competitor_delivery_price: number | null;
  competitor_retour_price: number;
  meta_delivery_fee?: number | null;
  quick_covered?: boolean;
  meta_covered?: boolean;
  quick_total: number;
  competitor_total: number | null;
  savings: number | null;
  cheaper: "quick" | "competitor" | "tie" | "unknown";
};

type PricingStats = {
  total_cities: number;
  file_cities: number;
  average_delivery_rate: number;
  advantage?: string;
};

type EditDraft = {
  quick_delivery_price: string;
  competitor_delivery_price: string;
};

function mad(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${shown} د.م`;
}

function cheaperLabel(row: PricingCity) {
  if (row.cheaper === "quick") return { text: "Quick أوفر", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  if (row.cheaper === "competitor") return { text: "ميتا أوفر", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  if (row.cheaper === "tie") return { text: "متعادل", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
  return { text: "غير محدد", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
}

function matchesQuery(row: PricingCity, query: string) {
  const needle = query.trim().toLocaleLowerCase("ar");
  if (!needle) return true;
  const hay = `${row.city_name} ${row.city_name_ar} ${row.region || ""}`.toLocaleLowerCase("ar");
  return hay.includes(needle);
}

export function PricingComparisonPage() {
  const [rows, setRows] = useState<PricingCity[]>([]);
  const [stats, setStats] = useState<PricingStats | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pricing-comparison", { cache: "no-store", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        cities?: PricingCity[];
        stats?: PricingStats;
        detail?: string;
      };
      if (!res.ok) throw new Error(data.detail || "load_failed");
      setRows(Array.isArray(data.cities) ? data.cities : []);
      setStats(data.stats || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر تحميل الأسعار";
      setError(msg);
      notifyDashboard(msg, "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => rows.filter((row) => matchesQuery(row, query)), [rows, query]);

  async function reseed() {
    setSeeding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pricing-comparison", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(data.detail || "seed_failed");
      }
      await load();
      notifyDashboard("تم تحديث قائمة المدن بنجاح", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر تحديث المدن";
      setError(msg);
      notifyDashboard(msg, "error");
    } finally {
      setSeeding(false);
    }
  }

  function startEdit(row: PricingCity) {
    setEditingId(row.id);
    setDraft({
      quick_delivery_price: String(row.quick_delivery_price ?? ""),
      competitor_delivery_price: row.competitor_delivery_price == null && row.meta_delivery_fee == null ? "" : String(row.meta_delivery_fee ?? row.competitor_delivery_price),
    });
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pricing-comparison/${id}`, {
        method: "PATCH",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quick_delivery_price: Number(draft.quick_delivery_price),
          competitor_delivery_price: Number(draft.competitor_delivery_price),
          meta_delivery_fee: Number(draft.competitor_delivery_price),
        }),
      });
      const updated = (await res.json().catch(() => ({}))) as PricingCity & { detail?: string };
      if (!res.ok) throw new Error(updated.detail || "update_failed");
      setRows((list) => list.map((row) => (row.id === id ? { ...row, ...updated } : row)));
      setEditingId(null);
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

  const totalCovered = stats?.file_cities || stats?.total_cities || rows.length;
  const avgRate = stats?.average_delivery_rate ?? 0;

  return (
    <div dir="rtl" className="min-h-screen px-4 py-6 sm:px-6" style={{ background: "#070d19", color: "#e8eefc" }}>
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-400/90">الخطة رقم 3 · مقارنة الأسعار</p>
            <h1 className="mt-1 text-2xl font-black text-white">مقارنة أسعار Quick و Meta</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void reseed()}
              disabled={seeding || loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold text-slate-200 disabled:opacity-60"
              style={{ borderColor: "#1e2d4a", background: "#0b1324" }}
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              تحديث المدن
            </button>
            <Link
              href={DASHBOARD_HOME}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold text-slate-200"
              style={{ borderColor: "#1e2d4a", background: "#0b1324" }}
            >
              <ArrowRight className="h-4 w-4" />
              لوحة التحكم
            </Link>
          </div>
        </div>

        <DashboardBanner
          tone="success"
          title="ميزة QuickLivraison"
          detail="الارجاع (Retour) والرفض (Refus) مجاني 0 درهم لجميع المدن"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "المدن المغطاة", value: String(totalCovered), hint: "من ملف quick_pricing.json" },
            { label: "متوسط سعر التوصيل", value: mad(avgRate), hint: "Quick Livraison" },
            { label: "الارجاع والرفض", value: "مجاني 0 د.م", hint: "Retour + Refus" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border p-4" style={{ borderColor: "#1e2d4a", background: "#0b1324" }}>
              <p className="text-xs text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-white">{card.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم المدينة عربي أو فرنسي…"
            className="h-12 w-full rounded-2xl border pr-10 pl-4 text-sm text-white outline-none placeholder:text-slate-500"
            style={{ borderColor: "#1e2d4a", background: "#0b1324" }}
          />
        </div>

        {error ? (
          <DashboardBanner tone="error" title={error} onClose={() => setError("")} />
        ) : null}

        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "#1e2d4a", background: "#0b1324" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-right text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400" style={{ background: "#070d19" }}>
                <tr>
                  <th className="px-4 py-3 font-bold">اسم المدينة</th>
                  <th className="px-4 py-3 font-bold">الجهة</th>
                  <th className="px-4 py-3 font-bold">سعر كويك</th>
                  <th className="px-4 py-3 font-bold">سعر ميتا</th>
                  <th className="px-4 py-3 font-bold">التغطية</th>
                  <th className="px-4 py-3 font-bold">المقارنة</th>
                  <th className="px-4 py-3 font-bold">تعديل</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      جاري التحميل…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                      لا توجد مدن مطابقة. شغّل سكربت السييد إذا كان الجدول فارغاً.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const badge = cheaperLabel(row);
                    const editing = editingId === row.id;
                    const metaPrice = row.meta_delivery_fee ?? row.competitor_delivery_price;
                    return (
                      <tr key={row.id} className="border-t" style={{ borderColor: "#1e2d4a" }}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{row.city_name}</div>
                          {row.city_name_ar ? <div className="text-xs text-slate-400">{row.city_name_ar}</div> : null}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{row.region || "—"}</td>
                        <td className="px-4 py-3 font-black text-sky-300">
                          {editing && draft ? (
                            <input
                              type="number"
                              min={0}
                              value={draft.quick_delivery_price}
                              onChange={(e) => setDraft({ ...draft, quick_delivery_price: e.target.value })}
                              className="h-8 w-24 rounded-lg border px-2 text-xs text-white"
                              style={{ borderColor: "#1e2d4a", background: "#070d19" }}
                            />
                          ) : (
                            mad(row.quick_delivery_price)
                          )}
                        </td>
                        <td className="px-4 py-3 font-black text-violet-300">
                          {editing && draft ? (
                            <input
                              type="number"
                              min={0}
                              value={draft.competitor_delivery_price}
                              onChange={(e) => setDraft({ ...draft, competitor_delivery_price: e.target.value })}
                              className="h-8 w-24 rounded-lg border px-2 text-xs text-white"
                              style={{ borderColor: "#1e2d4a", background: "#070d19" }}
                            />
                          ) : (
                            mad(metaPrice)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${row.quick_covered === false ? "border-slate-500/20 bg-slate-500/10 text-slate-400" : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"}`}>
                              كويك {row.quick_covered === false ? "غير مغطاة" : "مغطاة"}
                            </span>
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${row.meta_covered === false || metaPrice == null ? "border-slate-500/20 bg-slate-500/10 text-slate-400" : "border-violet-500/30 bg-violet-500/15 text-violet-300"}`}>
                              ميتا {row.meta_covered === false || metaPrice == null ? "غير مغطاة" : "مغطاة"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badge.className}`}>
                            {badge.text}
                          </span>
                          {row.savings != null && row.savings !== 0 ? (
                            <div className={`mt-1 text-[11px] ${row.savings > 0 ? "text-emerald-400" : "text-amber-300"}`}>
                              {row.savings > 0 ? `توفير ${mad(row.savings)}` : `فرق ${mad(Math.abs(row.savings))}`}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {editing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void saveEdit(row.id)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-xs font-bold text-slate-950 disabled:opacity-60"
                              >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null);
                                  setDraft(null);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-300"
                                style={{ borderColor: "#1e2d4a" }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold text-slate-200"
                              style={{ borderColor: "#1e2d4a" }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-3 text-xs text-slate-500" style={{ borderColor: "#1e2d4a" }}>
            عرض {filtered.length} من أصل {rows.length} مدينة
          </div>
        </div>
      </div>
    </div>
  );
}
