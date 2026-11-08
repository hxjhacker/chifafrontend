"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type MutableRefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  Scale,
  SlidersHorizontal,
  Sun,
  X,
} from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import { OrderAlertsBell } from "@/components/admin/OrderAlertsBell";
import { DashboardSoundToggle } from "@/components/admin/DashboardSoundEngine";
import { TeamMembersMenu } from "@/components/admin/TeamMembersMenu";
import {
  AccountPopover,
  DEFAULT_PROFILE_EMAIL,
  DEFAULT_STORE_NAME,
  EditProfileModal,
  STORE_NAME_KEY,
  storeInitials,
  type PasswordUpdate,
} from "@/components/admin/EditProfileModal";
import { notifyDashboard } from "@/components/admin/DashboardAlert";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { AdminCarrier, AdminOrder } from "@/lib/admin";
import { DASHBOARD_HOME, DASHBOARD_LOGIN, goAdmin } from "@/lib/admin-paths";
import type { UndispatchedSummary } from "@/lib/order-alerts";
import { applyTheme, resolveIsDark, THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/safe-storage";

const ICON_BTN =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition active:scale-95";
const DESKTOP_CHIP =
  "shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition";

export const DASHBOARD_NAV_EVENT = "cg-dashboard-nav";
export const DASHBOARD_NAV_PENDING_KEY = "cg_dashboard_nav_pending";

export type DashboardNavDetail =
  | {
      action:
        | "add-order"
        | "products"
        | "received"
        | "prefs"
        | "export-csv"
        | "toggle-hide"
        | "export-metrics"
        | "quick-whatsapp"
        | "show-overdue";
    }
  | { action: "send-carrier"; orderId: string; carrier: AdminCarrier }
  | { action: "summary"; summary: UndispatchedSummary };

type NavSnapshot = {
  orders: AdminOrder[];
  shippingId: string | null;
  hideNumbers: boolean;
};

type NavContextValue = {
  bridge: MutableRefObject<NavSnapshot | null>;
  rev: number;
  bump: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);
let latestNavSummary: UndispatchedSummary | null = null;

export function takeLatestNavSummary() {
  return latestNavSummary;
}

export function DashboardNavProvider({ children }: { children: ReactNode }) {
  const bridge = useRef<NavSnapshot | null>(null);
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((value) => value + 1), []);
  const value = useMemo(() => ({ bridge, rev, bump }), [rev, bump]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useBindDashboardNav(snapshot: NavSnapshot) {
  const ctx = useContext(NavContext);
  const bridge = ctx?.bridge;
  const bump = ctx?.bump;
  const ref = useRef(snapshot);
  ref.current = snapshot;
  useEffect(() => {
    if (!bridge || !bump) return;
    bridge.current = ref.current;
    bump();
    return () => {
      bridge.current = null;
      bump();
    };
  }, [bridge, bump]);
  useEffect(() => {
    if (!bridge || !bump) return;
    bridge.current = ref.current;
    bump();
  }, [bridge, bump, snapshot.orders, snapshot.shippingId, snapshot.hideNumbers]);
}

function emitNav(detail: DashboardNavDetail, navigateIfUnhandled = true) {
  if (detail.action === "summary") latestNavSummary = detail.summary;
  const event = new CustomEvent<DashboardNavDetail>(DASHBOARD_NAV_EVENT, { cancelable: true, detail });
  window.dispatchEvent(event);
  if (!navigateIfUnhandled || event.defaultPrevented) return;
  try {
    sessionStorage.setItem(DASHBOARD_NAV_PENDING_KEY, JSON.stringify(detail));
  } catch {
    /* Private browsing can block session storage. */
  }
  goAdmin(DASHBOARD_HOME);
}

export function DashboardHeader() {
  const pathname = usePathname();
  const ctx = useContext(NavContext);
  const snapshot = ctx?.bridge.current;
  void ctx?.rev;

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeName, setStoreName] = useState(DEFAULT_STORE_NAME);
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const actionsScrollRef = useHorizontalDragScroll<HTMLDivElement>();

  const normalizedPath = pathname ? pathname.replace(/\/+$/, "") || "/" : DASHBOARD_HOME;
  const hidden = normalizedPath === DASHBOARD_LOGIN || normalizedPath === "/login";
  const hideNumbers = Boolean(snapshot?.hideNumbers);

  useLockBodyScroll(menuOpen || profileOpen);

  useEffect(() => {
    setStoreName(readStorage(STORE_NAME_KEY)?.trim() || DEFAULT_STORE_NAME);
    setDarkMode(resolveIsDark());
    void fetch("/api/admin/me", { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { username?: string } | null) => setUsername(body?.username || ""))
      .catch(() => undefined);
    function onTheme(event: Event) {
      setDarkMode(Boolean((event as CustomEvent<{ dark: boolean }>).detail?.dark));
    }
    window.addEventListener("chifaglow-theme", onTheme);
    return () => window.removeEventListener("chifaglow-theme", onTheme);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setActionsOpen(false);
      setAccountOpen(false);
      setProfileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current?.contains(target) || mobileAccountRef.current?.contains(target)) return;
      setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [accountOpen]);

  useEffect(() => {
    if (actionsOpen) return;
    if (actionsScrollRef.current) actionsScrollRef.current.scrollLeft = 0;
  }, [actionsOpen, actionsScrollRef]);

  const reportSummary = useCallback((summary: UndispatchedSummary) => {
    emitNav({ action: "summary", summary }, false);
  }, []);
  const sendFromAlert = useCallback((order: AdminOrder, carrier: AdminCarrier) => {
    setMenuOpen(false);
    emitNav({ action: "send-carrier", orderId: order.order_id, carrier });
  }, []);
  const showOverdue = useCallback(() => {
    setMenuOpen(false);
    emitNav({ action: "show-overdue" });
  }, []);
  const reportNotice = useCallback((message: string, kind?: "ok" | "warn") => {
    notifyDashboard(message, kind);
  }, []);

  if (hidden) return null;

  const profileEmail = username.includes("@") ? username : DEFAULT_PROFILE_EMAIL;
  const initials = storeInitials(storeName);

  function toggleDarkMode() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    writeStorage(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDarkMode(next);
  }

  function openProfileEditor() {
    setAccountOpen(false);
    setMenuOpen(false);
    setProfileOpen(true);
  }

  async function saveProfile(name: string, password?: PasswordUpdate) {
    if (password) {
      const response = await fetch("/api/admin/account/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password),
      });
      const body = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
      if (!response.ok) throw new Error(body.message || body.detail || "تعذر تحديث كلمة المرور.");
      try {
        sessionStorage.setItem("cg_admin_login_notice", body.message || "تم تحديث كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً");
      } catch {
        /* ignore unavailable browser storage */
      }
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
      window.location.assign(DASHBOARD_LOGIN);
      return;
    }
    setStoreName(name);
    writeStorage(STORE_NAME_KEY, name);
    notifyDashboard("تم حفظ تعديلات الملف الشخصي.", "ok");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    goAdmin(DASHBOARD_LOGIN);
  }

  function run(action: DashboardNavDetail["action"]) {
    if (action === "send-carrier" || action === "summary") return;
    setMenuOpen(false);
    emitNav({ action });
  }

  const bell = {
    orders: snapshot?.orders ?? [],
    shippingId: snapshot?.shippingId ?? null,
    onSendCarrier: sendFromAlert,
    onShowOverdue: showOverdue,
    onNotice: reportNotice,
    onSummary: reportSummary,
  };

  return (
    <div className="print:hidden">
      <header dir="ltr" className="sticky top-0 z-40 w-full overflow-visible">
        <div dir="rtl" className="flex items-center justify-between border-b border-slate-800/80 bg-[#0b101b] px-3 py-2.5 select-none md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="القائمة"
              title="القائمة"
              aria-expanded={menuOpen}
              aria-controls="mobile-admin-menu"
              onClick={() => {
                setAccountOpen(false);
                setMenuOpen((value) => !value);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-[#111927] text-slate-300 shadow-sm transition hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="إضافة سريعة واتساب"
              title="إضافة سريعة واتساب"
              onClick={() => run("quick-whatsapp")}
              className={`${ICON_BTN} border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
            >
              <WhatsAppIcon className="h-4 w-4" />
            </button>
            <OrderAlertsBell
              variant="icon"
              poll
              emitOrderToasts={false}
              panel="sheet"
              className="h-10 w-10 border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
              {...bell}
            />
          </div>

          <div className="relative z-30 flex items-center gap-2" ref={mobileAccountRef}>
            <button
              type="button"
              aria-label="معلومات الحساب"
              title="معلومات الحساب"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
              className="group relative flex items-center justify-center transition focus:outline-none active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-600/70 bg-[#181615] text-sm font-extrabold tracking-wider text-amber-500 shadow-md shadow-amber-500/10 transition-all duration-200 group-hover:scale-105 group-hover:border-amber-500">
                {initials}
              </span>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b101b] bg-emerald-500" />
            </button>
            {accountOpen ? (
              <AccountPopover
                className="w-72 p-4"
                storeName={storeName}
                email={profileEmail}
                initials={initials}
                onOpenProfile={openProfileEditor}
              />
            ) : null}
            <TeamMembersMenu />
          </div>
        </div>

        <div dir="rtl" className="relative hidden w-full items-center justify-between gap-3 overflow-visible border-b border-slate-800/80 bg-[#0b101b] px-4 py-2.5 sm:px-6 md:flex lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ThemeToggle className={`${ICON_BTN} border-slate-800 bg-slate-900/90 text-amber-400 hover:scale-100 hover:border-slate-700 hover:text-white`} />
            <DashboardSoundToggle className={`${ICON_BTN} border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-700 hover:text-white`} />
            <OrderAlertsBell
              variant="icon"
              className="h-10 w-10 border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
              {...bell}
            />
            <button
              type="button"
              aria-label="إضافة سريعة واتساب"
              title="إضافة سريعة واتساب"
              onClick={() => run("quick-whatsapp")}
              className={`${ICON_BTN} border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
            >
              <WhatsAppIcon className="h-4 w-4" />
            </button>
            <span className="mx-1 h-6 w-px shrink-0 bg-slate-800" aria-hidden />
            <button
              type="button"
              id="toggleExpandBtn"
              aria-label="القائمة والإجراءات"
              title="القائمة والإجراءات"
              aria-expanded={actionsOpen}
              onClick={() => setActionsOpen((value) => !value)}
              className={cn(ICON_BTN, "bg-slate-900 text-slate-200 hover:bg-slate-800", actionsOpen ? "border-amber-500/50 text-amber-400" : "border-slate-700")}
            >
              <Menu className={cn("h-4 w-4 transition-transform duration-300", actionsOpen && "rotate-90")} />
            </button>
            <div ref={actionsScrollRef} className="no-scrollbar flex min-w-0 flex-1 cursor-grab items-center overflow-x-auto py-1 touch-pan-x">
              <div className={cn("flex items-center gap-2 transition-all duration-300 ease-out", actionsOpen ? "max-w-[1700px] opacity-100" : "pointer-events-none max-w-0 overflow-hidden opacity-0")}>
                <button type="button" aria-label="إضافة طلب" onClick={() => run("add-order")} className={`${DESKTOP_CHIP} bg-amber-500 font-bold text-slate-950 shadow hover:bg-amber-400`}>
                  <Plus className="h-4 w-4" />
                  إضافة طلب
                </button>
                <button type="button" aria-label="إدارة المنتجات" onClick={() => run("products")} className={`${DESKTOP_CHIP} border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20`}>
                  <Package className="h-4 w-4" />
                  إدارة المنتجات
                </button>
                <button type="button" aria-label="الطلبات المستلمة" onClick={() => run("received")} className={`${DESKTOP_CHIP} border border-teal-500/40 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20`}>
                  <CheckCircle2 className="h-4 w-4" />
                  الطلبات المستلمة
                </button>
                <button type="button" aria-label="تخصيص الواجهة" aria-haspopup="dialog" onClick={(event) => { event.stopPropagation(); run("prefs"); }} className={`${DESKTOP_CHIP} border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20`}>
                  <SlidersHorizontal className="h-4 w-4" />
                  تخصيص الواجهة
                </button>
                <Link href={`${DASHBOARD_HOME}/invoices`} aria-label="الفواتير" onClick={() => setActionsOpen(false)} className={`${DESKTOP_CHIP} border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}>
                  <Receipt className="h-4 w-4" />
                  الفواتير
                </Link>
                <Link href={`${DASHBOARD_HOME}/pricing-comparison`} aria-label="مقارنة الأسعار" onClick={() => setActionsOpen(false)} className={`${DESKTOP_CHIP} border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20`}>
                  <Scale className="h-4 w-4" />
                  مقارنة الأسعار
                </Link>
                <Link href={`${DASHBOARD_HOME}/links`} aria-label="مركز الروابط" onClick={() => setActionsOpen(false)} className={`${DESKTOP_CHIP} border border-slate-700/80 bg-[#111927] text-slate-300 hover:border-amber-500/50 hover:bg-[#162134] hover:text-amber-400`}>
                  <ExternalLink className="h-4 w-4" />
                  مركز الروابط
                </Link>
                <button type="button" aria-label="تصدير Excel" onClick={() => run("export-csv")} className={`${DESKTOP_CHIP} border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800`}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  تصدير Excel
                </button>
                <button type="button" aria-label={hideNumbers ? "إظهار كل الأرقام" : "إخفاء الأرقام"} onClick={() => run("toggle-hide")} className={`${DESKTOP_CHIP} border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20`}>
                  {hideNumbers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {hideNumbers ? "إظهار الأرقام" : "إخفاء الأرقام"}
                </button>
                <button type="button" aria-label="تصدير إحصائيات لوحة التحكم" onClick={() => run("export-metrics")} className={`${DESKTOP_CHIP} border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}>
                  <Download className="h-4 w-4" />
                  تصدير الإحصائيات
                </button>
              </div>
            </div>
          </div>

          <div dir="ltr" ref={accountRef} className="relative z-30 flex shrink-0 items-center gap-2 bg-[#0b101b] py-1 pl-1 pr-3 shadow-[-20px_0_20px_#0b101b]">
            <TeamMembersMenu />
            <button
              type="button"
              aria-label="معلومات الحساب"
              title="معلومات الحساب"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
              className="group relative flex items-center justify-center focus:outline-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-600/70 bg-[#181615] text-sm font-extrabold tracking-wider text-amber-500 shadow-md shadow-amber-500/10 transition-all duration-200 group-hover:scale-105 group-hover:border-amber-500">
                {initials}
              </span>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b101b] bg-emerald-500" />
            </button>
            {accountOpen ? (
              <AccountPopover storeName={storeName} email={profileEmail} initials={initials} onOpenProfile={openProfileEditor} />
            ) : null}
          </div>
        </div>
      </header>

      <div className="md:hidden">
        <button
          type="button"
          aria-label="إغلاق القائمة"
          tabIndex={menuOpen ? 0 : -1}
          aria-hidden={!menuOpen}
          className={cn("fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm transition-opacity duration-300", menuOpen ? "opacity-100" : "pointer-events-none opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          id="mobile-admin-menu"
          dir="rtl"
          role="dialog"
          aria-modal={menuOpen}
          aria-hidden={!menuOpen}
          aria-labelledby="mobile-menu-title"
          className={cn("fixed top-0 right-0 z-[80] flex h-full w-[290px] flex-col justify-between border-l border-slate-800 bg-[#0c1322] p-4 shadow-2xl transition-transform duration-300 ease-out", menuOpen ? "translate-x-0" : "pointer-events-none translate-x-full")}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span id="mobile-menu-title" className="text-sm font-extrabold text-white">القائمة السريعة</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-white" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => run("add-order")} className="flex w-full items-center justify-between rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span>إضافة طلب</span>
              </button>
              <button type="button" onClick={() => run("products")} className="flex w-full items-center justify-between rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2.5 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20">
                <Package className="h-4 w-4" />
                <span>إدارة المنتجات</span>
              </button>
              <button type="button" onClick={() => run("received")} className="flex w-full items-center justify-between rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2.5 text-xs font-semibold text-teal-400 transition hover:bg-teal-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <span>الطلبات المستلمة</span>
              </button>
              <button type="button" onClick={() => run("prefs")} className="flex w-full items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/20">
                <SlidersHorizontal className="h-4 w-4" />
                <span>تخصيص الواجهة</span>
              </button>
              <Link href={`${DASHBOARD_HOME}/invoices`} onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                <Receipt className="h-4 w-4" />
                <span>الفواتير</span>
              </Link>
              <Link href={`${DASHBOARD_HOME}/pricing-comparison`} onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-between rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20">
                <Scale className="h-4 w-4" />
                <span>مقارنة الأسعار</span>
              </Link>
              <Link href={`${DASHBOARD_HOME}/links`} onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-between rounded-xl border border-slate-700/80 bg-[#111927] px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-amber-500/50 hover:bg-[#162134] hover:text-amber-400">
                <ExternalLink className="h-4 w-4" />
                <span>مركز الروابط</span>
              </Link>
              <button type="button" onClick={() => run("export-csv")} className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>تصدير Excel</span>
              </button>
              <button type="button" onClick={() => run("toggle-hide")} className="flex w-full items-center justify-between rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2.5 text-xs font-semibold text-sky-400 transition hover:bg-sky-500/20">
                {hideNumbers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>{hideNumbers ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
              </button>
              <button type="button" onClick={() => run("export-metrics")} className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20">
                <Download className="h-4 w-4" />
                <span>تصدير الإحصائيات</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 transition hover:text-rose-300">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
            <button type="button" onClick={toggleDarkMode} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-amber-400" aria-label="المظهر" title="المظهر">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </aside>
      </div>

      <EditProfileModal open={profileOpen} storeName={storeName} email={profileEmail} onClose={() => setProfileOpen(false)} onSave={saveProfile} />
    </div>
  );
}
