"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ExternalLink, Menu, Scale, X } from "lucide-react";
import { ThemeToggle, WhatsAppIcon } from "@/components/Chrome";
import { DashboardSoundToggle } from "@/components/admin/DashboardSoundEngine";
import {
  AccountPopover,
  DEFAULT_PROFILE_EMAIL,
  DEFAULT_STORE_NAME,
  EditProfileModal,
  STORE_NAME_KEY,
  storeInitials,
  type PasswordUpdate,
} from "@/components/admin/EditProfileModal";
import { DASHBOARD_HOME, DASHBOARD_LOGIN } from "@/lib/admin-paths";
import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/safe-storage";

export function DashboardHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeName, setStoreName] = useState(DEFAULT_STORE_NAME);
  const [username, setUsername] = useState("");
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);

  const isHidden =
    pathname === DASHBOARD_HOME ||
    pathname === `${DASHBOARD_HOME}/` ||
    pathname === DASHBOARD_LOGIN ||
    pathname === `${DASHBOARD_LOGIN}/` ||
    pathname === "/login" ||
    pathname === "/login/";

  useEffect(() => {
    setStoreName(readStorage(STORE_NAME_KEY)?.trim() || DEFAULT_STORE_NAME);
    void fetch("/api/admin/me", { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { username?: string } | null) => setUsername(body?.username || ""))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    function onDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current?.contains(target) || mobileAccountRef.current?.contains(target)) return;
      setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [accountOpen]);

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
  }

  const profileEmail = username.includes("@") ? username : DEFAULT_PROFILE_EMAIL;
  const initials = storeInitials(storeName);

  if (isHidden) return null;

  return (
    <header dir="ltr" className="sticky top-0 z-40 w-full">
      <div dir="rtl" className="hidden items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0b101b] px-4 py-2.5 sm:flex lg:px-8">
        <div className="flex items-center gap-2">
          <Link href={DASHBOARD_HOME} className="group flex items-center gap-2" aria-label="لوحة التحكم">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-600/70 bg-[#181615] text-sm font-extrabold tracking-wider text-amber-500 shadow-md shadow-amber-500/10 transition group-hover:border-amber-500">
              CG
            </span>
            <span className="hidden text-xs font-black text-white lg:block">لوحة التحكم</span>
          </Link>
          <span className="mx-1 h-6 w-px bg-slate-800" aria-hidden />
          <Link href={`${DASHBOARD_HOME}/pricing-comparison`} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20">
            <Scale className="h-3.5 w-3.5" /> مقارنة الأسعار
          </Link>
          <Link href={`${DASHBOARD_HOME}/links`} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-[#111927] px-3 py-2 text-xs font-semibold text-amber-400 transition hover:bg-[#162134]">
            <ExternalLink className="h-3.5 w-3.5" /> مركز الروابط
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="border-slate-800 bg-slate-900/90" />
          <DashboardSoundToggle className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 text-slate-400 transition hover:border-slate-700 hover:text-white" />
          <Link href={`${DASHBOARD_HOME}#orders`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 transition hover:bg-amber-500/20" aria-label="إشعارات الطلبات" title="إشعارات الطلبات">
            <Bell className="h-4 w-4" />
          </Link>
          <a href="https://web.whatsapp.com" target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20" aria-label="واتساب" title="واتساب">
            <WhatsAppIcon className="h-4 w-4" />
          </a>
          <div className="relative z-30" ref={accountRef}>
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
                onOpenProfile={() => {
                  setAccountOpen(false);
                  setProfileOpen(true);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div dir="rtl" className="flex items-center justify-between border-b border-slate-800/80 bg-[#0b101b] px-3 py-2.5 sm:hidden">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMenuOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-[#111927] text-slate-300 transition hover:bg-slate-800 hover:text-white" aria-label="القائمة" aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="https://web.whatsapp.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400" aria-label="واتساب">
            <WhatsAppIcon className="h-4 w-4" />
          </a>
          <Link href={`${DASHBOARD_HOME}#orders`} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400" aria-label="إشعارات الطلبات">
            <Bell className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative z-30" ref={mobileAccountRef}>
          <button
            type="button"
            aria-label="معلومات الحساب"
            title="معلومات الحساب"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((value) => !value)}
            className="group relative flex items-center justify-center transition focus:outline-none active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-600/70 bg-[#181615] text-sm font-extrabold tracking-wider text-amber-500 shadow-md shadow-amber-500/10">
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
              onOpenProfile={() => {
                setAccountOpen(false);
                setProfileOpen(true);
              }}
            />
          ) : null}
        </div>
      </div>

      <div className={cn("border-b border-slate-800 bg-[#0c1322] px-4 py-3 sm:hidden", menuOpen ? "block" : "hidden")}>
        <nav className="space-y-2" aria-label="تنقل لوحة التحكم">
          <Link href={DASHBOARD_HOME} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-white">لوحة التحكم</Link>
          <Link href={`${DASHBOARD_HOME}/pricing-comparison`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/10"><Scale className="h-3.5 w-3.5" /> مقارنة الأسعار</Link>
          <Link href={`${DASHBOARD_HOME}/links`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-500/10"><ExternalLink className="h-3.5 w-3.5" /> مركز الروابط</Link>
        </nav>
      </div>
      <EditProfileModal
        open={profileOpen}
        storeName={storeName}
        email={profileEmail}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
      />
    </header>
  );
}
