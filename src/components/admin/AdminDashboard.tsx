"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  Download,
  Loader2,
  LogOut,
  Percent,
  Phone,
  Search,
} from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import {
  ADMIN_STATUSES,
  downloadCsv,
  formatMad,
  formatStamp,
  ordersToCsv,
  statusMeta,
  telHref,
  waHref,
  type AdminOrder,
  type AdminStats,
  type AdminStatus,
} from "@/lib/admin";
import { cn } from "@/lib/cn";

const EMPTY_STATS: AdminStats = {
  revenue: 0,
  currency: "MAD",
  new_orders: 0,
  confirmed_orders: 0,
  shipped_orders: 0,
  delivered_orders: 0,
  cancelled_orders: 0,
  confirmation_rate: 0,
  total_orders: 0,
};

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => window.clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (city) params.set("city", city);
    if (status) params.set("status", status);
    const qs = params.toString();
    try {
      const [meRes, statsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/me", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/stats", { credentials: "include", cache: "no-store" }),
        fetch(`/api/admin/orders${qs ? `?${qs}` : ""}`, { credentials: "include", cache: "no-store" }),
      ]);
      if ([meRes, statsRes, ordersRes].some((r) => r.status === 401)) {
        router.replace("/mydashboard/login");
        return;
      }
      if (meRes.ok) {
        const me = (await meRes.json()) as { username?: string };
        setUsername(me.username || "");
      }
      if (statsRes.ok) setStats((await statsRes.json()) as AdminStats);
      if (ordersRes.ok) {
        const payload = (await ordersRes.json()) as { orders: AdminOrder[]; cities: string[] };
        setOrders(payload.orders || []);
        setCities(payload.cities || []);
      }
      if (!statsRes.ok || !ordersRes.ok) {
        setError(
          statsRes.status === 500 || ordersRes.status === 500
            ? "تعذر الاتصال بقاعدة البيانات. تحقق من PostgreSQL."
            : "تعذر تحميل الطلبات.",
        );
      }
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, [city, debouncedQ, router, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/mydashboard/login");
    router.refresh();
  }

  async function changeStatus(order: AdminOrder, next: AdminStatus) {
    const prev = order.status;
    setOrders((list) => list.map((o) => (o.order_id === order.order_id ? { ...o, status: next } : o)));
    setSavingId(order.order_id);
    try {
      const res = await fetch(`/api/admin/orders/${order.order_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("fail");
      const updated = (await res.json()) as AdminOrder;
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? updated : o)));
      const statsRes = await fetch("/api/admin/stats", { credentials: "include", cache: "no-store" });
      if (statsRes.ok) setStats((await statsRes.json()) as AdminStats);
    } catch {
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? { ...o, status: prev } : o)));
      setError("فشل تحديث الحالة. أعد المحاولة.");
    } finally {
      setSavingId(null);
    }
  }

  const kpis = useMemo(
    () => [
      {
        label: "إجمالي المداخيل",
        value: formatMad(stats.revenue),
        hint: "بدون الملغى",
        icon: Banknote,
        accent: "from-gold/20 to-gold/5",
      },
      {
        label: "طلبات جديدة",
        value: String(stats.new_orders),
        hint: "بانتظار التأكيد",
        icon: ClipboardList,
        accent: "from-amber-400/20 to-amber-400/5",
      },
      {
        label: "طلبات مؤكدة",
        value: String(stats.confirmed_orders),
        hint: "جاهزة للشحن",
        icon: BadgeCheck,
        accent: "from-sky-400/20 to-sky-400/5",
      },
      {
        label: "نسبة التأكيد",
        value: `${stats.confirmation_rate}%`,
        hint: "مؤكد + مشحون + مسلّم مقابل الملغى",
        icon: Percent,
        accent: "from-emeraldCustom/20 to-emeraldCustom/5",
      },
    ],
    [stats],
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A192F]">
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-white/90 backdrop-blur-md dark:bg-[#0A192F]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-gold bg-[#0A192F]">
              <span className="font-cinzel text-xl font-black text-gold">C</span>
            </div>
            <div>
              <p className="font-cinzel text-lg font-black tracking-[0.18em] text-[#0A192F] dark:text-cream">
                CHIFAGLOW
              </p>
              <p className="text-[11px] font-bold text-gold-600 dark:text-gold">
                لوحة الإدارة {username ? `· ${username}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((card) => (
            <article
              key={card.label}
              className={cn(
                "rounded-2xl border border-gold/20 bg-gradient-to-br p-5 shadow-sm dark:border-gold/15 dark:bg-cardDark",
                card.accent,
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-royal/70 dark:text-slate-300">{card.label}</p>
                <card.icon className="h-5 w-5 text-gold-600 dark:text-gold" />
              </div>
              <p className="font-cinzel text-2xl font-black text-[#0A192F] dark:text-cream">{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-royal/50 dark:text-slate-400">{card.hint}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-gold/20 bg-white p-4 shadow-sm dark:border-gold/15 dark:bg-cardDark md:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-black text-[#0A192F] dark:text-cream">إدارة الطلبات</h2>
            <button
              type="button"
              onClick={() =>
                downloadCsv(`chifaglow-orders-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(orders))
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A192F] px-4 py-2.5 text-xs font-black text-gold transition hover:brightness-110 dark:bg-gold dark:text-[#0A192F]"
            >
              <Download className="h-4 w-4" />
              تصدير CSV / Excel
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف"
                className="field-input !mt-0 pr-10"
              />
            </label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="field-input !mt-0">
              <option value="">كل المدن</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input !mt-0">
              <option value="">كل الحالات</option>
              {ADMIN_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-gold/15">
            <table className="min-w-[980px] w-full text-right text-sm">
              <thead className="bg-[#0A192F] text-gold">
                <tr className="text-xs font-black">
                  <th className="px-3 py-3">رقم الطلب</th>
                  <th className="px-3 py-3">التوقيت</th>
                  <th className="px-3 py-3">الزبون</th>
                  <th className="px-3 py-3">المدينة</th>
                  <th className="px-3 py-3">الهاتف</th>
                  <th className="px-3 py-3">الباقة</th>
                  <th className="px-3 py-3">المجموع</th>
                  <th className="px-3 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-royal/60 dark:text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gold" />
                      جاري التحميل…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center font-bold text-royal/50 dark:text-slate-400">
                      لا توجد طلبات مطابقة.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const meta = statusMeta(order.status);
                    return (
                      <tr
                        key={order.order_id}
                        className="border-t border-gold/10 bg-white odd:bg-gold/5 dark:bg-transparent dark:odd:bg-white/5"
                      >
                        <td className="px-3 py-3 font-mono text-xs" title={order.order_id} dir="ltr">
                          {order.order_id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{formatStamp(order.created_at)}</td>
                        <td className="px-3 py-3 font-bold">{order.full_name}</td>
                        <td className="px-3 py-3">{order.city}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <span className="text-xs font-semibold">{order.phone_national || order.phone}</span>
                            <a
                              href={telHref(order.phone || order.phone_national)}
                              className="rounded-lg border border-sky-200 p-1 text-sky-700 hover:bg-sky-50 dark:border-sky-500/30 dark:text-sky-300"
                              aria-label="اتصال"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={waHref(order.phone || order.phone_national, order.full_name)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-emerald-200 p-1 text-[#25D366] hover:bg-emerald-50 dark:border-emerald-500/30"
                              aria-label="واتساب"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-xs leading-5">{order.pack_label}</td>
                        <td className="px-3 py-3 font-black text-gold-600 dark:text-gold">{formatMad(order.total)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              disabled={savingId === order.order_id}
                              onChange={(e) => void changeStatus(order, e.target.value as AdminStatus)}
                              className={cn(
                                "rounded-xl border px-2 py-1.5 text-xs font-black outline-none",
                                meta.selectClass,
                              )}
                            >
                              {ADMIN_STATUSES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            {savingId === order.order_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
