"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
  PieChart,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  Moon,
  X,
} from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import SplashScreen from "@/components/SplashScreen";
import { AddOrderModal } from "@/components/admin/AddOrderModal";
import { AdminDoughnut } from "@/components/admin/AdminDoughnut";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { CompleteDetailsModal } from "@/components/admin/CompleteDetailsModal";
import { IosSwitch } from "@/components/admin/IosSwitch";
import { MoroccoMap } from "@/components/admin/MoroccoMap";
import { OrderDesktopRow, OrderMobileCard } from "@/components/admin/OrderRow";
import { OrderTimelineModal } from "@/components/admin/OrderTimelineModal";
import { QuickWhatsAppOrderModal } from "@/components/admin/QuickWhatsAppOrderModal";
import { PushToggle } from "@/components/admin/PushToggle";
import { ViewsObservatory } from "@/components/admin/ViewsObservatory";
import { ShippingLabel } from "@/components/admin/ShippingLabel";
import {
  ADMIN_STATUSES,
  canTransitionStatus,
  cloneOrderCreatePayload,
  copyText,
  copyablePhone,
  downloadCsv,
  hasCompleteConfirmDetails,
  needsConfirmModal,
  ordersToCsv,
  pct,
  type AdminOrder,
  type AdminStats,
  type AdminStatus,
} from "@/lib/admin";
import { buildRegionStats, CITY_CHART_COLORS } from "@/lib/admin-geo";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
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
type SectionPrefs = { overview: boolean; cities: boolean; map: boolean; orders: boolean; observatory: boolean };
const DEFAULT_PREFS: SectionPrefs = { overview: true, cities: true, map: true, orders: true, observatory: true };

const SECTION_ITEMS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "overview", label: "نظرة عامة على الطلبات" },
  { key: "cities", label: "الطرود حسب المدن" },
  { key: "map", label: "خريطة المغرب" },
  { key: "orders", label: "جدول الطلبات" },
  { key: "observatory", label: "إظهار/إخفاء مرصد المشاهدات والأداء" },
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
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"ok" | "warn">("ok");
  useLockBodyScroll(Boolean(deleteTarget));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hideAll, setHideAll] = useState(false);
  const [hideOverview, setHideOverview] = useState(false);
  const [hideCity, setHideCity] = useState(false);
  const [hideMap, setHideMap] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [prefs, setPrefs] = useState<SectionPrefs>(DEFAULT_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

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
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (prefsRef.current && !prefsRef.current.contains(t)) setPrefsOpen(false);
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPrefsOpen(false);
        setMenuOpen(false);
      }
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
    if (next === order.status) return;
    if (!canTransitionStatus(order.status, next)) {
      selectEl.value = order.status;
      setError("لا يمكن القفز في حالة الطلب. اتبع المسار: جديدة → تم التأكيد → قيد الشحن → تم التسليم.");
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
      const res = await fetch(`/api/admin/orders/${order.order_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          invalid_status_transition: "لا يمكن القفز في حالة الطلب. اتبع المسار بالترتيب.",
          confirmation_details_required: "لازم تكمل معلومات التوصيل قبل التأكيد.",
          invalid_status: "حالة الطلب غير صالحة.",
        };
        throw new Error(map[body.detail || ""] || "fail");
      }
      const updated = (await res.json()) as AdminOrder;
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? updated : o)));
      await refreshStats();
    } catch (err) {
      setOrders((list) => list.map((o) => (o.order_id === order.order_id ? { ...o, status: prev } : o)));
      setError(err instanceof Error && err.message !== "fail" ? err.message : "فشل تحديث الحالة. أعد المحاولة.");
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
    const ticket = (order.meta_livraison_ticket_url || "").trim();
    if (ticket) {
      window.open(ticket, "_blank", "noopener,noreferrer");
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

  async function sendToMetaLivraison(order: AdminOrder) {
    if (shippingId) return;
    if (order.meta_livraison_code) {
      setNoticeKind("ok");
      setNotice(`الطلب مرسل مسبقاً إلى Meta Livraison: ${order.meta_livraison_code}`);
      return;
    }
    if (order.status === "cancelled") {
      setError("لا يمكن شحن طلبية ملغاة.");
      return;
    }
    if (!hasCompleteConfirmDetails(order)) {
      setCompleting(order);
      setError("كمّل عنوان التوصيل قبل إرسال الطرد إلى Meta Livraison.");
      return;
    }
    setShippingId(order.order_id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.order_id}/livraison`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
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
          confirmation_details_required: "كمّل معلومات التوصيل قبل الشحن.",
          cannot_ship_cancelled: "لا يمكن شحن طلبية ملغاة.",
          order_not_found: "الطلبية غير موجودة.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
        };
        throw new Error(
          body.message ||
            body.error ||
            (typeof body.detail === "object" && body.detail ? JSON.stringify(body.detail) : body.detail) ||
            map[String(body.detail || "")] ||
            "تعذر إرسال الطرد إلى Meta Livraison.",
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
      setNotice(body.meta_livraison_code ? `تم إرسال الطرد. كود التتبع: ${body.meta_livraison_code}` : "تم إرسال الطرد إلى Meta Livraison.");
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطرد إلى Meta Livraison.");
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
      no_labels: "ما كايناش بوالص Meta للطلبيات المحددة.",
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
      const res = await fetch("/api/admin/orders/bulk-livraison", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedIds }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        success_count?: number;
        failed_count?: number;
        detail?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(await (async () => {
        const map: Record<string, string> = {
          meta_livraison_not_configured: "أضف مفاتيح Meta Livraison في الخادم أولاً.",
          order_ids_required: "حدّد طلبيات أولاً.",
          not_authenticated: "جلسة الأدمن غير صالحة. أعد تسجيل الدخول.",
        };
        return map[String(body.detail || "")] || body.message || body.detail || "تعذر الإرسال الجماعي.";
      })());
      const ok = Number(body.success_count || 0);
      const fail = Number(body.failed_count || 0);
      setNoticeKind(fail ? "warn" : "ok");
      setNotice(`تم إرسال ${ok} طلبية إلى Meta Livraison${fail ? ` — فشل ${fail}` : ""}.`);
      setBulkConfirm(false);
      await load();
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الإرسال الجماعي.");
    } finally {
      setBulkBusy(null);
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
      onSendMeta: (row: AdminOrder) => void sendToMetaLivraison(row),
      onPrint: printShipping,
      onEdit: setCompleting,
      onView: (row: AdminOrder) => setViewingId(row.order_id),
      onDuplicate: (row: AdminOrder) => void duplicateOrder(row),
      onDelete: setDeleteTarget,
    };
  }
  const viewing = useMemo(() => orders.find((o) => o.order_id === viewingId) ?? null, [orders, viewingId]);
  const printing = useMemo(() => orders.find((o) => o.order_id === printingId) ?? null, [orders, printingId]);

  useEffect(() => {
    setPage(1);
  }, [q, status, perPage]);

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

      <header className="sticky top-0 z-40 border-b border-gold/20 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-md dark:bg-cardDark/95 md:px-4 md:py-3.5">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-2">
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

          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <button
              type="button"
              aria-label="إضافة سريعة من الواتساب"
              onClick={() => {
                setMenuOpen(false);
                setQuickOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 text-emeraldCustom shadow-sm transition hover:bg-emeraldCustom hover:text-white active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={menuOpen ? "إغلاق القائمة" : "قائمة الإجراءات"}
                aria-expanded={menuOpen}
                onClick={() => {
                  setPrefsOpen(false);
                  setMenuOpen((v) => !v);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold-600 transition hover:bg-gold hover:text-royal dark:text-gold"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-11 z-50 max-h-[min(80vh,32rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-gold/20 bg-[#0F1E33] p-2 text-white shadow-2xl"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4 text-gold" />
                    <span className="text-[13px] font-bold">إضافة طلبية يدوية</span>
                  </button>
                  <PushToggle
                    variant="menu"
                    onNotice={(message, kind) => {
                      setNoticeKind(kind || "ok");
                      setNotice(message);
                    }}
                  />
                  <div className="my-1 border-t border-white/10 px-3 py-2">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-black text-gold">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      تخصيص الواجهة
                    </p>
                    <div className="space-y-0.5">
                      {SECTION_ITEMS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          role="switch"
                          aria-checked={prefs[item.key]}
                          onClick={() => toggleSection(item.key)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-right transition hover:bg-white/5"
                        >
                          <span className="text-[12px] font-bold text-white">{item.label}</span>
                          <IosSwitch checked={prefs[item.key]} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setHideAll((v) => !v)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition hover:bg-white/5"
                  >
                    {hideAll ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-gold" />}
                    <span className="text-[13px] font-bold">{hideAll ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleDarkMode}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition hover:bg-white/5"
                  >
                    {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gold" />}
                    <span className="text-[13px] font-bold">{darkMode ? "الوضع النهاري" : "الوضع الليلي"}</span>
                  </button>
                  <div className="mt-1 border-t border-white/10 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-[13px] font-bold">تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 md:flex md:gap-3">
            <button
              type="button"
              aria-label="إضافة طلب"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gold px-3.5 py-2 text-royal shadow-sm transition hover:bg-gold-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs font-black">إضافة طلب</span>
            </button>
            <button
              type="button"
              aria-label="إضافة سريعة من الواتساب"
              onClick={() => setQuickOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 px-3.5 py-2 text-emeraldCustom shadow-sm transition hover:bg-emeraldCustom hover:text-white active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="text-xs font-black">إضافة سريعة من الواتساب</span>
            </button>
            <PushToggle
              onNotice={(message, kind) => {
                setNoticeKind(kind || "ok");
                setNotice(message);
              }}
            />
            <div className="relative" ref={prefsRef}>
              <button
                type="button"
                aria-label="تخصيص الواجهة"
                aria-expanded={prefsOpen}
                onClick={() => setPrefsOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-gold-600 transition hover:bg-gold hover:text-royal dark:text-gold"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">تخصيص الواجهة</span>
              </button>
              {prefsOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-11 z-50 w-80 rounded-2xl border border-gold/20 bg-[#0F1E33] p-4 text-white shadow-2xl dark:bg-[#0F1E33]"
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
              className="flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-gold-600 transition hover:bg-gold hover:text-royal dark:text-gold"
            >
              {hideAll ? <Eye className="h-3.5 w-3.5 text-emeraldCustom" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="text-xs font-bold">{hideAll ? "إظهار كل الأرقام" : "إخفاء الأرقام"}</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => downloadCsv("orders-chifaglow.csv", ordersToCsv(filtered))}
              className="flex items-center gap-1.5 rounded-xl border border-emeraldCustom/30 bg-emeraldCustom/10 px-3 py-2 text-xs font-bold text-emeraldCustom transition hover:bg-emeraldCustom hover:text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>تصدير CSV / Excel</span>
            </button>
            <button
              type="button"
              aria-label="خروج"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-xl border border-moroccoRed/30 bg-moroccoRed/10 px-3.5 py-2 text-moroccoRed transition hover:bg-moroccoRed hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-7xl flex-grow space-y-6 px-4 py-8", selectedIds.length ? "pb-28" : "")}>
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
            <table id="orders-table" className="w-full text-right text-xs text-royal dark:text-slate-200">
              <thead className="border-b border-gold/10 bg-cream font-bold text-royal/70 dark:bg-brandDark dark:text-slate-400">
                <tr>
                  <th className="p-3.5 text-center">
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

        {prefs.observatory ? <ViewsObservatory hideAll={hideAll} /> : null}
      </main>

      <footer className="border-t border-gold/20 bg-white px-4 py-4 text-center text-xs text-royal/60 transition-colors dark:bg-cardDark dark:text-slate-500">
        © 2026 Chifaglow Admin Panel — نظام إدارة وتصنيف الطلبيات
      </footer>
    </div>
    {printing ? <ShippingLabel order={printing} onClose={closePrint} /> : null}
      <BulkActionBar
        count={selectedIds.length}
        busy={bulkBusy}
        confirmOpen={bulkConfirm}
        onConfirmOpen={() => setBulkConfirm(true)}
        onConfirmClose={() => setBulkConfirm(false)}
        onDispatch={() => void bulkDispatch()}
        onLabels={() => void openBulkFile("/api/admin/orders/bulk-labels", "application/pdf", "labels")}
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
