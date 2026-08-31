"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Pencil,
  Phone,
  PieChart,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Trash2,
  Moon,
} from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import { AddOrderModal } from "@/components/admin/AddOrderModal";
import { AdminDoughnut } from "@/components/admin/AdminDoughnut";
import { CompleteDetailsModal } from "@/components/admin/CompleteDetailsModal";
import { IosSwitch } from "@/components/admin/IosSwitch";
import { MoroccoMap } from "@/components/admin/MoroccoMap";
import { OrderTimelineModal } from "@/components/admin/OrderTimelineModal";
import { ShippingLabel } from "@/components/admin/ShippingLabel";
import {
  ADMIN_STATUSES,
  copyText,
  copyablePhone,
  downloadCsv,
  formatMad,
  ordersToCsv,
  pct,
  shortOrderRef,
  statusMeta,
  telHref,
  waHref,
  type AdminOrder,
  type AdminStats,
  type AdminStatus,
} from "@/lib/admin";
import { buildRegionStats, CITY_CHART_COLORS } from "@/lib/admin-geo";
import { cn } from "@/lib/cn";
import { applyTheme, resolveIsDark, THEME_STORAGE_KEY } from "@/lib/theme";

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
  city_breakdown: [],
};

const STATUS_OPTIONS: { id: AdminStatus; label: string }[] = [
  { id: "new", label: "🟡 جديدة" },
  { id: "confirmed", label: "🔵 تم التأكيد" },
  { id: "shipped", label: "🟣 قيد الشحن" },
  { id: "delivered", label: "🟢 تم التسليم" },
  { id: "cancelled", label: "🔴 ملغاة" },
];

const PREFS_KEY = "chifaglow_view_prefs";
const LEGACY_PREFS_KEY = "cg_admin_sections";
type SectionPrefs = { overview: boolean; cities: boolean; map: boolean; orders: boolean };
const DEFAULT_PREFS: SectionPrefs = { overview: true, cities: true, map: true, orders: true };

const SECTION_ITEMS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "overview", label: "نظرة عامة على الطلبات" },
  { key: "cities", label: "الطرود حسب المدن" },
  { key: "map", label: "خريطة المغرب" },
  { key: "orders", label: "جدول الطلبات" },
];

function readPrefs(): SectionPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY) || localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<SectionPrefs> & { table?: boolean };
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      orders: parsed.orders ?? parsed.table ?? DEFAULT_PREFS.orders,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [username, setUsername] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [completing, setCompleting] = useState<AdminOrder | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hideAll, setHideAll] = useState(false);
  const [hideOverview, setHideOverview] = useState(false);
  const [hideCity, setHideCity] = useState(false);
  const [hideMap, setHideMap] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [prefs, setPrefs] = useState<SectionPrefs>(DEFAULT_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);

  const closeTimeline = useCallback(() => setViewingId(null), []);
  const closePrint = useCallback(() => setPrintingId(null), []);

  useEffect(() => {
    setPrefs(readPrefs());
    setDarkMode(resolveIsDark());
    function onTheme(e: Event) {
      setDarkMode(Boolean((e as CustomEvent<{ dark: boolean }>).detail?.dark));
    }
    window.addEventListener("chifaglow-theme", onTheme);
    return () => window.removeEventListener("chifaglow-theme", onTheme);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (prefsRef.current && !prefsRef.current.contains(e.target as Node)) setPrefsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPrefsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function persistPrefs(next: SectionPrefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  function toggleSection(key: keyof SectionPrefs) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persistPrefs(next);
      return next;
    });
  }

  function toggleDarkMode() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDarkMode(next);
  }

  const load = useCallback(async () => {
    setError("");
    try {
      const [meRes, statsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/me", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/stats", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/orders?limit=2000", { credentials: "include", cache: "no-store" }),
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
        const payload = (await ordersRes.json()) as { orders: AdminOrder[] };
        setOrders(payload.orders || []);
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
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshStats() {
    const statsRes = await fetch("/api/admin/stats", { credentials: "include", cache: "no-store" });
    if (statsRes.ok) setStats((await statsRes.json()) as AdminStats);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/mydashboard/login");
    router.refresh();
  }

  function onStatusSelect(order: AdminOrder, next: AdminStatus, selectEl: HTMLSelectElement) {
    if (next === "confirmed" && order.status !== "confirmed") {
      selectEl.value = order.status;
      setCompleting(order);
      return;
    }
    void changeStatus(order, next);
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
      await refreshStats();
    } catch {
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? { ...o, status: prev } : o)));
      setError("فشل تحديث الحالة. أعد المحاولة.");
    } finally {
      setSavingId(null);
    }
  }

  async function copyPhone(order: AdminOrder) {
    const phone = copyablePhone(order);
    const ok = await copyText(phone);
    if (!ok) {
      setError("تعذر نسخ الرقم. انسخه يدوياً.");
      return;
    }
    setCopiedId(order.order_id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${deleteTarget.order_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("fail");
      setOrders((list) => list.filter((o) => o.order_id !== deleteTarget.order_id));
      setDeleteTarget(null);
      await refreshStats();
    } catch {
      setError("فشل حذف الطلبية. أعد المحاولة.");
    } finally {
      setDeleting(false);
    }
  }

  const confirmedWon = stats.confirmed_orders + stats.shipped_orders + stats.delivered_orders;
  const hideOverviewNums = hideAll || hideOverview;
  const hideCityNums = hideAll || hideCity;
  const hideMapNums = hideAll || hideMap;
  const hideTableNums = hideAll;

  const regionStats = useMemo(() => buildRegionStats(orders), [orders]);

  const cityRows = stats.city_breakdown || [];
  const cityTotal = cityRows.reduce((sum, row) => sum + row.count, 0);
  const topCity = cityRows[0];
  const visibleCities = showAllCities ? cityRows : cityRows.slice(0, 8);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((order) => {
      const hay = `${order.full_name} ${order.phone} ${order.phone_national} ${order.city} ${order.pack_label} ${order.order_id}`.toLowerCase();
      const matchesSearch = !needle || hay.includes(needle);
      const matchesStatus = status === "all" || order.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, filtered.length);
  const pageRows = filtered.slice(start, end);
  const viewing = useMemo(() => orders.find((o) => o.order_id === viewingId) ?? null, [orders, viewingId]);
  const printing = useMemo(() => orders.find((o) => o.order_id === printingId) ?? null, [orders, printingId]);

  useEffect(() => {
    setPage(1);
  }, [q, status, perPage]);

  return (
    <>
    <div className="admin-print-root flex min-h-screen flex-col justify-between bg-cream text-royal antialiased transition-colors duration-300 dark:bg-brandDark dark:text-slate-100 print:hidden">
      <AddOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(order) => {
          setOrders((list) => [order, ...list]);
          setPage(1);
          void refreshStats();
        }}
      />
      <OrderTimelineModal
        order={viewing}
        onClose={closeTimeline}
        onEdit={(order) => {
          setViewingId(null);
          setCompleting(order);
        }}
      />
      <CompleteDetailsModal
        open={Boolean(completing)}
        order={completing}
        onClose={() => setCompleting(null)}
        onSaved={(order) => {
          setOrders((list) => list.map((o) => (o.order_id === order.order_id ? order : o)));
          setCompleting(order);
          void refreshStats();
        }}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-500/30 dark:bg-cardDark">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-royal dark:text-white">حذف الطلبية</h3>
                <p className="text-[11px] text-royal/60 dark:text-slate-400">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>
            <p className="mb-5 text-xs font-bold leading-6 text-royal/80 dark:text-slate-200">
              بغيتي تمسح طلبية <span className="text-gold">{deleteTarget.full_name}</span>
              {deleteTarget.city ? ` — ${deleteTarget.city}` : ""}؟
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-black text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {deleting ? "جاري الحذف…" : "نعم، احذف"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gold/20 bg-cream px-4 py-2.5 text-xs font-bold text-royal/70 dark:bg-brandDark dark:text-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-gold/20 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-md dark:bg-cardDark/95 md:px-4 md:py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 border-gold bg-royal shadow-sm dark:bg-brandDark md:h-10 md:w-10">
              <span className="font-cinzel text-lg font-black text-gold md:text-xl">C</span>
            </div>
            <div className="hidden min-w-0 md:block">
              <span className="block font-cinzel text-lg font-black tracking-widest text-royal dark:text-white">CHIFAGLOW</span>
              <span className="-mt-1 block text-[10px] font-extrabold tracking-wider text-gold-600 dark:text-gold">
                لوحة إدارة المبيعات {username ? `· ${username}` : ""}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <button
              type="button"
              aria-label="إضافة طلب"
              onClick={() => setModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-royal shadow-sm transition hover:bg-gold-600 active:scale-95 md:h-auto md:w-auto md:gap-1.5 md:px-3.5 md:py-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden text-xs font-black md:inline">إضافة طلب</span>
            </button>
            <div className="relative" ref={prefsRef}>
              <button
                type="button"
                aria-label="تخصيص الواجهة"
                aria-expanded={prefsOpen}
                onClick={() => setPrefsOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold-600 transition hover:bg-gold hover:text-royal md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2 dark:text-gold"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden text-xs font-bold md:inline">تخصيص الواجهة</span>
              </button>
              {prefsOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-11 z-50 w-64 rounded-2xl border border-gold/20 bg-[#0F1E33] p-4 text-white shadow-2xl dark:bg-[#0F1E33]"
                >
                  <p className="mb-3 text-sm font-black text-white">أقسام اللوحة</p>
                  <div className="space-y-1">
                    {SECTION_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        role="switch"
                        aria-checked={prefs[item.key]}
                        onClick={() => toggleSection(item.key)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-right transition hover:bg-white/5"
                      >
                        <span className="text-[13px] font-bold text-white">{item.label}</span>
                        <IosSwitch checked={prefs[item.key]} />
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={darkMode}
                      onClick={toggleDarkMode}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-right transition hover:bg-white/5"
                    >
                      <span className="flex items-center gap-2 text-[13px] font-bold text-white">
                        <Moon className="h-3.5 w-3.5 text-gold" />
                        الوضع الداكن
                      </span>
                      <IosSwitch checked={darkMode} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={hideAll ? "إظهار كل الأرقام" : "إخفاء الأرقام"}
              onClick={() => setHideAll((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold-600 transition hover:bg-gold hover:text-royal md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2 dark:text-gold"
            >
              {hideAll ? <Eye className="h-3.5 w-3.5 text-emeraldCustom" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden text-xs font-bold md:inline">{hideAll ? "إظهار كل الأرقام" : "إخفاء الأرقام"}</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered))}
              className="hidden items-center gap-1.5 rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 px-3 py-2 text-xs font-bold text-emeraldCustom transition hover:bg-emeraldCustom hover:text-white md:flex"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>تصدير CSV / Excel</span>
            </button>
            <button
              type="button"
              aria-label="خروج"
              onClick={() => void logout()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-moroccoRed/30 bg-moroccoRed/10 text-moroccoRed transition hover:bg-moroccoRed hover:text-white md:h-auto md:w-auto md:gap-1.5 md:px-3.5 md:py-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden text-xs font-bold md:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow space-y-6 px-4 py-8">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {prefs.overview ? (
        <div className="relative rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury transition-all dark:bg-cardDark">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-sm text-gold">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-royal dark:text-white">إحصائيات وحالات الطلبيات</h3>
                <p className="text-[11px] text-royal/60 dark:text-slate-400">نظرة عامة على حالة تأكيد الطلبات</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHideOverview((v) => !v)}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-gold/20 bg-cream px-2.5 text-xs font-bold text-royal/80 transition hover:text-gold dark:bg-brandDark dark:text-slate-300"
            >
              {hideOverviewNums ? <Eye className="h-3.5 w-3.5 text-emeraldCustom" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{hideOverviewNums ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 py-4 lg:grid-cols-12">
            <div className="flex items-center justify-center lg:col-span-4">
              <div className="relative h-44 w-44">
                <AdminDoughnut
                  labels={["مؤكدة", "جديدة", "غير مؤكدة / ملغاة"]}
                  values={[confirmedWon, stats.new_orders, stats.cancelled_orders]}
                  colors={["#10B981", "#F59E0B", "#E11D48"]}
                  cutout="70%"
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-royal/50 dark:text-slate-400">المجموع</span>
                  <span className={cn("text-sm font-black text-royal dark:text-gold", hideOverviewNums && "blurred-number")}>
                    {stats.total_orders} طلب
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
              <KpiCard label="مجموع الطلبيات" value={stats.total_orders} percent="100%" color="bg-[#0A192F] dark:bg-gold" valueClass="text-royal dark:text-white" percentClass="text-royal/60 dark:text-slate-400" hidden={hideOverviewNums} />
              <KpiCard label="الطلبيات الجديدة" value={stats.new_orders} percent={pct(stats.new_orders, stats.total_orders)} color="bg-[#F59E0B]" valueClass="text-amber-500" percentClass="text-amber-500" hidden={hideOverviewNums} />
              <KpiCard label="الطلبيات المؤكدة" value={confirmedWon} percent={pct(confirmedWon, stats.total_orders)} color="bg-[#10B981]" valueClass="text-emeraldCustom" percentClass="text-emeraldCustom" hidden={hideOverviewNums} />
              <KpiCard label="الطلبيات غير المؤكدة" value={stats.cancelled_orders} percent={pct(stats.cancelled_orders, stats.total_orders)} color="bg-[#E11D48]" valueClass="text-rose-500" percentClass="text-rose-500" hidden={hideOverviewNums} />
            </div>
          </div>
        </div>
        ) : null}

        {prefs.cities || prefs.map ? (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          {prefs.cities ? (
          <div className={cn("flex flex-col justify-between rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury dark:bg-cardDark", prefs.map ? "lg:col-span-7" : "lg:col-span-12")}>
            <div className="flex items-center justify-between border-b border-gold/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-sm text-gold">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-royal dark:text-white">عدد الطرود حسب المدن</h3>
                  <p className="text-[11px] text-royal/60 dark:text-slate-400">
                    إجمالي الطلبيات:{" "}
                    <strong className={cn("font-bold text-gold", hideCityNums && "blurred-number")}>{cityTotal} طرد</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHideCity((v) => !v)}
                className="flex h-8 items-center gap-1.5 rounded-xl border border-gold/20 bg-cream px-2.5 text-xs font-bold text-royal/80 transition hover:border-gold hover:text-gold dark:bg-brandDark dark:text-slate-300"
              >
                {hideCityNums ? <Eye className="h-3.5 w-3.5 text-emeraldCustom" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{hideCityNums ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 items-center gap-5 pt-4 sm:grid-cols-12">
              <div className="relative flex flex-col items-center justify-center sm:col-span-5">
                <div className="relative h-40 w-40">
                  <AdminDoughnut
                    labels={cityRows.slice(0, 8).map((c) => c.city)}
                    values={cityRows.slice(0, 8).map((c) => c.count)}
                    colors={CITY_CHART_COLORS}
                    cutout="72%"
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-royal/50 dark:text-slate-400">أعلى مدينة</span>
                    <span className={cn("text-xs font-black text-royal dark:text-gold", hideCityNums && "blurred-number")}>
                      {topCity ? `${topCity.city} (${topCity.count})` : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-7">
                <div className={cn("admin-scroll space-y-2 overflow-y-auto pr-1", showAllCities ? "max-h-80" : "max-h-60")}>
                  {visibleCities.map((row, i) => (
                    <div key={row.city} className="flex items-center justify-between rounded-xl border border-gold/10 bg-cream/70 p-2 dark:bg-brandDark/70">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-md shadow-sm" style={{ background: CITY_CHART_COLORS[i % CITY_CHART_COLORS.length] }} />
                        <span className="text-xs font-bold uppercase text-royal dark:text-white">{row.city}</span>
                      </div>
                      <div className="font-mono text-xs font-black text-royal dark:text-slate-200">
                        <span className={cn(hideCityNums && "blurred-number")}>{row.count}</span>{" "}
                        <small className={cn("mr-1 font-bold text-emeraldCustom", hideCityNums && "blurred-number")}>
                          ({pct(row.count, cityTotal)})
                        </small>
                      </div>
                    </div>
                  ))}
                  {cityRows.length === 0 ? (
                    <p className="py-6 text-center text-xs font-bold text-royal/50">لا توجد مدن بعد.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-gold/10 pt-3 text-left">
              <button
                type="button"
                onClick={() => setShowAllCities((v) => !v)}
                className="text-xs font-bold text-gold hover:underline"
              >
                {showAllCities ? "إخفاء القائمة ←" : "عرض جميع الطرود والمدن ←"}
              </button>
            </div>
          </div>
          ) : null}

          {prefs.map ? (
            <MoroccoMap
              stats={regionStats}
              hideNumbers={hideMapNums}
              onToggleNumbers={() => setHideMap((v) => !v)}
              className={prefs.cities ? "lg:col-span-5" : "lg:col-span-12"}
            />
          ) : null}
        </div>
        ) : null}

        {prefs.orders ? (
        <>
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-white p-4 shadow-luxury dark:bg-cardDark md:flex-row">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-royal/40 dark:text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو المدينة..."
              className="w-full rounded-xl border border-gold/20 bg-cream py-2.5 pl-4 pr-9 text-xs text-royal placeholder-royal/40 transition focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-royal/70 dark:text-slate-300">
              <span>عرض:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="rounded-xl border border-gold/20 bg-cream px-2.5 py-2 text-xs font-bold text-royal focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-gold/20 bg-cream px-3 py-2 text-xs font-bold text-royal focus:border-gold focus:outline-none dark:bg-brandDark dark:text-white"
            >
              <option value="all">كل الحالات</option>
              {ADMIN_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 px-3 py-2 text-xs font-bold text-emeraldCustom sm:hidden"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-luxury dark:bg-cardDark">
          <div className="overflow-x-auto">
            <table id="orders-table" className="w-full text-right text-xs text-royal dark:text-slate-200">
              <thead className="border-b border-gold/10 bg-cream font-bold text-royal/70 dark:bg-brandDark dark:text-slate-400">
                <tr>
                  <th className="p-3.5">إجراءات</th>
                  <th className="p-3.5">الرقم المرجعي</th>
                  <th className="p-3.5">الزبون</th>
                  <th className="p-3.5">المدينة</th>
                  <th className="p-3.5">الهاتف والتواصل</th>
                  <th className="p-3.5">المنتج المختارة</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5 text-center">حالة الطلبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-royal/60 dark:text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gold" />
                      جاري التحميل…
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center font-bold text-royal/50 dark:text-slate-400">
                      لا توجد طلبات مطابقة.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((order) => {
                    const meta = statusMeta(order.status);
                    const phone = copyablePhone(order);
                    return (
                      <tr key={order.order_id} className="transition hover:bg-cream/50 dark:hover:bg-brandDark/50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title="طباعة بوليصة الشحن"
                              onClick={() => setPrintingId(order.order_id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="عرض التفاصيل ومسار الطلب"
                              onClick={() => setViewingId(order.order_id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 transition hover:bg-sky-500 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="إتمام وتأكيد المعلومات"
                              onClick={() => setCompleting(order)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition hover:bg-gold hover:text-royal"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="حذف الطلبية"
                              onClick={() => setDeleteTarget(order)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-royal/60 dark:text-slate-400" title={order.order_id}>
                          {shortOrderRef(order.order_id)}
                        </td>
                        <td className="p-3.5 font-bold">{order.full_name}</td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-gold/10 px-2 py-1 text-gold-600 dark:text-gold">{order.city}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title="انقر لنسخ الرقم"
                              onClick={() => void copyPhone(order)}
                              className={cn(
                                "ml-1 rounded-md px-1.5 py-0.5 text-left font-mono text-xs font-bold transition hover:bg-gold/15 hover:text-gold",
                                hideTableNums && "blurred-number",
                                copiedId === order.order_id && "text-emeraldCustom",
                              )}
                              dir="ltr"
                            >
                              {copiedId === order.order_id ? "تم النسخ" : phone}
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyPhone(order)}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/10 text-gold transition hover:bg-gold hover:text-royal"
                              title="نسخ رقم الهاتف"
                            >
                              {copiedId === order.order_id ? <Check className="h-3 w-3 text-emeraldCustom" /> : <Copy className="h-3 w-3" />}
                            </button>
                            <a
                              href={telHref(order.phone || order.phone_national)}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-500 transition hover:bg-blue-500 hover:text-white"
                              title="اتصال"
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                            <a
                              href={waHref(order.phone || order.phone_national, order.full_name, order.pack_label, order.city)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-emeraldCustom/10 text-emeraldCustom transition hover:bg-emeraldCustom hover:text-white"
                              title="واتساب"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="p-3.5">{order.pack_label}</td>
                        <td className={cn("p-3.5 font-bold text-emeraldCustom", hideTableNums && "blurred-number")}>
                          {formatMad(order.total)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              value={order.status}
                              disabled={savingId === order.order_id}
                              onChange={(e) => onStatusSelect(order, e.target.value as AdminStatus, e.currentTarget)}
                              className={cn("rounded-lg border px-2 py-1 text-[11px] font-bold focus:outline-none", meta.selectClass)}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            {savingId === order.order_id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" /> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-gold/10 bg-cream/30 p-4 text-xs dark:bg-brandDark/30 sm:flex-row">
            <div className="font-medium text-royal/60 dark:text-slate-400">
              إظهار <span className="font-bold text-royal dark:text-white">{filtered.length === 0 ? 0 : start + 1}</span> إلى{" "}
              <span className="font-bold text-royal dark:text-white">{end}</span> من أصل{" "}
              <span className="font-bold text-gold">{filtered.length}</span> طلبية
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  "rounded-lg border border-gold/20 px-2.5 py-1 font-bold",
                  currentPage === 1 ? "cursor-not-allowed opacity-40" : "hover:bg-gold hover:text-royal",
                )}
              >
                <ChevronRight className="ml-1 inline h-2.5 w-2.5" /> السابق
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<number[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-p);
                  acc.push(p);
                  return acc;
                }, [])
                .map((p) =>
                  p < 0 ? (
                    <span key={`gap-${p}`} className="px-1 text-royal/40">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-7 w-7 rounded-lg border font-bold transition",
                        p === currentPage
                          ? "border-gold bg-royal text-gold dark:bg-gold dark:text-royal"
                          : "border-gold/20 hover:bg-gold/10",
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cn(
                  "rounded-lg border border-gold/20 px-2.5 py-1 font-bold",
                  currentPage === totalPages ? "cursor-not-allowed opacity-40" : "hover:bg-gold hover:text-royal",
                )}
              >
                التالي <ChevronLeft className="mr-1 inline h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        </div>
        </>
        ) : null}
      </main>

      <footer className="border-t border-gold/20 bg-white px-4 py-4 text-center text-xs text-royal/60 transition-colors dark:bg-cardDark dark:text-slate-500">
        © 2026 Chifaglow Admin Panel — نظام إدارة وتصنيف الطلبيات
      </footer>
    </div>
    {printing ? <ShippingLabel order={printing} onClose={closePrint} /> : null}
    </>
  );
}

function KpiCard({
  label,
  value,
  percent,
  color,
  valueClass,
  percentClass,
  hidden,
}: {
  label: string;
  value: number;
  percent: string;
  color: string;
  valueClass: string;
  percentClass: string;
  hidden: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gold/10 bg-cream/70 p-4 dark:bg-brandDark/70">
      <div className="flex items-center gap-3">
        <span className={cn("h-4 w-4 shrink-0 rounded-md shadow-sm", color)} />
        <div>
          <span className="block text-xs font-semibold text-royal/60 dark:text-slate-400">{label}</span>
          <span className={cn("mt-0.5 block text-xl font-black", valueClass, hidden && "blurred-number")}>{value}</span>
        </div>
      </div>
      <span className={cn("text-xs font-bold", percentClass, hidden && "blurred-number")}>{percent}</span>
    </div>
  );
}
