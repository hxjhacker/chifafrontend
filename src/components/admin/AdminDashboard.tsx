"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Calculator,
  CheckCircle2,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Menu,
  Package,
  PieChart,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  Moon,
  RefreshCw,
  X,
} from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import SplashScreen from "@/components/SplashScreen";
import { AddOrderModal } from "@/components/admin/AddOrderModal";
import { AddProductModal } from "@/components/admin/AddProductModal";
import { AdminDoughnut } from "@/components/admin/AdminDoughnut";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { CityTarifsModal } from "@/components/admin/CityTarifsModal";
import { CompleteDetailsModal } from "@/components/admin/CompleteDetailsModal";
import { IosSwitch } from "@/components/admin/IosSwitch";
import { LogisticsKpiCards } from "@/components/admin/LogisticsKpiCards";
import { MoroccoMap } from "@/components/admin/MoroccoMap";
import { OrderAlertsBell, OverdueOrdersBanner } from "@/components/admin/OrderAlertsBell";
import { OrderDesktopRow, OrderMobileCard } from "@/components/admin/OrderRow";
import { OrderTimelineModal } from "@/components/admin/OrderTimelineModal";
import { QuickWhatsAppOrderModal } from "@/components/admin/QuickWhatsAppOrderModal";
import { ViewsObservatory } from "@/components/admin/ViewsObservatory";
import {
  ADMIN_STATUSES,
  canTransitionStatus,
  carrierLabel,
  cloneOrderCreatePayload,
  copyText,
  copyablePhone,
  downloadCsv,
  hasCompleteConfirmDetails,
  hasTracking,
  LABEL_PRINT_HINT,
  needsConfirmModal,
  ordersToCsv,
  pct,
  QUICK_STOCK_KH01_PRODUCT_ID,
  type AdminCarrier,
  type AdminOrder,
  type AdminStats,
  type AdminStatus,
} from "@/lib/admin";
import { CITY_CHART_COLORS } from "@/lib/admin-geo";
import { EMPTY_UNDISPATCHED, type UndispatchedSummary } from "@/lib/order-alerts";
import { EMPTY_LOGISTICS, type LogisticsAnalytics } from "@/lib/logistics";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";
import { applyTheme, resolveIsDark, THEME_STORAGE_KEY } from "@/lib/theme";
import { clearStorage, readStorage, writeJsonStorage, writeStorage } from "@/lib/safe-storage";

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
  { id: "returned", label: "🟠 مرتجع" },
  { id: "cancelled", label: "🔴 ملغاة" },
];

const ShippingLabel = dynamic(
  () => import("@/components/admin/ShippingLabel").then((mod) => mod.ShippingLabel),
  { ssr: false },
);

const PREFS_KEY = "chifaglow_view_prefs";
const LEGACY_PREFS_KEY = "cg_admin_sections";
type SectionPrefs = { logistics: boolean; overview: boolean; cities: boolean; map: boolean; orders: boolean; observatory: boolean };
const DEFAULT_PREFS: SectionPrefs = { logistics: true, overview: true, cities: true, map: true, orders: true, observatory: true };

const SECTION_ITEMS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "logistics", label: "التحصيل والتوصيل" },
  { key: "overview", label: "نظرة عامة على الطلبات" },
  { key: "cities", label: "الطرود حسب المدن" },
  { key: "map", label: "خريطة المغرب" },
  { key: "orders", label: "جدول الطلبات" },
  { key: "observatory", label: "إظهار/إخفاء مرصد المشاهدات والأداء" },
];

const DASHBOARD_SHELL = "mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8";
const NAV_CHIP =
  "relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-semibold transition";
const NAV_TARIFS = `${NAV_CHIP} border-teal-500/30 text-teal-600 hover:bg-teal-500/10 dark:text-teal-400`;
const NAV_PRODUCTS = `${NAV_CHIP} border-purple-500/30 text-purple-600 hover:bg-purple-500/10 dark:text-purple-400`;
const NAV_WHATSAPP = `${NAV_CHIP} border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400`;
const NAV_PREFS = `${NAV_CHIP} cursor-pointer border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400`;
const NAV_HIDE = `${NAV_CHIP} border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400`;
const NAV_GHOST = `${NAV_CHIP} border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`;
const NAV_PRIMARY =
  "relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 active:scale-[0.98]";
const NAV_ICON =
  "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white";
const NAV_LOGOUT =
  "relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-transparent px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300";
const NAV_DIVIDER = "hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 lg:block";
const FILTER_CONTROL =
  "h-11 shrink-0 rounded-xl border border-gold/30 bg-cream px-3.5 text-sm font-semibold text-royal shadow-sm transition focus:border-gold focus:outline-none dark:border-white/15 dark:bg-brandDark dark:text-white";

async function adminFetch(url: string, init: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { credentials: "include", cache: "no-store", ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function serverErrorMessage(status: number, detail?: string, fallback = "تعذر الاتصال بالخادم.") {
  const text = String(detail || "").trim();
  if (text && !["orders_failed", "update_failed", "logistics_failed", "fail"].includes(text)) return text;
  if (status >= 500) return "تعذر الاتصال بقاعدة البيانات. تحقق من PostgreSQL.";
  return fallback;
}

function readPrefs(): SectionPrefs {
  const raw = readStorage(PREFS_KEY) || readStorage(LEGACY_PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<SectionPrefs> & { table?: boolean };
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid prefs");
    }
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      orders: parsed.orders ?? parsed.table ?? DEFAULT_PREFS.orders,
    };
  } catch (e) {
    console.warn("Failed to parse cached settings:", e);
    clearStorage(PREFS_KEY);
    clearStorage(LEGACY_PREFS_KEY);
    return DEFAULT_PREFS;
  }
}

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [logistics, setLogistics] = useState<LogisticsAnalytics>(EMPTY_LOGISTICS);
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
  const [tarifsOpen, setTarifsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [completing, setCompleting] = useState<AdminOrder | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState<"dispatch" | "labels" | "manifest" | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [dispatchCarrier, setDispatchCarrier] = useState<AdminCarrier>("meta_livraison");
  const [undispatchedOnly, setUndispatchedOnly] = useState(false);
  const [alerts, setAlerts] = useState<UndispatchedSummary>(EMPTY_UNDISPATCHED);
  const [syncingTracking, setSyncingTracking] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"ok" | "warn">("ok");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hideAll, setHideAll] = useState(false);
  const [hideOverview, setHideOverview] = useState(false);
  const [hideLogistics, setHideLogistics] = useState(false);
  const [hideCity, setHideCity] = useState(false);
  const [hideMap, setHideMap] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [prefs, setPrefs] = useState<SectionPrefs>(DEFAULT_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useLockBodyScroll(Boolean(deleteTarget) || prefsOpen || menuOpen);

  const closeTimeline = useCallback(() => setViewingId(null), []);
  const closePrint = useCallback(() => setPrintingId(null), []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setPrefsOpen(false);
      setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function persistPrefs(next: SectionPrefs) {
    writeJsonStorage(PREFS_KEY, next);
    clearStorage(LEGACY_PREFS_KEY);
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
    writeStorage(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDarkMode(next);
  }

  const load = useCallback(async () => {
    setError("");
    try {
      const meRes = await adminFetch("/api/admin/me", {}, 8000);
      if (meRes.status === 401) {
        router.replace("/mydashboard/login");
        return;
      }
      if (meRes.ok) {
        const me = (await meRes.json()) as { username?: string };
        setUsername(me.username || "");
      }

      const ordersRes = await adminFetch("/api/admin/orders?limit=2000", {}, 20000);
      if (ordersRes.status === 401) {
        router.replace("/mydashboard/login");
        return;
      }
      if (ordersRes.ok) {
        const payload = (await ordersRes.json()) as { orders: AdminOrder[] };
        setOrders(payload.orders || []);
      } else {
        const body = (await ordersRes.json().catch(() => ({}))) as { detail?: string; message?: string };
        const msg = serverErrorMessage(ordersRes.status, body.message || body.detail, "تعذر تحميل الطلبات.");
        setError(msg);
        setNoticeKind("warn");
        setNotice(msg);
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? "انتهت مهلة الاتصال بالخادم."
          : "تعذر الاتصال بالخادم.";
      setError(msg);
      setNoticeKind("warn");
      setNotice(msg);
    } finally {
      setLoading(false);
    }

    void (async () => {
      try {
        const [statsRes, logisticsRes] = await Promise.all([
          adminFetch("/api/admin/stats", {}, 8000).catch(() => null),
          adminFetch("/api/admin/analytics/logistics", {}, 6000).catch(() => null),
        ]);
        if (statsRes?.ok) setStats((await statsRes.json()) as AdminStats);
        if (logisticsRes?.ok) setLogistics((await logisticsRes.json()) as LogisticsAnalytics);
      } catch {
        /* stats/logistics must never freeze the dashboard */
      }
    })();
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshStats() {
    try {
      const [statsRes, logisticsRes] = await Promise.all([
        adminFetch("/api/admin/stats", {}, 8000).catch(() => null),
        adminFetch("/api/admin/analytics/logistics", {}, 6000).catch(() => null),
      ]);
      if (statsRes?.ok) setStats((await statsRes.json()) as AdminStats);
      if (logisticsRes?.ok) setLogistics((await logisticsRes.json()) as LogisticsAnalytics);
    } catch {
      /* ignore background stats errors */
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/mydashboard/login");
    router.refresh();
  }

  function onStatusSelect(order: AdminOrder, next: AdminStatus, selectEl: HTMLSelectElement) {
    if (next === order.status) return;
    if (!canTransitionStatus(order.status, next)) {
      selectEl.value = order.status;
      setError("لا يمكن القفز في حالة الطلب. اتبع المسار: جديدة → تم التأكيد → قيد الشحن → تم التسليم / مرتجع.");
      return;
    }
    if (needsConfirmModal(order, next)) {
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
      const res = await adminFetch(`/api/admin/orders/${order.order_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }, 15000);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
        const map: Record<string, string> = {
          invalid_status_transition: "لا يمكن القفز في حالة الطلب. اتبع المسار بالترتيب.",
          confirmation_details_required: "لازم تكمل معلومات التوصيل قبل التأكيد.",
          invalid_status: "حالة الطلب غير صالحة.",
        };
        throw new Error(map[body.detail || ""] || serverErrorMessage(res.status, body.message || body.detail, "فشل تحديث الحالة. أعد المحاولة."));
      }
      const updated = (await res.json()) as AdminOrder;
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? updated : o)));
      await refreshStats();
    } catch (err) {
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? { ...o, status: prev } : o)));
      const msg = err instanceof Error && err.message !== "fail" ? err.message : "فشل تحديث الحالة. أعد المحاولة.";
      setError(msg);
      setNoticeKind("warn");
      setNotice(msg);
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

  async function copyTracking(order: AdminOrder) {
    const code = (order.meta_livraison_code || "").trim();
    if (!code) return;
    const ok = await copyText(code);
    if (!ok) {
      setError("تعذر نسخ كود التتبع. انسخه يدوياً.");
      return;
    }
    setCopiedTrackingId(order.order_id);
    window.setTimeout(() => setCopiedTrackingId(null), 1800);
  }

  function printShipping(order: AdminOrder) {
    if (!hasTracking(order)) {
      setNoticeKind("warn");
      setNotice(LABEL_PRINT_HINT);
      return;
    }
    setPrintingId(order.order_id);
  }

  async function duplicateOrder(order: AdminOrder) {
    if (duplicatingId) return;
    setDuplicatingId(order.order_id);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloneOrderCreatePayload(order)),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_name: "الاسم قصير جداً.",
          invalid_ma_phone: "رقم الهاتف غير صالح لإعادة الطلب.",
          invalid_city: "المدينة غير صالحة.",
          invalid_price: "المبلغ غير صالح.",
        };
        throw new Error(map[body.detail || ""] || "تعذر إنشاء الطلبية الجديدة.");
      }
      const created = (await res.json()) as AdminOrder;
      setOrders((list) => [created, ...list]);
      setPage(1);
      if (status !== "all" && status !== "new") setStatus("all");
      setNoticeKind("ok");
      setNotice("تم إنشاء طلبية جديدة بنجاح من هذه الطلبية");
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إنشاء الطلبية الجديدة.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function sendToLivraison(order: AdminOrder, carrier: AdminCarrier = "meta_livraison") {
    if (shippingId) return;
    if (order.meta_livraison_code) {
      setNoticeKind("ok");
      setNotice(`الطلب مرسل مسبقاً إلى ${carrierLabel(order.carrier)}: ${order.meta_livraison_code}`);
      return;
    }
    if (order.status === "cancelled" || order.status === "returned") {
      setError(order.status === "returned" ? "لا يمكن شحن طلبية مرتجعة." : "لا يمكن شحن طلبية ملغاة.");
      return;
    }
    if (!hasCompleteConfirmDetails(order)) {
      setCompleting(order);
      setError("كمّل عنوان التوصيل قبل إرسال الطرد.");
      return;
    }
    if (carrier === "force_log") {
      setNoticeKind("warn");
      setNotice("Force Log غير مفعّل بعد.");
      return;
    }
    setShippingId(order.order_id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.order_id}/livraison`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ carrier }),
      });
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
        detail?: string | Record<string, unknown>;
        success?: boolean;
        message?: string;
        error?: string;
        origin?: string;
        status_code?: number;
        backend_response?: Record<string, unknown>;
      };
      const nested = raw.backend_response && typeof raw.backend_response === "object" ? raw.backend_response : {};
      const body = { ...raw, ...nested } as AdminOrder & typeof raw;
      if (!res.ok || body.success === false) {
        const map: Record<string, string> = {
          meta_livraison_not_configured: "أضف مفاتيح Meta Livraison في الخادم أولاً.",
          quick_livraison_not_configured: "أضف مفتاح Quick Livraison في الخادم أولاً.",
          quick_district_not_mapped: "هذه المدينة غير مربوطة بـ Quick Livraison. زامن قائمة المدن أولاً.",
          force_log_not_implemented: "Force Log غير مفعّل بعد.",
          confirmation_details_required: "كمّل معلومات التوصيل قبل الشحن.",
          cannot_ship_cancelled: "لا يمكن شحن طلبية ملغاة.",
          order_not_found: "الطلبية غير موجودة.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
        };
        throw new Error(
          body.message ||
            body.error ||
            (typeof body.detail === "object" && body.detail ? JSON.stringify(body.detail) : map[String(body.detail || "")] || String(body.detail || "")) ||
            `تعذر إرسال الطرد إلى ${carrierLabel(carrier)}.`,
        );
      }
      setOrders((list) =>
        list.map((row) =>
          row.order_id === order.order_id
            ? {
                ...row,
                ...body,
                proxied_status: undefined,
                target_url: undefined,
                backend_response: undefined,
                success: undefined,
              }
            : row,
        ),
      );
      setNoticeKind("ok");
      setNotice(
        body.meta_livraison_code
          ? `تم إرسال الطرد عبر ${carrierLabel(carrier)}. كود التتبع: ${body.meta_livraison_code}`
          : `تم إرسال الطرد عبر ${carrierLabel(carrier)}.`,
      );
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : `تعذر إرسال الطرد إلى ${carrierLabel(carrier)}.`);
    } finally {
      setShippingId(null);
    }
  }

  async function sendQuickStock(order: AdminOrder) {
    if (shippingId) return;
    if (order.meta_livraison_code) {
      setNoticeKind("ok");
      setNotice(`الطلب مرسل مسبقاً إلى ${carrierLabel(order.carrier)}: ${order.meta_livraison_code}`);
      return;
    }
    if (order.status === "cancelled" || order.status === "returned") {
      setError(order.status === "returned" ? "لا يمكن شحن طلبية مرتجعة." : "لا يمكن شحن طلبية ملغاة.");
      return;
    }
    if (!hasCompleteConfirmDetails(order)) {
      setCompleting(order);
      setError("كمّل عنوان التوصيل قبل إرسال الطرد.");
      return;
    }
    setShippingId(order.order_id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.order_id}/dispatch-quick-stock`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: QUICK_STOCK_KH01_PRODUCT_ID,
          quantity: Math.max(1, Number(order.tier_qty) || 1),
        }),
      });
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
        detail?: string | Record<string, unknown>;
        success?: boolean;
        message?: string;
        error?: string;
        meta_livraison_code?: string | null;
        tracking_number?: string | null;
        code_envoi?: string | null;
      };
      const body = raw as AdminOrder & typeof raw;
      if (!res.ok || body.success === false) {
        const map: Record<string, string> = {
          quick_livraison_not_configured: "أضف مفتاح Quick Livraison في الخادم أولاً.",
          quick_district_not_mapped: "هذه المدينة غير مربوطة بـ Quick Livraison. زامن قائمة المدن أولاً.",
          quick_product_id_missing: "أضف معرف المنتج في كويك من إدارة المنتجات قبل الإرسال من المخزون.",
          product_sku_missing: "أضف كود المنتج (SKU) في إدارة المنتجات قبل الإرسال من المخزون.",
          confirmation_details_required: "كمّل معلومات التوصيل قبل الشحن.",
          cannot_ship_cancelled: "لا يمكن شحن طلبية ملغاة.",
          order_not_found: "الطلبية غير موجودة.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
          quick_stock_no_tracking: "Quick Livraison لم تُرجع كود التتبع.",
        };
        throw new Error(
          body.message ||
            body.error ||
            (typeof body.detail === "object" && body.detail
              ? JSON.stringify(body.detail)
              : map[String(body.detail || "")] || String(body.detail || "")) ||
            "تعذر تسجيل الطلب في مخزون Quick.",
        );
      }
      const tracking = String(body.meta_livraison_code || body.code_envoi || body.tracking_number || "").trim();
      setOrders((list) =>
        list.map((row) =>
          row.order_id === order.order_id
            ? {
                ...row,
                ...body,
                carrier: "quick_livraison",
                meta_livraison_code: tracking || row.meta_livraison_code,
                tracking_number: tracking || row.tracking_number,
                status: tracking ? "shipped" : row.status,
                proxied_status: undefined,
                target_url: undefined,
                success: undefined,
              }
            : row,
        ),
      );
      setNoticeKind("ok");
      setNotice(tracking ? `تم إرسال KH01 من مخزون Quick — ${tracking}` : "تم إرسال KH01 من مخزون Quick");
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الطلب في مخزون Quick.");
    } finally {
      setShippingId(null);
    }
  }

  function toggleSelected(orderId: string, on: boolean) {
    setSelectedIds((prev) => {
      if (on) return prev.includes(orderId) ? prev : [...prev, orderId];
      return prev.filter((id) => id !== orderId);
    });
  }

  function togglePageSelection(on: boolean) {
    const pageIds = pageRows.map((row) => row.order_id);
    setSelectedIds((prev) => {
      if (on) return [...new Set([...prev, ...pageIds])];
      const drop = new Set(pageIds);
      return prev.filter((id) => !drop.has(id));
    });
  }

  async function readError(res: Response) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
    const map: Record<string, string> = {
      meta_livraison_not_configured: "أضف مفاتيح Meta Livraison في الخادم أولاً.",
      order_ids_required: "حدّد طلبيات أولاً.",
      no_labels: "ما كايناش بوالص للطلبيات المحددة.",
      order_not_confirmed: "كاين طلبيات ما تزادش تأكيدها.",
      not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
    };
    return map[String(body.detail || "")] || body.message || body.detail || "تعذر تنفيذ العملية.";
  }

  async function openBulkFile(path: string, accept: string, busy: "labels" | "manifest") {
    if (!selectedIds.length || bulkBusy) return;
    setBulkBusy(busy);
    setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: accept, "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedIds }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        const link = document.createElement("a");
        link.href = url;
        link.download = busy === "labels" ? "chifaglow-labels.pdf" : "chifaglow-manifest.html";
        link.click();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تنفيذ العملية.");
    } finally {
      setBulkBusy(null);
    }
  }

  async function bulkDispatch() {
    if (!selectedIds.length || bulkBusy) return;
    setBulkBusy("dispatch");
    setError("");
    try {
      const res = await adminFetch("/api/admin/orders/bulk-livraison", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedIds, carrier: dispatchCarrier }),
      }, 120000);
      const body = (await res.json().catch(() => ({}))) as {
        success_count?: number;
        failed_count?: number;
        detail?: string;
        message?: string;
        results?: Array<{ error?: string; success?: boolean }>;
      };
      if (!res.ok) throw new Error(await (async () => {
        const map: Record<string, string> = {
          meta_livraison_not_configured: "أضف مفاتيح Meta Livraison في الخادم أولاً.",
          quick_livraison_not_configured: "أضف مفتاح Quick Livraison في الخادم أولاً.",
          force_log_not_implemented: "Force Log غير مفعّل بعد.",
          order_ids_required: "حدّد طلبيات أولاً.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
        };
        return map[String(body.detail || "")] || serverErrorMessage(res.status, body.message || body.detail, "تعذر الإرسال الجماعي.");
      })());
      const ok = Number(body.success_count || 0);
      const fail = Number(body.failed_count || 0);
      const firstFail = (body.results || []).find((row) => !row.success)?.error;
      setNoticeKind(fail ? "warn" : "ok");
      setNotice(`تم إرسال ${ok} طلبية إلى ${carrierLabel(dispatchCarrier)}${fail ? ` — فشل ${fail}${firstFail ? ` (${firstFail})` : ""}` : ""}.`);
      setBulkConfirm(false);
      await load();
      await refreshStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر الإرسال الجماعي.";
      setError(msg);
      setNoticeKind("warn");
      setNotice(msg);
    } finally {
      setBulkBusy(null);
    }
  }

  async function syncTracking() {
    if (syncingTracking) return;
    setSyncingTracking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders/sync-tracking", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => ({}))) as {
        updated_count?: number;
        total_checked?: number;
        detail?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        const map: Record<string, string> = {
          meta_livraison_not_configured: "أضف مفاتيح Meta Livraison في الخادم أولاً.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
        };
        throw new Error(map[String(body.detail || body.error || "")] || body.message || "تعذر تحديث التتبع.");
      }
      const n = Number(body.updated_count || 0);
      setNoticeKind("ok");
      setNotice(`تم تحديث حالات الشحن بنجاح (${n} طلبية تم تحديثها)`);
      await load();
    } catch (err) {
      setNoticeKind("warn");
      setNotice(err instanceof Error ? err.message : "تعذر تحديث التتبع. أعد المحاولة.");
    } finally {
      setSyncingTracking(false);
    }
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
  const hideLogisticsNums = hideAll || hideLogistics;
  const hideCityNums = hideAll || hideCity;
  const hideMapNums = hideAll || hideMap;
  const hideTableNums = hideAll;

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
      const matchesUndispatched =
        !undispatchedOnly || (!hasTracking(order) && (order.status === "confirmed" || order.status === "new"));
      return matchesSearch && matchesStatus && matchesUndispatched;
    });
  }, [orders, q, status, undispatchedOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, filtered.length);
  const pageRows = filtered.slice(start, end);
  const selectedOnPage = pageRows.filter((row) => selectedIds.includes(row.order_id)).length;
  const allPageSelected = pageRows.length > 0 && selectedOnPage === pageRows.length;

  useEffect(() => {
    const alive = new Set(orders.map((order) => order.order_id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => alive.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [orders]);

  useEffect(() => {
    const box = selectAllRef.current;
    if (!box) return;
    box.indeterminate = selectedOnPage > 0 && !allPageSelected;
  }, [selectedOnPage, allPageSelected]);

  function orderRowProps(order: AdminOrder) {
    return {
      order,
      selected: selectedIds.includes(order.order_id),
      onToggleSelected: (on: boolean) => toggleSelected(order.order_id, on),
      shipping: shippingId === order.order_id,
      duplicating: duplicatingId === order.order_id,
      saving: savingId === order.order_id,
      copiedId,
      copiedTrackingId,
      hideNums: hideTableNums,
      statusOptions: STATUS_OPTIONS,
      onCopyPhone: () => void copyPhone(order),
      onCopyTracking: () => void copyTracking(order),
      onStatusSelect: (next: AdminStatus, el: HTMLSelectElement) => onStatusSelect(order, next, el),
      onSendCarrier: (row: AdminOrder, carrier: AdminCarrier) => void sendToLivraison(row, carrier),
      onSendQuickStock: (row: AdminOrder) => void sendQuickStock(row),
      onPrint: printShipping,
      onEdit: setCompleting,
      onView: (row: AdminOrder) => setViewingId(row.order_id),
      onDuplicate: (row: AdminOrder) => void duplicateOrder(row),
      onDelete: setDeleteTarget,
    };
  }
  const viewing = useMemo(() => orders.find((o) => o.order_id === viewingId) ?? null, [orders, viewingId]);
  const printing = useMemo(() => orders.find((o) => o.order_id === printingId) ?? null, [orders, printingId]);
  const printableSelected = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.order_id) && hasTracking(order)),
    [orders, selectedIds],
  );
  const labelsLocked = selectedIds.length > 0 && printableSelected.length === 0;

  useEffect(() => {
    setPage(1);
  }, [q, status, perPage]);

  const alertBellShared = {
    orders,
    shippingId,
    onSendCarrier: (row: AdminOrder, carrier: AdminCarrier) => {
      void sendToLivraison(row, carrier);
    },
    onShowOverdue: () => {
      setUndispatchedOnly(true);
      setStatus("confirmed");
      setPage(1);
    },
    onNotice: (message: string, kind?: "ok" | "warn") => {
      setNoticeKind(kind || "ok");
      setNotice(message);
    },
    onSummary: setAlerts,
  };

  return (
    <>
    <SplashScreen isLoading={loading} />
    <div className="admin-print-root no-select flex min-h-screen select-none flex-col justify-between bg-cream text-royal antialiased transition-colors duration-300 dark:bg-brandDark dark:text-slate-100 print:hidden">
      <AddOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(order) => {
          setOrders((list) => [order, ...list]);
          setPage(1);
          void refreshStats();
        }}
      />
      <CityTarifsModal open={tarifsOpen} onClose={() => setTarifsOpen(false)} />
      <AddProductModal
        open={productsOpen}
        onClose={() => setProductsOpen(false)}
        onNotice={(message, kind) => {
          setNoticeKind(kind || "ok");
          setNotice(message);
        }}
      />
      {prefsOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          role="presentation"
          onClick={() => setPrefsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prefs-modal-title"
            className="relative w-full max-w-sm rounded-3xl border-2 border-gold/40 bg-[#0F1E33] p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p id="prefs-modal-title" className="text-sm font-black">
                تخصيص الواجهة
              </p>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setPrefsOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-[12px] font-semibold text-slate-400">أقسام اللوحة</p>
            <div className="space-y-1">
              {SECTION_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="switch"
                  aria-checked={prefs[item.key]}
                  onClick={() => toggleSection(item.key)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-right transition hover:bg-white/5"
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
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-right transition hover:bg-white/5"
              >
                <span className="inline-flex items-center gap-2 text-[13px] font-bold text-white">
                  <Moon className="h-3.5 w-3.5 text-slate-300" />
                  الوضع الداكن
                </span>
                <IosSwitch checked={darkMode} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <QuickWhatsAppOrderModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onCreated={(order) => {
          setOrders((list) => [order, ...list]);
          setPage(1);
          if (status !== "all" && status !== "new") setStatus("all");
          setNoticeKind("ok");
          setNotice("تم إنشاء طلبية جديدة بنجاح من هذه الطلبية");
          void refreshStats();
        }}
        onWarning={(message) => {
          setNoticeKind("warn");
          setNotice(message);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="relative my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-500/30 dark:bg-cardDark">
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

      <header
        dir="ltr"
        className="sticky top-0 z-40 w-full overflow-visible border-b border-slate-200/80 bg-white/95 py-2.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0d1527]/95"
      >
        <div dir="rtl" className={cn(DASHBOARD_SHELL, "flex items-center justify-between gap-2 md:hidden")}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-sm font-bold text-amber-500">
              C
            </div>
            <span className="truncate text-sm font-bold text-royal dark:text-white">CHIFA GLOW</span>
          </div>

          <div className="relative z-30 flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="إضافة سريعة واتساب"
              title="إضافة سريعة واتساب"
              onClick={() => setQuickOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-500 transition hover:bg-emerald-500/30"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </button>
            <OrderAlertsBell
              variant="icon"
              poll={false}
              panel="sheet"
              className="h-10 w-10 border-amber-500/40 bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30"
              {...alertBellShared}
            />
            <button
              type="button"
              aria-label="القائمة"
              title="القائمة"
              aria-expanded={menuOpen}
              aria-controls="mobile-admin-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-600 transition hover:text-royal dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div dir="rtl" className={cn(DASHBOARD_SHELL, "hidden md:flex md:flex-wrap md:items-center md:gap-3")}>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/60 bg-amber-500/15 text-sm font-bold text-amber-500">
              C
            </div>
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-black tracking-wider text-royal dark:text-white">CHIFA GLOW</span>
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400/90">
                لوحة إدارة المبيعات{username ? ` · ${username}` : ""}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2.5 sm:gap-3">
            <div className="relative z-30 flex flex-wrap items-center gap-2.5">
              <OrderAlertsBell variant="toolbar" {...alertBellShared} />
              <button
                type="button"
                aria-label="إضافة سريعة واتساب"
                onClick={() => setQuickOpen(true)}
                className={NAV_WHATSAPP}
              >
                <WhatsAppIcon className="h-4 w-4" />
                إضافة سريعة واتساب
              </button>
              <button
                type="button"
                aria-label="إدارة المنتجات"
                onClick={() => setProductsOpen(true)}
                className={NAV_PRODUCTS}
              >
                <Package className="h-4 w-4" />
                إدارة المنتجات
              </button>
              <button
                type="button"
                aria-label="دليل الأسعار والمدن"
                onClick={() => setTarifsOpen(true)}
                className={NAV_TARIFS}
              >
                <Calculator className="h-4 w-4" />
                المدن
              </button>
              <button type="button" aria-label="إضافة طلب" onClick={() => setModalOpen(true)} className={NAV_PRIMARY}>
                <Plus className="h-4 w-4" />
                إضافة طلب
              </button>
            </div>

            <span className={NAV_DIVIDER} aria-hidden />

            <div className="relative z-20 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                aria-label="تخصيص الواجهة"
                aria-haspopup="dialog"
                aria-expanded={prefsOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setPrefsOpen(true);
                }}
                className={NAV_PREFS}
              >
                <SlidersHorizontal className="h-4 w-4" />
                تخصيص الواجهة
              </button>
              <button
                type="button"
                aria-label={hideAll ? "إظهار كل الأرقام" : "إخفاء الأرقام"}
                onClick={() => setHideAll((v) => !v)}
                className={NAV_HIDE}
              >
                {hideAll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {hideAll ? "إظهار الأرقام" : "إخفاء الأرقام"}
              </button>
              <button
                type="button"
                aria-label="تصدير Excel"
                onClick={() => downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered))}
                className={NAV_GHOST}
              >
                <FileSpreadsheet className="h-4 w-4" />
                تصدير Excel
              </button>
            </div>

            <span className={NAV_DIVIDER} aria-hidden />

            <div className="relative z-10 flex shrink-0 items-center gap-2">
              <ThemeToggle className={cn(NAV_ICON, "hover:scale-100")} />
              <button type="button" aria-label="تسجيل الخروج" onClick={() => void logout()} className={NAV_LOGOUT}>
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end md:hidden" dir="ltr" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="إغلاق القائمة"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-admin-menu"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            className="relative z-10 flex h-full w-64 flex-col gap-2 border-l border-slate-800 bg-[#0d1527] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span id="mobile-menu-title" className="text-sm font-bold text-white">
                القائمة السريعة
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg bg-amber-500 p-2.5 text-right text-xs font-bold text-slate-950"
            >
              <span>إضافة طلب</span>
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setProductsOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-purple-500/30 p-2.5 text-right text-xs text-purple-300"
            >
              <span>إدارة المنتجات</span>
              <Package className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPrefsOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-indigo-500/30 p-2.5 text-right text-xs text-indigo-300"
            >
              <span>تخصيص الواجهة</span>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setHideAll((v) => !v);
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-cyan-500/30 p-2.5 text-right text-xs text-cyan-300"
            >
              <span>{hideAll ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
              {hideAll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTarifsOpen(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-teal-500/30 p-2.5 text-right text-xs text-teal-300"
            >
              <span>دليل الأسعار والمدن</span>
              <Calculator className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered));
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-slate-700 p-2.5 text-right text-xs text-slate-300"
            >
              <span>تصدير Excel</span>
              <FileSpreadsheet className="h-4 w-4" />
            </button>

            <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 text-xs text-red-400"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 text-slate-400 hover:text-white"
                aria-label="تبديل الوضع"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className={cn(DASHBOARD_SHELL, "flex-grow space-y-6 py-6", selectedIds.length ? "pb-28" : "")}>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {prefs.logistics ? (
          <LogisticsKpiCards
            data={logistics}
            hidden={hideLogisticsNums}
            onToggleNumbers={() => setHideLogistics((v) => !v)}
          />
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
              regions={logistics.regions}
              hideNumbers={hideMapNums}
              onToggleNumbers={() => setHideMap((v) => !v)}
              className={prefs.cities ? "lg:col-span-5" : "lg:col-span-12"}
            />
          ) : null}
        </div>
        ) : null}

        {prefs.orders ? (
        <>
        <OverdueOrdersBanner
          count={alerts.overdue_orders_count}
          onShow={() => {
            setUndispatchedOnly(true);
            setStatus("confirmed");
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-gold/20 bg-white p-4 shadow-luxury dark:bg-cardDark lg:flex-row lg:items-center">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-royal/40 dark:text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو المدينة..."
              className="h-11 w-full rounded-xl border border-gold/30 bg-cream py-2.5 pl-4 pr-10 text-sm font-medium text-royal placeholder-royal/40 shadow-sm transition focus:border-gold focus:outline-none dark:border-white/15 dark:bg-brandDark dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
            <div className="flex items-center gap-1.5 text-sm font-bold text-royal/70 dark:text-slate-300">
              <span>عرض:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className={FILTER_CONTROL}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            {undispatchedOnly ? (
              <button
                type="button"
                onClick={() => setUndispatchedOnly(false)}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl border border-orange-400/40 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-200"
              >
                غير المرسلة فقط
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <select
              value={status}
              onChange={(e) => {
                setUndispatchedOnly(false);
                setStatus(e.target.value);
              }}
              className={FILTER_CONTROL}
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
              disabled={syncingTracking}
              onClick={() => void syncTracking()}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-bold text-royal transition hover:bg-gold/20 disabled:opacity-60 dark:text-gold"
            >
              <RefreshCw className={cn("h-4 w-4", syncingTracking && "animate-spin")} />
              تحديث التتبع
            </button>
            <button
              type="button"
              onClick={() => downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered))}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 px-4 py-2.5 text-sm font-bold text-emeraldCustom lg:hidden"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-luxury dark:bg-cardDark">
          <div className="space-y-3 p-3 md:hidden">
            {loading ? (
              <div className="p-16 text-center text-royal/60 dark:text-slate-400">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gold" />
                جاري التحميل…
              </div>
            ) : pageRows.length === 0 ? (
              <div className="p-16 text-center font-bold text-royal/50 dark:text-slate-400">لا توجد طلبات مطابقة.</div>
            ) : (
              pageRows.map((order) => (
                <OrderMobileCard key={order.order_id} {...orderRowProps(order)} />
              ))
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table id="orders-table" className="w-full text-right text-sm font-medium text-royal dark:text-slate-200">
              <thead className="border-b border-gold/10 bg-cream font-bold text-royal/70 dark:bg-brandDark dark:text-slate-400">
                <tr>
                  <th className="p-4 text-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={(e) => togglePageSelection(e.target.checked)}
                      className="h-4 w-4 accent-gold"
                      title="تحديد كل طلبيات هذه الصفحة"
                      aria-label="تحديد كل طلبيات هذه الصفحة"
                    />
                  </th>
                  <th className="p-4">إجراءات</th>
                  <th className="p-4">الرقم المرجعي</th>
                  <th className="p-4">الزبون</th>
                  <th className="p-4">المدينة</th>
                  <th className="p-4">الهاتف والتواصل</th>
                  <th className="p-4">المنتج المختارة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4 text-center">حالة الطلبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-16 text-center text-royal/60 dark:text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gold" />
                      جاري التحميل…
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-16 text-center font-bold text-royal/50 dark:text-slate-400">
                      لا توجد طلبات مطابقة.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((order) => <OrderDesktopRow key={order.order_id} {...orderRowProps(order)} />)
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-gold/10 bg-cream/30 p-4 text-sm dark:bg-brandDark/30 sm:flex-row">
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

        {prefs.observatory ? <ViewsObservatory hideAll={hideAll} /> : null}
      </main>

      <footer className="border-t border-gold/20 bg-white py-4 text-center text-sm text-royal/60 transition-colors dark:bg-cardDark dark:text-slate-500">
        <div className={DASHBOARD_SHELL}>© 2026 Chifaglow Admin Panel — نظام إدارة وتصنيف الطلبيات</div>
      </footer>
    </div>
      {printing ? <ShippingLabel order={printing} onClose={closePrint} /> : null}
      <BulkActionBar
        count={selectedIds.length}
        busy={bulkBusy}
        confirmOpen={bulkConfirm}
        labelsLocked={labelsLocked}
        labelsHint={
          labelsLocked
            ? LABEL_PRINT_HINT
            : printableSelected.length < selectedIds.length
              ? `سيتم طباعة ${printableSelected.length} بوليصة فقط — الطلبيات بدون تتبع ستُتجاهل.`
              : "طباعة البوالص الحرارية A6"
        }
        carrier={dispatchCarrier}
        onCarrierChange={setDispatchCarrier}
        onConfirmOpen={() => setBulkConfirm(true)}
        onConfirmClose={() => setBulkConfirm(false)}
        onDispatch={() => void bulkDispatch()}
        onLabels={() => void openBulkFile("/api/admin/orders/bulk-labels-pdf", "application/pdf", "labels")}
        onManifest={() => void openBulkFile("/api/admin/orders/manifest", "text/html", "manifest")}
        onClear={() => setSelectedIds([])}
      />
      {notice ? (
        <div
          role="status"
          className={cn(
            "fixed left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl",
            selectedIds.length ? "bottom-24" : "bottom-6",
            noticeKind === "warn"
              ? "border-amber-400/40 bg-[#0b1322] text-amber-200"
              : "border-emerald-400/40 bg-[#0b1322] text-emerald-200",
          )}
        >
        {noticeKind === "warn" ? (
          <CircleAlert className="h-4 w-4 shrink-0 text-amber-400" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        )}
        {notice}
      </div>
    ) : null}
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
